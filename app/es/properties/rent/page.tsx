"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import DashboardCard from "@/components/dashboard/DashboardCard";
import PropertiesFilters from "@/components/properties/PropertiesFilters";
import RentTable, { Property } from "@/components/properties/rent/RentTable";
import OffPlanTable from "@/components/properties/BuyOffPlanTable";
import RentPropertyViewModal from "@/components/properties/rent/RentPropertyViewModal";
import { useMemo, useState, useEffect, useCallback } from "react";
import RouteGuard from "@/components/auth/RouteGuard";
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

export default function RentPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "ready";

  const [properties, setProperties] = useState<Property[]>([]);
  const [offPlanProjects, setOffPlanProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 15;
  const [offPlanPage, setOffPlanPage] = useState(1);
  const [offPlanTotal, setOffPlanTotal] = useState(0);
  const [offPlanTotalPages, setOffPlanTotalPages] = useState(0);
  const offPlanLimit = 15;
  const [viewProperty, setViewProperty] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [selectedOffPlanIds, setSelectedOffPlanIds] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "All Status",
    developer: "All Developers",
    location: "All Locations",
  });

  const fetchOffPlans = useCallback(async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("No autenticado");
        setLoading(false);
        return;
      }
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${API_URL}/api/offplans?for=rent&admin=true&locale=es&page=${pageNum}&limit=${offPlanLimit}`,
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
        const spanishOffplans = (data.data || []).filter((offplan: any) => {
          const titleEs = typeof offplan.title === "string"
            ? (offplan.languages?.title?.es || offplan.title?.es || "")
            : (offplan.languages?.title?.es || offplan.title?.es || "");
          return titleEs && typeof titleEs === "string" && titleEs.trim() !== "";
        });
        const transformedOffPlans: Project[] = spanishOffplans.map((offplan: any) => {
          let priceValue = "N/A";
          if (offplan.priceFrom) {
            if (typeof offplan.priceFrom === "string") {
              const priceNum = parseFloat(offplan.priceFrom.replace(/[^0-9.]/g, ""));
              priceValue = !isNaN(priceNum) ? `AED ${priceNum.toLocaleString()}` : offplan.priceFrom;
            } else if (typeof offplan.priceFrom === "number") {
              priceValue = `AED ${offplan.priceFrom.toLocaleString()}`;
            }
          }
          const titleObj = offplan.languages?.title || offplan.title;
          const titleEs = titleObj?.es || (typeof offplan.title === "string" ? offplan.title : "");
          const locationObj = offplan.languages?.location || offplan.location;
          const locationEs = locationObj?.es || (typeof offplan.location === "string" ? offplan.location : "");
          return {
            id: offplan._id || offplan.id,
            name_en: titleObj?.en,
            name_es: titleEs,
            name_fr: titleObj?.fr,
            developer: offplan.developer || "N/A",
            location: locationEs,
            type: offplan.type || "",
            completion: offplan.handover || "N/A",
            status: offplan.status === "Available" || offplan.status === "Limited Units" ? "Under Construction" : "Upcoming",
            progress: 50,
            units: 0,
            price: priceValue,
          };
        });
        setOffPlanProjects(transformedOffPlans);
        setOffPlanTotal(data.total ?? 0);
        setOffPlanTotalPages(data.totalPages ?? 1);
        setOffPlanPage(data.page ?? pageNum);
      }
    } catch (err: any) {
      setError("Error al cargar proyectos");
      console.error("Error fetching off-plans:", err);
    } finally {
      setLoading(false);
    }
  }, [offPlanLimit]);

  useEffect(() => {
    if (type === "ready") {
      fetchProperties(page);
    } else {
      setOffPlanPage(1);
      fetchOffPlans(1);
    }
  }, [type, page]);

  const fetchProperties = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("No autenticado");
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      const response = await fetch(
        `${API_URL}/api/properties?for=rent&page=${pageNum}&limit=${limit}&locale=es`,
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
        const spanishProperties = items.filter((prop: any) => {
          const titleVal = prop.title?.es ?? (typeof prop.title === "string" ? prop.title : "");
          return titleVal && typeof titleVal === "string" && titleVal.trim() !== "";
        });

        const transformedProperties: Property[] = spanishProperties.map((prop: any) => ({
          id: prop._id || prop.id,
          title: prop.title?.en || prop.title || "",
          title_es: prop.title?.es ?? (typeof prop.title === "string" ? prop.title : ""),
          title_fr: prop.title?.fr,
          location: prop.location?.es || prop.location?.en || prop.location || "",
          type: prop.type || "",
          beds: prop.beds || 0,
          monthlyRent: prop.price ? `AED ${prop.price.toLocaleString()}` : "N/A",
          status: "Alquilada",
          tenant: "N/A",
          leaseStart: "N/A",
          leaseEnd: "N/A",
          rentDuration: prop.rentDuration,
        }));
        setProperties(transformedProperties);
        setTotal(data.data.total ?? 0);
        setTotalPages(data.data.totalPages ?? 1);
        setPage(data.data.page ?? pageNum);
      } else {
        setError("Error al cargar propiedades");
        setTotal(0);
        setTotalPages(0);
      }
    } catch (err: any) {
      setError("Error al cargar propiedades");
      console.error("Error fetching properties:", err);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const { search, status, developer, location } = filters;
      const searchIn = [property.title, property.title_es].filter(Boolean).join(" ");
      if (search && !searchIn.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (status !== "All Status" && property.status !== status) return false;
      if (location !== "All Locations" && property.location !== location)
        return false;
      return true;
    });
  }, [properties, filters]);

  const filteredOffPlanProjects = useMemo(() => {
    return offPlanProjects.filter((project) => {
      const { search } = filters;
      if (search) {
        const searchIn = [project.name_en, project.name_fr, project.name_es, project.developer, project.location].filter(Boolean).join(" ");
        return searchIn.toLowerCase().includes(search.toLowerCase());
      }
      return true;
    });
  }, [offPlanProjects, filters]);

  const dashboardStats = useMemo(() => {
    if (type === "ready") {
      return [
        { title: "Total Propiedades", value: total },
        { title: "Alquiladas", value: properties.filter(p => p.status === "Alquilada").length },
      ];
    }
    return [
      { title: "Total Fuera de Plan", value: offPlanTotal },
      { title: "En construcción", value: offPlanProjects.filter(p => p.status === "Under Construction").length },
    ];
  }, [type, total, properties, offPlanTotal, offPlanProjects]);

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("No autenticado");
        return;
      }
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/properties/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Propiedad eliminada");
        fetchProperties(page);
      } else {
        toast.error(data.message || "Error al eliminar");
      }
    } catch (err: any) {
      console.error("Error deleting property:", err);
      toast.error("Error al eliminar");
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("No autenticado");
        return;
      }
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const responses = await Promise.all(
        ids.map((id) =>
          fetch(`${API_URL}/api/properties/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          })
        )
      );
      const results = await Promise.all(responses.map((r) => r.json()));
      const allSuccess = results.every((r) => r.success);
      if (allSuccess) {
        toast.success(`${ids.length} propiedad${ids.length > 1 ? "es" : ""} eliminada${ids.length > 1 ? "s" : ""}`);
        setSelectedPropertyIds([]);
        fetchProperties(page);
      } else {
        toast.error("Error al eliminar");
      }
    } catch (err: any) {
      toast.error("Error al eliminar");
    }
  };

  const handleView = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/properties/${id}?locale=es`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setViewProperty(data.data);
        setShowViewModal(true);
      } else {
        toast.error("Error al cargar");
      }
    } catch (err: any) {
      toast.error("Error al cargar");
    }
  };

  const handleEdit = (id: string) => {
    window.location.href = `/es/properties/edit?id=${id}`;
  };

  const handleDeleteOffPlan = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/offplans/${id}?locale=es`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.success) {
        await fetchOffPlans(offPlanPage);
        toast.success("Proyecto eliminado");
      } else {
        toast.error(data.message || "Error al eliminar");
      }
    } catch (err: any) {
      toast.error("Error al eliminar");
    }
  };

  const handleBulkDeleteOffPlans = async (ids: string[]) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const responses = await Promise.all(
        ids.map((id) =>
          fetch(`${API_URL}/api/offplans/${id}?locale=es`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          })
        )
      );
      const results = await Promise.all(responses.map((r) => r.json()));
      const allSuccess = results.every((r) => r.success);
      if (allSuccess) {
        fetchOffPlans(offPlanPage);
        setSelectedOffPlanIds([]);
        toast.success(`${ids.length} proyecto${ids.length > 1 ? "s" : ""} eliminado${ids.length > 1 ? "s" : ""}`);
      } else {
        toast.error("Error al eliminar");
      }
    } catch (err: any) {
      toast.error("Error al eliminar");
    }
  };

  const handleViewOffPlan = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/offplans/${id}?locale=es`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setViewProperty(data.data);
        setShowViewModal(true);
      } else {
        toast.error("Error al cargar");
      }
    } catch (err: any) {
      toast.error("Error al cargar");
    }
  };

  const handleEditOffPlan = (id: string) => {
    window.location.href = `/es/off-plans/edit?id=${id}`;
  };

  if (loading) {
    return (
      <RouteGuard>
        <div className="mt-3 text-black/70">
          <LoadingSpinner message="Cargando..." />
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
          <PropertiesFilters onFilterChange={setFilters} />
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
            Propiedades Listas
          </Link>
          <Link
            href={`${pathname}?type=offplan`}
            className={`px-4 py-1.5 font-medium rounded-[10px] ${
              type === "offplan"
                ? "text-white bg-[url('/images/bg-blue-grad.jpg')] bg-cover bg-center"
                : "text-gray-600 border border-gray-400"
            } transition`}
          >
            Propiedades Fuera de Plan
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
              <RentTable
                onEditLink={`/es/properties/edit`}
                data={filteredProperties}
                lang="es"
                onDelete={handleDelete}
                onView={handleView}
                onEdit={handleEdit}
                onBulkDelete={handleBulkDelete}
                selectedIds={selectedPropertyIds}
                onSelectionChange={setSelectedPropertyIds}
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600">
                  Mostrando {total === 0 ? 0 : (page - 1) * limit + 1}–
                  {Math.min(page * limit, total)} de {total}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { if (page > 1) setPage(page - 1); }}
                    disabled={page <= 1 || totalPages <= 0}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (page < totalPages) setPage(page + 1); }}
                    disabled={page >= totalPages || totalPages <= 0}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <OffPlanTable
                onEditLink={`/es/off-plans/edit`}
                lang="es"
                data={filteredOffPlanProjects}
                onDelete={handleDeleteOffPlan}
                onView={handleViewOffPlan}
                onEdit={handleEditOffPlan}
                onBulkDelete={handleBulkDeleteOffPlans}
                selectedIds={selectedOffPlanIds}
                onSelectionChange={setSelectedOffPlanIds}
              />
              {offPlanTotal > 0 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600">
                    Mostrando {(offPlanPage - 1) * offPlanLimit + 1}–
                    {Math.min(offPlanPage * offPlanLimit, offPlanTotal)} de {offPlanTotal}
                  </p>
                  <div className="flex gap-2">
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
                      Anterior
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
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <RentPropertyViewModal
        open={showViewModal}
        property={viewProperty}
        onClose={() => {
          setShowViewModal(false);
          setViewProperty(null);
        }}
        title={type === "offplan" ? "Detalles Fuera de Plan (Alquiler)" : "Detalles de la Propiedad (Alquiler)"}
      />
    </RouteGuard>
  );
}
