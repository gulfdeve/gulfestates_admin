"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
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

  const [properties, setProperties] = useState<Property[]>([]);
  const [offPlanProjects, setOffPlanProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewProperty, setViewProperty] = useState<any>(null);
  const [viewOffPlan, setViewOffPlan] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showViewOffPlanModal, setShowViewOffPlanModal] = useState(false);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [selectedOffPlanIds, setSelectedOffPlanIds] = useState<string[]>([]);
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

  const fetchProperties = useCallback(async (page: number = 1) => {
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
        `${API_URL}/api/properties?for=buy&page=${page}&limit=${propertyLimit}&locale=es`,
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
          title: prop.title?.es ?? (typeof prop.title === "string" ? prop.title : ""),
          title_es: prop.title?.es ?? (typeof prop.title === "string" ? prop.title : ""),
          title_fr: prop.title?.fr,
          developer: prop.agent?.name || prop.developer || "N/A",
          location: prop.location?.es || prop.location?.en || prop.location || "",
          type: prop.type || "",
          beds: prop.beds || 0,
          price: prop.price ? `AED ${prop.price.toLocaleString()}` : "N/A",
          status: "Activo",
          addedOn: prop.createdAt
            ? new Date(prop.createdAt).toLocaleDateString("es-ES", {
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
        setError("Error al cargar propiedades");
        setPropertyTotal(0);
        setPropertyTotalPages(1);
      }
    } catch (err: any) {
      setError("Error al cargar propiedades");
      console.error("Error fetching properties:", err);
      setPropertyTotal(0);
      setPropertyTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [propertyLimit]);

  const fetchOffPlans = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      // Always fetch buy off-plans for buy page (admin view - get all offplans)
      const response = await fetch(
        `${API_URL}/api/offplans?for=buy&admin=true&locale=es`,
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
        // Filter to only show Spanish off-plans (those with title.es)
        const spanishOffplans = data.data.filter((offplan: any) => {
          // Get Spanish title from various possible structures
          let titleEs = '';

          if (typeof offplan.title === 'string') {
            // If title is a string, check if it's actually Spanish (from backend localization)
            // But we need to check the original title object
            titleEs = offplan.languages?.title?.es || offplan.title?.es || '';
          } else if (offplan.languages?.title?.es) {
            // Check languages object
            titleEs = offplan.languages.title.es.trim();
          } else if (typeof offplan.title === 'object' && offplan.title?.es) {
            // Check title object directly
            titleEs = offplan.title.es.trim();
          }

          const hasSpanishTitle = titleEs !== '' && titleEs.trim() !== '';
          return hasSpanishTitle;
        });

        console.log(`📦 Filtered ${spanishOffplans.length} Spanish offplans from ${data.data.length} total`);

        // Transform off-plans to match table format
        const transformedOffPlans: Project[] = spanishOffplans.map((offplan: any) => {
          // When locale=es, backend returns:
          // - title: string (localized Spanish version)
          // - languages.title: object {en, fr, es} (original)

          // Get title - handle both localized string and object structures
          const titleLocalized = typeof offplan.title === 'string' ? offplan.title : '';
          const titleObj = offplan.languages?.title || offplan.title;
          const titleEs = titleObj?.es || titleLocalized || '';
          const titleEn = titleObj?.en || titleLocalized || '';
          const titleFr = titleObj?.fr || '';

          // Get location - handle both localized string and object structures
          const locationLocalized = typeof offplan.location === 'string' ? offplan.location : '';
          const locationObj = offplan.languages?.location || offplan.location;
          const locationEs = locationObj?.es || locationLocalized || '';
          const locationEn = locationObj?.en || locationLocalized || '';
          const locationFr = locationObj?.fr || '';
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
            name_es: titleEs, // Must have Spanish title (already filtered)
            name_fr: titleFr,
            developer: offplan.developer || "N/A",
            location: locationEs, // Use Spanish location (must exist since we filtered)
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
  }, []);

  useEffect(() => {
    if (type === "ready") {
      fetchProperties(propertyPage);
    } else {
      fetchOffPlans();
    }
  }, [type, propertyPage]);

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("No autenticado");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      // Pass locale=es to delete only Spanish version
      const response = await fetch(`${API_URL}/api/properties/${id}?locale=es`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Propiedad eliminada exitosamente");
        fetchProperties(propertyPage);
      } else {
        toast.error(data.message || "Error al eliminar propiedad");
      }
    } catch (err: any) {
      console.error("Error deleting property:", err);
      toast.error("Error al eliminar propiedad. Por favor, inténtalo de nuevo.");
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

      // Delete all selected properties with locale=es
      const deletePromises = ids.map(id =>
        fetch(`${API_URL}/api/properties/${id}?locale=es`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      );

      const responses = await Promise.all(deletePromises);
      const results = await Promise.all(responses.map(res => res.json()));

      // Check if all deletions were successful
      const allSuccess = results.every(result => result.success);

      if (allSuccess) {
        fetchProperties(propertyPage);
        setSelectedPropertyIds([]);
        toast.success(`Se eliminaron exitosamente ${ids.length} propiedad${ids.length > 1 ? 'es' : ''}`);
      } else {
        const failedCount = results.filter(r => !r.success).length;
        toast.error(`Error al eliminar ${failedCount} propiedad${failedCount > 1 ? 'es' : ''}`);
      }
    } catch (err: any) {
      console.error("Error deleting properties:", err);
      toast.error("Error al eliminar propiedades. Por favor, inténtalo de nuevo.");
    }
  };

  const handleBulkDeleteOffPlans = async (ids: string[]) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("No autenticado");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      // Delete all selected off-plans with locale=es
      const deletePromises = ids.map(id =>
        fetch(`${API_URL}/api/offplans/${id}?locale=es`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      );

      const responses = await Promise.all(deletePromises);
      const results = await Promise.all(responses.map(res => res.json()));

      // Check if all deletions were successful
      const allSuccess = results.every(result => result.success);

      if (allSuccess) {
        // Refresh off-plans to get updated list
        fetchOffPlans();
        setSelectedOffPlanIds([]);
        toast.success(`Se eliminaron exitosamente ${ids.length} proyecto${ids.length > 1 ? 's' : ''}`);
      } else {
        const failedCount = results.filter(r => !r.success).length;
        toast.error(`Error al eliminar ${failedCount} proyecto${failedCount > 1 ? 's' : ''}`);
      }
    } catch (err: any) {
      console.error("Error deleting off-plans:", err);
      toast.error("Error al eliminar proyectos. Por favor, inténtalo de nuevo.");
    }
  };

  const handleView = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("No autenticado");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/properties/${id}?locale=es`, {
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
        toast.error("Error al cargar detalles de la propiedad");
      }
    } catch (err: any) {
      console.error("Error fetching property:", err);
      toast.error("Error al cargar propiedad");
    }
  };

  const handleViewOffPlan = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("No autenticado");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/offplans/${id}?locale=es`, {
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
        toast.error("Error al cargar detalles del proyecto");
      }
    } catch (err: any) {
      console.error("Error fetching off-plan:", err);
      toast.error("Error al cargar proyecto");
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/es/properties/edit?id=${id}`);
  };

  const handleEditOffPlan = (id: string) => {
    router.push(`/es/off-plans/edit?id=${id}`);
  };

  const handleDeleteOffPlan = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("No autenticado");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      // Pass locale=es to delete only Spanish version
      const response = await fetch(`${API_URL}/api/offplans/${id}?locale=es`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        toast.error(`Error al eliminar: ${errorData.message || response.statusText}`);
        console.error("Delete failed:", response.status, errorData);
        return;
      }

      const data = await response.json();
      console.log("Delete response:", data);

      if (data.success) {
        toast.success("Proyecto eliminado exitosamente");
        await fetchOffPlans();
        toast.success("Proyecto eliminado exitosamente");
      } else {
        toast.error(data.message || "Error al eliminar proyecto");
      }
    } catch (err: any) {
      console.error("Error deleting off-plan:", err);
      toast.error(`Error al eliminar proyecto: ${err.message || "Por favor, inténtalo de nuevo."}`);
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
        { title: "Total Propiedades", value: propertyTotal },
        { title: "Activas", value: properties.filter(p => p.status === "Activo").length },
      ]
      : [
        { title: "Total Proyectos", value: offPlanProjects.length },
        { title: "En Construcción", value: offPlanProjects.filter(p => p.status === "Under Construction").length },
      ];

  if (loading) {
    return (
      <div className="mt-3 text-black/70">
        <LoadingSpinner message="Cargando propiedades..." />
      </div>
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
            className={`px-4 py-1.5 font-medium rounded-[10px] ${type === "ready"
              ? "text-white/90 bg-[url('/images/bg-blue-grad.jpg')] bg-cover bg-center"
              : "text-gray-600 border border-gray-400"
              } transition`}
          >
            Propiedades Listas
          </Link>

          <Link
            href={`${pathname}?type=offplan`}
            className={`px-4 py-1.5 font-medium rounded-[10px] ${type === "offplan"
              ? "text-white bg-[url('/images/bg-blue-grad.jpg')] bg-cover bg-center"
              : "text-gray-600 border border-gray-400"
              } transition`}
          >
            Propiedades Off Plan
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
                  Mostrando {propertyTotal === 0 ? 0 : (propertyPage - 1) * propertyLimit + 1}–
                  {Math.min(propertyPage * propertyLimit, propertyTotal)} de {propertyTotal}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { if (propertyPage > 1) setPropertyPage(propertyPage - 1); }}
                    disabled={propertyPage <= 1 || propertyTotalPages <= 0}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (propertyPage < propertyTotalPages) setPropertyPage(propertyPage + 1); }}
                    disabled={propertyPage >= propertyTotalPages || propertyTotalPages <= 0}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          ) : (
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
          )}
        </div>

        {/* View Property Modal */}
        {showViewModal && viewProperty && (
          <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Detalles de la Propiedad</h2>
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
                  <strong>Título (EN):</strong> {viewProperty.title?.en || viewProperty.title || "N/A"}
                </div>
                {viewProperty.title?.es && (
                  <div>
                    <strong>Título (ES):</strong> {viewProperty.title.es}
                  </div>
                )}
                {viewProperty.title?.fr && (
                  <div>
                    <strong>Título (FR):</strong> {viewProperty.title.fr}
                  </div>
                )}
                <div>
                  <strong>Ubicación:</strong> {viewProperty.location?.es || viewProperty.location?.en || viewProperty.location || "N/A"}
                </div>
                <div>
                  <strong>Tipo:</strong> {viewProperty.type || "N/A"}
                </div>
                <div>
                  <strong>Precio:</strong> {viewProperty.price ? `AED ${viewProperty.price.toLocaleString()}` : "N/A"}
                </div>
                <div>
                  <strong>Habitaciones:</strong> {viewProperty.beds || "N/A"}
                </div>
                <div>
                  <strong>Baños:</strong> {viewProperty.baths || "N/A"}
                </div>
                <div>
                  <strong>Tamaño:</strong> {viewProperty.size ? `${viewProperty.size} sqft` : "N/A"}
                </div>
                {viewProperty.description && (
                  <div>
                    <strong>Descripción:</strong>
                    <div
                      className="mt-1 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(viewProperty.description.es || viewProperty.description.en || viewProperty.description || "N/A") }}
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
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Off-Plan Modal */}
        {showViewOffPlanModal && viewOffPlan && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Detalles del Proyecto</h2>
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
                  <strong>Título (EN):</strong> {viewOffPlan.title?.en || viewOffPlan.title || "N/A"}
                </div>
                {viewOffPlan.title?.es && (
                  <div>
                    <strong>Título (ES):</strong> {viewOffPlan.title.es}
                  </div>
                )}
                {viewOffPlan.title?.fr && (
                  <div>
                    <strong>Título (FR):</strong> {viewOffPlan.title.fr}
                  </div>
                )}
                <div>
                  <strong>Desarrollador:</strong> {viewOffPlan.developer || "N/A"}
                </div>
                <div>
                  <strong>Ubicación:</strong> {viewOffPlan.location?.es || viewOffPlan.location?.en || viewOffPlan.location || "N/A"}
                </div>
                <div>
                  <strong>Tipo:</strong> {viewOffPlan.type || "N/A"}
                </div>
                <div>
                  <strong>Entrega:</strong> {viewOffPlan.handover || "N/A"}
                </div>
                <div>
                  <strong>Precio Desde:</strong> {viewOffPlan.priceFrom || "N/A"}
                </div>
                <div>
                  <strong>Plan de Pago:</strong> {viewOffPlan.paymentPlan || "N/A"}
                </div>
                <div>
                  <strong>Estado:</strong> {viewOffPlan.status || "N/A"}
                </div>
                {viewOffPlan.bedRange && (
                  <div>
                    <strong>Rango de Habitaciones:</strong> {viewOffPlan.bedRange}
                  </div>
                )}
                {viewOffPlan.bathRange && (
                  <div>
                    <strong>Rango de Baños:</strong> {viewOffPlan.bathRange}
                  </div>
                )}
                {viewOffPlan.sizeRange && (
                  <div>
                    <strong>Rango de Tamaño:</strong> {viewOffPlan.sizeRange}
                  </div>
                )}
                {viewOffPlan.description && (
                  <div>
                    <strong>Descripción:</strong>
                    <div
                      className="mt-1 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(viewOffPlan.description.es || viewOffPlan.description.en || viewOffPlan.description || "N/A") }}
                    />
                  </div>
                )}
                {viewOffPlan.amenities && viewOffPlan.amenities.length > 0 && (
                  <div>
                    <strong>Comodidades:</strong>
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
                  Cerrar
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
    <Suspense fallback={<LoadingSpinner fullPage message="Cargando propiedades..." />}>
      <BuyPageContent />
    </Suspense>
  );
}
