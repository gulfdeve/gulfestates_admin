"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import DashboardCard from "@/components/dashboard/DashboardCard";
import BuyPropertyTable, {
  Property,
} from "@/components/properties/BuyPropertyTable";
import OffPlanTable from "@/components/properties/BuyOffPlanTable";
import { Suspense, useState, useMemo, useEffect, useCallback } from "react";
import PropertiesFilters from "@/components/properties/PropertiesFilters";
import { sanitizeHtml } from "@/utils/htmlCleaner";
import RouteGuard from "@/components/auth/RouteGuard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { apiUrl } from "@/utils/apiUrl";

type Project = {
  id: string;
  name_en: string;
  name_es?: string;
  name_fr?: string;
  developer: string;
  location: string;
  type: string;
  completion: string;
  status: "Under Construction" | "Upcoming";
  progress: number;
  units: number;
  price: string;
};

function BuyPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "offplan";

  const [properties, setProperties] = useState<Property[]>([]);
  const [offPlanProjects, setOffPlanProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewProperty, setViewProperty] = useState<any>(null);
  const [viewOffPlan, setViewOffPlan] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showViewOffPlanModal, setShowViewOffPlanModal] = useState(false);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [selectedOffPlanIds, setSelectedOffPlanIds] = useState<string[]>([]);
  const [offPlanPage, setOffPlanPage] = useState(1);
  const [offPlanTotal, setOffPlanTotal] = useState(0);
  const [offPlanTotalPages, setOffPlanTotalPages] = useState(0);
  const offPlanLimit = 100;
  const [propertyPage, setPropertyPage] = useState(1);
  const [propertyTotal, setPropertyTotal] = useState(0);
  const [propertyTotalPages, setPropertyTotalPages] = useState(0);
  const propertyLimit = 15;
  const [filters, setFilters] = useState<{
    search: string;
    status: string;
    developer: string;
    location: string;
    for?: string;
  }>({
    search: "",
    status: "All Status",
    developer: "All Developers",
    location: "All Locations",
    for: "Buy", // Default to Buy for buy page
  });

  const fetchProperties = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);
        const token = localStorage.getItem("adminToken");
        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const response = await fetch(
          apiUrl(
            `/api/properties?for=buy&page=${page}&limit=${propertyLimit}&locale=en`
          ),
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (data.success && data.data?.items) {
          const items = data.data.items;
          const englishProperties = items.filter((prop: any) => {
            const titleEn = prop.title?.en || prop.title;
            if (!titleEn || (typeof titleEn === "string" && !titleEn.trim()))
              return false;
            if (typeof prop.title === "object" && prop.title !== null) {
              return prop.title.en && prop.title.en.trim() !== "";
            }
            return true;
          });

          const transformedProperties: Property[] = englishProperties.map(
            (prop: any) => ({
              id: prop._id || prop.id,
              title: prop.title?.en || prop.title || "",
              title_es: prop.title?.es,
              title_fr: prop.title?.fr,
              developer: prop.agent?.name || prop.developer || "N/A",
              location: prop.location?.en || prop.location || "",
              type: prop.type || "",
              beds: prop.beds || 0,
              price: prop.price ? `AED ${prop.price.toLocaleString()}` : "N/A",
              status: "Active",
              addedOn: prop.createdAt
                ? new Date(prop.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "N/A",
            })
          );
          setProperties(transformedProperties);
          setPropertyTotal(data.data.total ?? 0);
          setPropertyTotalPages(data.data.totalPages ?? 1);
          setPropertyPage(data.data.page ?? page);
        } else {
          setError("Failed to load properties");
          setPropertyTotal(0);
          setPropertyTotalPages(1);
        }
      } catch (err: any) {
        setError("Error loading properties");
        console.error("Error fetching properties:", err);
        setPropertyTotal(0);
        setPropertyTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [propertyLimit]
  );

  const fetchOffPlans = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const response = await fetch(
        apiUrl(
          `/api/offplans?for=buy&admin=true&locale=en&page=${page}&limit=${offPlanLimit}`
        ),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "x-admin-view": "true",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", response.status, errorData);
        setError(
          `Failed to load off-plans: ${response.status} ${
            errorData.message || response.statusText
          }`
        );
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log("Offplan API Response:", data);

      if (data.success && data.data) {
        setOffPlanTotal(data.total ?? 0);
        setOffPlanTotalPages(data.totalPages ?? 1);
        setOffPlanPage(data.page ?? page);
        console.log(
          `📦 Received ${data.data.length} offplans from API (page ${data.page}, total ${data.total})`
        );

        // For admin view, show all offplans that have any title
        // Filter to show English offplans (those with title.en) but be lenient
        const englishOffplans = data.data.filter((offplan: any) => {
          // Get English title from various possible structures
          let titleEn = "";

          if (typeof offplan.title === "string") {
            // Title is already localized to English string
            titleEn = offplan.title.trim();
          } else if (offplan.languages?.title?.en) {
            // Check languages object
            titleEn = offplan.languages.title.en.trim();
          } else if (typeof offplan.title === "object" && offplan.title?.en) {
            // Check title object directly
            titleEn = offplan.title.en.trim();
          }

          const hasEnglishTitle = titleEn !== "";

          if (!hasEnglishTitle) {
            console.log(
              "❌ Offplan excluded - no English title:",
              offplan._id,
              {
                title: offplan.title,
                languages: offplan.languages,
              }
            );
          } else {
            console.log("✅ Offplan included:", offplan._id, titleEn);
          }

          return hasEnglishTitle;
        });

        console.log(
          `✅ Filtered ${englishOffplans.length} English offplans from ${data.data.length} total`
        );

        // Transform off-plans to match table format
        const transformedOffPlans: Project[] = englishOffplans.map(
          (offplan: any) => {
            // Extract price number from priceFrom string if it's a string
            let priceValue = "N/A";
            if (offplan.priceFrom) {
              if (typeof offplan.priceFrom === "string") {
                const priceNum = parseFloat(
                  offplan.priceFrom.replace(/[^0-9.]/g, "")
                );
                if (!isNaN(priceNum)) {
                  priceValue = `AED ${priceNum.toLocaleString()}`;
                } else {
                  priceValue = offplan.priceFrom;
                }
              } else if (typeof offplan.priceFrom === "number") {
                priceValue = `AED ${offplan.priceFrom.toLocaleString()}`;
              }
            }

            // Map backend status to table status
            let mappedStatus: "Under Construction" | "Upcoming" = "Upcoming";
            if (
              offplan.status === "Available" ||
              offplan.status === "Limited Units"
            ) {
              mappedStatus = "Under Construction";
            } else if (offplan.status === "Coming Soon") {
              mappedStatus = "Upcoming";
            }

            // Get title from localized string or languages object
            const titleEn =
              typeof offplan.title === "string"
                ? offplan.title
                : offplan.languages?.title?.en || offplan.title?.en || "";
            const titleEs = offplan.languages?.title?.es || offplan.title?.es;
            const titleFr = offplan.languages?.title?.fr || offplan.title?.fr;

            // Get location from localized string or languages object
            const locationEn =
              typeof offplan.location === "string"
                ? offplan.location
                : offplan.languages?.location?.en || offplan.location?.en || "";

            return {
              id: offplan._id || offplan.id,
              name_en: titleEn,
              name_es: titleEs,
              name_fr: titleFr,
              developer: offplan.developer || "N/A",
              location: locationEn,
              type: offplan.type || "",
              completion: offplan.handover || "N/A",
              status: mappedStatus,
              progress: 50, // Default progress - backend doesn't have this field yet
              units: 0, // Floor plans removed - using default value
              price: priceValue,
            };
          }
        );
        setOffPlanProjects(transformedOffPlans);
      } else {
        setError("Failed to load off-plans");
      }
    } catch (err: any) {
      setError("Error loading off-plans");
      console.error("Error fetching off-plans:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (type === "ready") {
      fetchProperties(propertyPage);
    } else {
      setOffPlanPage(1);
      fetchOffPlans(1);
    }
  }, [type, propertyPage]);

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      // Pass locale=en to delete only English version
      const response = await fetch(apiUrl(`/api/properties/${id}?locale=en`),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Property deleted successfully");
        fetchProperties(propertyPage);
      } else {
        toast.error(data.message || "Failed to delete property");
      }
    } catch (err: any) {
      console.error("Error deleting property:", err);
      toast.error("Error deleting property. Please try again.");
    }
  };

  const handleView = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(apiUrl(`/api/properties/${id}?locale=en`), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setViewProperty(data.data);
        setShowViewModal(true);
      } else {
        toast.error("Failed to load property details");
      }
    } catch (err: any) {
      console.error("Error fetching property:", err);
      toast.error("Error loading property");
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/en/properties/edit?id=${id}`);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewProperty(null);
  };

  const handleEditOffPlan = (id: string) => {
    router.push(`/en/off-plans/edit?id=${id}`);
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      // Delete all selected properties with locale=en
      const deletePromises = ids.map((id) =>
        fetch(apiUrl(`/api/properties/${id}?locale=en`), {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      );

      const responses = await Promise.all(deletePromises);
      const results = await Promise.all(responses.map((res) => res.json()));

      // Check if all deletions were successful
      const allSuccess = results.every((result) => result.success);

      if (allSuccess) {
        fetchProperties(propertyPage);
        setSelectedPropertyIds([]);
        toast.success(
          `Successfully deleted ${ids.length} propert${
            ids.length > 1 ? "ies" : "y"
          }`
        );
      } else {
        const failedCount = results.filter((r) => !r.success).length;
        toast.error(
          `Failed to delete ${failedCount} propert${
            failedCount > 1 ? "ies" : "y"
          }`
        );
      }
    } catch (err: any) {
      console.error("Error deleting properties:", err);
      toast.error("Error deleting properties. Please try again.");
    }
  };

  const handleDeleteOffPlan = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      // Pass locale=en to delete only English version
      const response = await fetch(apiUrl(`/api/offplans/${id}?locale=en`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `HTTP ${response.status}` }));
        toast.error(
          `Failed to delete off-plan: ${
            errorData.message || response.statusText
          }`
        );
        console.error("Delete failed:", response.status, errorData);
        return;
      }

      const data = await response.json();
      console.log("Delete response:", data);

      if (data.success) {
        // Refresh off-plans (stay on current page or go back if empty)
        await fetchOffPlans(offPlanPage);
        toast.success("Off-plan deleted successfully");
      } else {
        toast.error(data.message || "Failed to delete off-plan project");
      }
    } catch (err: any) {
      console.error("Error deleting off-plan:", err);
      toast.error(
        `Error deleting off-plan project: ${err.message || "Please try again."}`
      );
    }
  };

  const handleBulkDeleteOffPlans = async (ids: string[]) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      // Delete all selected off-plans with locale=en
      const deletePromises = ids.map((id) =>
        fetch(apiUrl(`/api/offplans/${id}?locale=en`), {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      );

      const responses = await Promise.all(deletePromises);
      const results = await Promise.all(responses.map((res) => res.json()));

      // Check if all deletions were successful
      const allSuccess = results.every((result) => result.success);

      if (allSuccess) {
        // Refresh off-plans (stay on current page)
        fetchOffPlans(offPlanPage);
        setSelectedOffPlanIds([]);
        toast.success(
          `Successfully deleted ${ids.length} off-plan project${
            ids.length > 1 ? "s" : ""
          }`
        );
      } else {
        const failedCount = results.filter((r) => !r.success).length;
        toast.error(
          `Failed to delete ${failedCount} off-plan project${
            failedCount > 1 ? "s" : ""
          }`
        );
      }
    } catch (err: any) {
      console.error("Error deleting off-plans:", err);
      toast.error("Error deleting off-plans. Please try again.");
    }
  };

  const handleViewOffPlan = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch(apiUrl(`/api/offplans/${id}?locale=en`), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setViewOffPlan(data.data);
        setShowViewOffPlanModal(true);
      } else {
        toast.error("Failed to load off-plan details");
      }
    } catch (err: any) {
      console.error("Error fetching off-plan:", err);
      toast.error("Error loading off-plan");
    }
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const { search, status, developer, location } = filters;

      if (
        search &&
        !property.title.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (status !== "All Status" && property.status !== status) return false;
      if (developer !== "All Developers" && property.developer !== developer)
        return false;
      if (location !== "All Locations" && property.location !== location)
        return false;
      return true;
    });
  }, [properties, filters]);

  const filteredOffPlanProjects = useMemo(() => {
    return offPlanProjects.filter((project) => {
      const { search, status, developer, location } = filters;
      if (
        search &&
        !project.name_en.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (status !== "All Status" && project.status !== status) return false;
      if (developer !== "All Developers" && project.developer !== developer)
        return false;
      if (location !== "All Locations" && project.location !== location)
        return false;
      return true;
    });
  }, [offPlanProjects, filters]);

  const dashboardStats =
    type === "ready"
      ? [
          { title: "Total Properties", value: propertyTotal },
          {
            title: "Active",
            value: properties.filter((p) => p.status === "Active").length,
          },
        ]
      : [
          { title: "Total Projects", value: offPlanTotal },
          {
            title: "Under Construction",
            value: offPlanProjects.filter(
              (p) => p.status === "Under Construction"
            ).length,
          },
        ];

  if (loading) {
    return (
      <RouteGuard>
        <div className="mt-3 text-black/70">
          <LoadingSpinner message="Loading properties..." />
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard>
      <div className="mt-3 text-black/70">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-3">
          <PropertiesFilters
            onFilterChange={setFilters}
            showForFilter={type === "offplan"}
            forFilterOptions={["Buy"]} // Only show Buy option for buy page
          />
        </div>
        {/* Tabs */}
        <nav className="flex gap-3 mt-2">
          <Link
            href={`${pathname}?type=ready`}
            className={`px-4 py-1.5 font-medium rounded-[10px] ${
              type === "ready"
                ? "text-white/90 bg-[url('/images/bg-blue-grad.jpg')] bg-cover bg-center"
                : "text-gray-600 border border-gray-400"
            } transition`}
          >
            Ready Properties
          </Link>

          <Link
            href={`${pathname}?type=offplan`}
            className={`px-4 py-1.5 font-medium rounded-[10px] ${
              type === "offplan"
                ? "text-white bg-[url('/images/bg-blue-grad.jpg')] bg-cover bg-center"
                : "text-gray-600 border border-gray-400"
            } transition`}
          >
            Off Plan Properties
          </Link>
        </nav>

        {/* Dashboard Cards */}
        <div className="mt-4 space-y-5">
          <div className="flex gap-2">
            {dashboardStats.map((stat, i) => (
              <DashboardCard key={i} title={stat.title} value={stat.value} />
            ))}
          </div>
          {type === "ready" ? (
            <>
              <BuyPropertyTable
                onEditLink={`/en/properties/edit`}
                data={filteredProperties}
                lang="en"
                onDelete={handleDelete}
                onView={handleView}
                onEdit={handleEdit}
                onBulkDelete={handleBulkDelete}
                selectedIds={selectedPropertyIds}
                onSelectionChange={setSelectedPropertyIds}
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600">
                  Showing{" "}
                  {propertyTotal === 0
                    ? 0
                    : (propertyPage - 1) * propertyLimit + 1}
                  –{Math.min(propertyPage * propertyLimit, propertyTotal)} of{" "}
                  {propertyTotal}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (propertyPage > 1) setPropertyPage(propertyPage - 1);
                    }}
                    disabled={propertyPage <= 1 || propertyTotalPages <= 0}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (propertyPage < propertyTotalPages)
                        setPropertyPage(propertyPage + 1);
                    }}
                    disabled={
                      propertyPage >= propertyTotalPages ||
                      propertyTotalPages <= 0
                    }
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <OffPlanTable
                onEditLink={`/en/off-plans/edit`}
                lang="en"
                data={filteredOffPlanProjects}
                onDelete={handleDeleteOffPlan}
                onView={handleViewOffPlan}
                onEdit={handleEditOffPlan}
                onBulkDelete={handleBulkDeleteOffPlans}
                selectedIds={selectedOffPlanIds}
                onSelectionChange={setSelectedOffPlanIds}
              />
              {/* Off-plan pagination: show total and prev/next */}
              {offPlanTotal > 0 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600">
                    Showing {(offPlanPage - 1) * offPlanLimit + 1}–
                    {Math.min(offPlanPage * offPlanLimit, offPlanTotal)} of{" "}
                    {offPlanTotal}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const prev = offPlanPage - 1;
                        if (prev >= 1) {
                          setOffPlanPage(prev);
                          fetchOffPlans(prev);
                        }
                      }}
                      disabled={offPlanPage <= 1}
                      className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = offPlanPage + 1;
                        if (next <= offPlanTotalPages) {
                          setOffPlanPage(next);
                          fetchOffPlans(next);
                        }
                      }}
                      disabled={offPlanPage >= offPlanTotalPages}
                      className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* View Modal */}
        {showViewModal && viewProperty && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={closeViewModal}
          >
            <div
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Property Details</h2>
                  <button
                    onClick={closeViewModal}
                    aria-label="Close"
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Title (EN)</p>
                  <p className="text-gray-900 font-medium">{viewProperty.title?.en || viewProperty.title || "N/A"}</p>
                </div>
                {viewProperty.title?.es && (
                  <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Title (ES)</p>
                    <p className="text-gray-900">{viewProperty.title.es}</p>
                  </div>
                )}
                {viewProperty.title?.fr && (
                  <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Title (FR)</p>
                    <p className="text-gray-900">{viewProperty.title.fr}</p>
                  </div>
                )}
                <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Location</p>
                  <p className="text-gray-900">{viewProperty.location?.en || viewProperty.location || "N/A"}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type</p>
                  <p className="text-gray-900">{viewProperty.type || "N/A"}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Price</p>
                  <p className="text-gray-900">{viewProperty.price ? `AED ${viewProperty.price.toLocaleString()}` : "N/A"}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Beds</p>
                  <p className="text-gray-900">{viewProperty.beds || "N/A"}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Baths</p>
                  <p className="text-gray-900">{viewProperty.baths || "N/A"}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Size</p>
                  <p className="text-gray-900">{viewProperty.size ? `${viewProperty.size} sqft` : "N/A"}</p>
                </div>
                {viewProperty.description && (
                  <div className="sm:col-span-2 p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs font-medium text-primary/80 uppercase tracking-wider mb-1">Description</p>
                    <div
                      className="prose prose-sm max-w-none text-gray-900"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(
                          viewProperty.description.en ||
                            viewProperty.description ||
                            "N/A"
                        ),
                      }}
                    />
                  </div>
                )}
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={closeViewModal}
                  className="px-5 py-2.5 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Off-Plan Modal */}
        {showViewOffPlanModal && viewOffPlan && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => {
              setShowViewOffPlanModal(false);
              setViewOffPlan(null);
            }}
          >
            <div
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Off-Plan Project Details</h2>
                  <button
                    onClick={() => {
                      setShowViewOffPlanModal(false);
                      setViewOffPlan(null);
                    }}
                    aria-label="Close"
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-4">
                <div>
                  <strong>Title (EN):</strong>{" "}
                  {viewOffPlan.title?.en || viewOffPlan.title || "N/A"}
                </div>
                {viewOffPlan.title?.es && (
                  <div>
                    <strong>Title (ES):</strong> {viewOffPlan.title.es}
                  </div>
                )}
                {viewOffPlan.title?.fr && (
                  <div>
                    <strong>Title (FR):</strong> {viewOffPlan.title.fr}
                  </div>
                )}
                <div>
                  <strong>Developer:</strong> {viewOffPlan.developer || "N/A"}
                </div>
                <div>
                  <strong>Location:</strong>{" "}
                  {viewOffPlan.location?.en || viewOffPlan.location || "N/A"}
                </div>
                <div>
                  <strong>Type:</strong> {viewOffPlan.type || "N/A"}
                </div>
                <div>
                  <strong>Handover:</strong> {viewOffPlan.handover || "N/A"}
                </div>
                <div>
                  <strong>Price From:</strong> {viewOffPlan.priceFrom || "N/A"}
                </div>
                <div>
                  <strong>Payment Plan:</strong>{" "}
                  {viewOffPlan.paymentPlan || "N/A"}
                </div>
                <div>
                  <strong>Status:</strong> {viewOffPlan.status || "N/A"}
                </div>
                {viewOffPlan.bedRange && (
                  <div>
                    <strong>Bed Range:</strong> {viewOffPlan.bedRange}
                  </div>
                )}
                {viewOffPlan.bathRange && (
                  <div>
                    <strong>Bath Range:</strong> {viewOffPlan.bathRange}
                  </div>
                )}
                {viewOffPlan.sizeRange && (
                  <div>
                    <strong>Size Range:</strong> {viewOffPlan.sizeRange}
                  </div>
                )}
                {viewOffPlan.description && (
                  <div>
                    <strong>Description:</strong>
                    <div
                      className="mt-1 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(
                          viewOffPlan.description.en ||
                            viewOffPlan.description ||
                            "N/A"
                        ),
                      }}
                    />
                  </div>
                )}
                {viewOffPlan.amenities && viewOffPlan.amenities.length > 0 && (
                  <div>
                    <strong>Amenities:</strong>
                    <p className="mt-1">{viewOffPlan.amenities.join(", ")}</p>
                  </div>
                )}
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowViewOffPlanModal(false);
                    setViewOffPlan(null);
                  }}
                  className="px-5 py-2.5 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}

export default function BuyPage() {
  return (
    <Suspense
      fallback={<LoadingSpinner fullPage message="Loading properties..." />}
    >
      <BuyPageContent />
    </Suspense>
  );
}
