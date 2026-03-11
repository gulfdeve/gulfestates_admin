"use client";

import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardCard from "@/components/dashboard/DashboardCard";
import BuyPropertyTable, {
  Property,
} from "@/components/properties/BuyPropertyTable";
import OffPlanTable from "@/components/properties/BuyOffPlanTable";
import { Suspense, useState, useMemo, useEffect } from "react";
import PropertiesFilters from "@/components/properties/PropertiesFilters";
import { sanitizeHtml } from "@/utils/htmlCleaner";
import { checkRouteAccess } from "@/utils/routeProtection";
import LoadingSpinner from "@/components/common/LoadingSpinner";

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
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "ready";
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleChecked, setRoleChecked] = useState(false);

  // Check user role and access
  useEffect(() => {
    const checkUserRole = async () => {
      const adminUser = localStorage.getItem("adminUser");
      if (adminUser) {
        try {
          const parsed = JSON.parse(adminUser);
          if (parsed.role) {
            setUserRole(parsed.role);
            setRoleChecked(true);
            if (!checkRouteAccess(pathname, parsed.role)) {
              router.push("/");
              return;
            }
            return;
          }
        } catch (e) {
          console.error("Error parsing admin user:", e);
        }
      }

      const token = localStorage.getItem("adminToken");
      if (token) {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL;
          const response = await fetch(`${API_URL}/api/auth/me`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.admin?.role) {
              setUserRole(data.data.admin.role);
              setRoleChecked(true);
              if (!checkRouteAccess(pathname, data.data.admin.role)) {
                router.push("/");
                return;
              }
              const updatedUser = { ...JSON.parse(adminUser || '{}'), role: data.data.admin.role };
              localStorage.setItem("adminUser", JSON.stringify(updatedUser));
            }
          } else {
            router.push("/");
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
          router.push("/");
        }
      } else {
        router.push("/");
      }
    };

    checkUserRole();
  }, [pathname, router]);

  const [properties, setProperties] = useState<Property[]>([]);
  const [offPlanProjects, setOffPlanProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewProperty, setViewProperty] = useState<any>(null);
  const [viewOffPlan, setViewOffPlan] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showViewOffPlanModal, setShowViewOffPlanModal] = useState(false);
  const [propertyPage, setPropertyPage] = useState(1);
  const [propertyTotal, setPropertyTotal] = useState(0);
  const [propertyTotalPages, setPropertyTotalPages] = useState(0);
  const propertyLimit = 15;
  const [filters, setFilters] = useState({
    search: "",
    status: "All Status",
    developer: "All Developers",
    location: "All Locations",
  });

  useEffect(() => {
    if (type === "ready") {
      fetchProperties(propertyPage);
    } else {
      fetchOffPlans();
    }
  }, [type, propertyPage]);

  const fetchProperties = async (page: number = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Non authentifié");
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      const response = await fetch(
        `${API_URL}/api/properties?for=buy&page=${page}&limit=${propertyLimit}&locale=fr`,
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
        const frenchProperties = data.data.items.filter((prop: any) => {
          const titleVal = prop.title?.fr ?? (typeof prop.title === "string" ? prop.title : "");
          return titleVal && typeof titleVal === "string" && titleVal.trim() !== "";
        });

        const transformedProperties: Property[] = frenchProperties.map((prop: any) => ({
          id: prop._id || prop.id,
          title: prop.title?.fr ?? (typeof prop.title === "string" ? prop.title : ""),
          title_es: prop.title?.es,
          title_fr: prop.title?.fr ?? (typeof prop.title === "string" ? prop.title : ""),
          developer: prop.agent?.name || prop.developer || "N/A",
          location: prop.location?.fr || prop.location?.en || prop.location || "",
          type: prop.type || "",
          beds: prop.beds || 0,
          price: prop.price ? `AED ${prop.price.toLocaleString()}` : "N/A",
          status: "Actif",
          addedOn: prop.createdAt
            ? new Date(prop.createdAt).toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
            : "N/A",
        }));
        setProperties(transformedProperties);
        setPropertyTotal(data.data.total ?? 0);
        setPropertyTotalPages(data.data.totalPages ?? 1);
        setPropertyPage(data.data.page ?? page);
      } else {
        setError("Échec du chargement des propriétés");
        setPropertyTotal(0);
        setPropertyTotalPages(1);
      }
    } catch (err: any) {
      setError("Erreur lors du chargement des propriétés");
      console.error("Error fetching properties:", err);
      setPropertyTotal(0);
      setPropertyTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffPlans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      // Always fetch buy off-plans for buy page (admin view - get all offplans)
      const response = await fetch(
        `${API_URL}/api/offplans?for=buy&admin=true&locale=fr`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "x-admin-view": "true",
          },
        }
      );

      const data = await response.json();

      if (data.success && data.data) {
        // Filter to only show French off-plans (those with title.fr)
        const frenchOffplans = data.data.filter((offplan: any) => {
          // Get French title from various possible structures
          let titleFr = '';

          if (typeof offplan.title === 'string') {
            // If title is a string, check if it's actually French (from backend localization)
            // But we need to check the original title object
            titleFr = offplan.languages?.title?.fr || offplan.title?.fr || '';
          } else if (offplan.languages?.title?.fr) {
            // Check languages object
            titleFr = offplan.languages.title.fr.trim();
          } else if (typeof offplan.title === 'object' && offplan.title?.fr) {
            // Check title object directly
            titleFr = offplan.title.fr.trim();
          }

          const hasFrenchTitle = titleFr !== '' && titleFr.trim() !== '';
          return hasFrenchTitle;
        });

        console.log(`📦 Filtered ${frenchOffplans.length} French offplans from ${data.data.length} total`);

        // Transform off-plans to match table format
        const transformedOffPlans: Project[] = frenchOffplans.map((offplan: any) => {
          // When locale=fr, backend returns:
          // - title: string (localized French version)
          // - languages.title: object {en, fr, es} (original)

          // Get title - handle both localized string and object structures
          const titleLocalized = typeof offplan.title === 'string' ? offplan.title : '';
          const titleObj = offplan.languages?.title || offplan.title;
          const titleFr = titleObj?.fr || titleLocalized || '';
          const titleEn = titleObj?.en || titleLocalized || '';
          const titleEs = titleObj?.es || '';

          // Get location - handle both localized string and object structures
          const locationLocalized = typeof offplan.location === 'string' ? offplan.location : '';
          const locationObj = offplan.languages?.location || offplan.location;
          const locationFr = locationObj?.fr || locationLocalized || '';
          const locationEn = locationObj?.en || locationLocalized || '';
          const locationEs = locationObj?.es || '';
          let priceValue = "N/A";
          if (offplan.priceFrom) {
            if (typeof offplan.priceFrom === 'string') {
              const priceNum = parseFloat(offplan.priceFrom.replace(/[^0-9.]/g, ''));
              if (!isNaN(priceNum)) {
                priceValue = `AED ${priceNum.toLocaleString()}`;
              } else {
                priceValue = offplan.priceFrom;
              }
            } else if (typeof offplan.priceFrom === 'number') {
              priceValue = `AED ${offplan.priceFrom.toLocaleString()}`;
            }
          }

          let mappedStatus: "Under Construction" | "Upcoming" = "Upcoming";
          if (offplan.status === "Available" || offplan.status === "Limited Units") {
            mappedStatus = "Under Construction";
          } else if (offplan.status === "Coming Soon") {
            mappedStatus = "Upcoming";
          }

          return {
            id: offplan._id || offplan.id,
            name_en: titleEn,
            name_es: titleEs,
            name_fr: titleFr, // Must have French title (already filtered)
            developer: offplan.developer || "N/A",
            location: locationFr, // Use French location (must exist since we filtered)
            type: offplan.type || "",
            completion: offplan.handover || "N/A",
            status: mappedStatus,
            progress: 50,
            units: 0, // Floor plans removed - using default value
            price: priceValue,
          };
        });
        setOffPlanProjects(transformedOffPlans);
      }
    } catch (err: any) {
      console.error("Error fetching off-plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Non authentifié");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      // Pass locale=fr to delete only French version
      const response = await fetch(`${API_URL}/api/properties/${id}?locale=fr`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Propriété supprimée avec succès");
        fetchProperties();
      } else {
        toast.error(data.message || "Échec de la suppression de la propriété");
      }
    } catch (err: any) {
      console.error("Error deleting property:", err);
      toast.error("Erreur lors de la suppression de la propriété. Veuillez réessayer.");
    }
  };

  const handleView = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Non authentifié");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/properties/${id}?locale=fr`, {
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
        toast.error("Échec du chargement des détails de la propriété");
      }
    } catch (err: any) {
      console.error("Error fetching property:", err);
      toast.error("Erreur lors du chargement de la propriété");
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/fr/properties/edit?id=${id}`);
  };

  const handleViewOffPlan = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Non authentifié");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/offplans/${id}?locale=fr`, {
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
        toast.error("Échec du chargement des détails du projet");
      }
    } catch (err: any) {
      console.error("Error fetching off-plan:", err);
      toast.error("Erreur lors du chargement du projet");
    }
  };

  const handleEditOffPlan = (id: string) => {
    router.push(`/fr/off-plans/edit?id=${id}`);
  };

  const handleDeleteOffPlan = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Non authentifié");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      // Pass locale=fr to delete only French version
      const response = await fetch(`${API_URL}/api/offplans/${id}?locale=fr`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        toast.error(`Échec de la suppression: ${errorData.message || response.statusText}`);
        console.error("Delete failed:", response.status, errorData);
        return;
      }

      const data = await response.json();
      console.log("Delete response:", data);

      if (data.success) {
        // Refresh off-plans to get updated list
        await fetchOffPlans();
        toast.success("Projet supprimé avec succès");
      } else {
        toast.error(data.message || "Échec de la suppression du projet");
      }
    } catch (err: any) {
      console.error("Error deleting off-plan:", err);
      toast.error(`Erreur lors de la suppression du projet: ${err.message || "Veuillez réessayer."}`);
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
        { title: "Total Propriétés", value: propertyTotal },
        { title: "Actives", value: properties.filter(p => p.status === "Actif").length },
      ]
      : [
        { title: "Total Projets", value: offPlanProjects.length },
        { title: "En Construction", value: offPlanProjects.filter(p => p.status === "Under Construction").length },
      ];

  // Check role access before rendering
  if (!roleChecked) {
    return (
      <LoadingSpinner message="Checking access..." />
    );
  }

  if (userRole && !checkRouteAccess(pathname, userRole)) {
    return (
      <div className="text-black/80 p-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">
            Access denied. You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-3 text-black/70">
        <LoadingSpinner message="Chargement des propriétés..." />
      </div>
    );
  }

  return (
    <div className="mt-3 text-black/70">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="mb-3">
        <PropertiesFilters onFilterChange={setFilters} />
      </div>
      {/* Tabs */}
      <nav className="flex gap-3 mt-2">
        <Link
          href={`${pathname}?type=ready`}
          className={`px-4 py-1.5 font-medium rounded-[10px] ${type === "ready"
            ? "text-white/90 bg-[url('/images/bg-blue-grad.jpg')] bg-cover bg-center"
            : "text-gray-600 border border-gray-400"
            } transition`}
        >
          Propriétés Prêtes
        </Link>

        <Link
          href={`${pathname}?type=offplan`}
          className={`px-4 py-1.5 font-medium rounded-[10px] ${type === "offplan"
            ? "text-white bg-[url('/images/bg-blue-grad.jpg')] bg-cover bg-center"
            : "text-gray-600 border border-gray-400"
            } transition`}
        >
          Propriétés Off Plan
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
              onEditLink={`/fr/properties/edit`}
              data={filteredProperties}
              lang="fr"
              onDelete={handleDelete}
              onView={handleView}
              onEdit={handleEdit}
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600">
                  Affichage {propertyTotal === 0 ? 0 : (propertyPage - 1) * propertyLimit + 1}–
                  {Math.min(propertyPage * propertyLimit, propertyTotal)} sur {propertyTotal}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { if (propertyPage > 1) setPropertyPage(propertyPage - 1); }}
                    disabled={propertyPage <= 1 || propertyTotalPages <= 0}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (propertyPage < propertyTotalPages) setPropertyPage(propertyPage + 1); }}
                    disabled={propertyPage >= propertyTotalPages || propertyTotalPages <= 0}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
          </>
        ) : (
          <OffPlanTable
            onEditLink={`/fr/off-plans/edit`}
            lang="fr"
            data={filteredOffPlanProjects}
            onDelete={handleDeleteOffPlan}
            onView={handleViewOffPlan}
            onEdit={handleEditOffPlan}
          />
        )}
      </div>

      {/* View Property Modal */}
      {showViewModal && viewProperty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Détails de la Propriété</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewProperty(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <strong>Titre (EN):</strong> {viewProperty.title?.en || viewProperty.title || "N/A"}
              </div>
              {viewProperty.title?.es && (
                <div>
                  <strong>Titre (ES):</strong> {viewProperty.title.es}
                </div>
              )}
              {viewProperty.title?.fr && (
                <div>
                  <strong>Titre (FR):</strong> {viewProperty.title.fr}
                </div>
              )}
              <div>
                <strong>Emplacement:</strong> {viewProperty.location?.fr || viewProperty.location?.en || viewProperty.location || "N/A"}
              </div>
              <div>
                <strong>Type:</strong> {viewProperty.type || "N/A"}
              </div>
              <div>
                <strong>Prix:</strong> {viewProperty.price ? `AED ${viewProperty.price.toLocaleString()}` : "N/A"}
              </div>
              <div>
                <strong>Chambres:</strong> {viewProperty.beds || "N/A"}
              </div>
              <div>
                <strong>Salles de bain:</strong> {viewProperty.baths || "N/A"}
              </div>
              <div>
                <strong>Taille:</strong> {viewProperty.size ? `${viewProperty.size} sqft` : "N/A"}
              </div>
              {viewProperty.description && (
                <div>
                  <strong>Description:</strong>
                  <div
                    className="mt-1 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(viewProperty.description.fr || viewProperty.description.en || viewProperty.description || "N/A") }}
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewProperty(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Off-Plan Modal */}
      {showViewOffPlanModal && viewOffPlan && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Détails du Projet</h2>
              <button
                onClick={() => {
                  setShowViewOffPlanModal(false);
                  setViewOffPlan(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <strong>Titre (EN):</strong> {viewOffPlan.title?.en || viewOffPlan.title || "N/A"}
              </div>
              {viewOffPlan.title?.es && (
                <div>
                  <strong>Titre (ES):</strong> {viewOffPlan.title.es}
                </div>
              )}
              {viewOffPlan.title?.fr && (
                <div>
                  <strong>Titre (FR):</strong> {viewOffPlan.title.fr}
                </div>
              )}
              <div>
                <strong>Développeur:</strong> {viewOffPlan.developer || "N/A"}
              </div>
              <div>
                <strong>Emplacement:</strong> {viewOffPlan.location?.fr || viewOffPlan.location?.en || viewOffPlan.location || "N/A"}
              </div>
              <div>
                <strong>Type:</strong> {viewOffPlan.type || "N/A"}
              </div>
              <div>
                <strong>Livraison:</strong> {viewOffPlan.handover || "N/A"}
              </div>
              <div>
                <strong>Prix À Partir De:</strong> {viewOffPlan.priceFrom || "N/A"}
              </div>
              <div>
                <strong>Plan de Paiement:</strong> {viewOffPlan.paymentPlan || "N/A"}
              </div>
              <div>
                <strong>Statut:</strong> {viewOffPlan.status || "N/A"}
              </div>
              {viewOffPlan.bedRange && (
                <div>
                  <strong>Gamme de Chambres:</strong> {viewOffPlan.bedRange}
                </div>
              )}
              {viewOffPlan.bathRange && (
                <div>
                  <strong>Gamme de Salles de Bain:</strong> {viewOffPlan.bathRange}
                </div>
              )}
              {viewOffPlan.sizeRange && (
                <div>
                  <strong>Gamme de Taille:</strong> {viewOffPlan.sizeRange}
                </div>
              )}
              {viewOffPlan.description && (
                <div>
                  <strong>Description:</strong>
                  <div
                    className="mt-1 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(viewOffPlan.description.fr || viewOffPlan.description.en || viewOffPlan.description || "N/A") }}
                  />
                </div>
              )}
              {viewOffPlan.amenities && viewOffPlan.amenities.length > 0 && (
                <div>
                  <strong>Équipements:</strong>
                  <p className="mt-1">{viewOffPlan.amenities.join(", ")}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowViewOffPlanModal(false);
                  setViewOffPlan(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuyPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement des propriétés..." />}>
      <BuyPageContent />
    </Suspense>
  );
}
