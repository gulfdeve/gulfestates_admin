"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import TestimonialTable from "@/components/clients/TestimonialTable";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RouteGuard from "@/components/auth/RouteGuard";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface TestimonialData {
  _id: string;
  id?: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  featured?: boolean;
  createdAt?: string;
}

export default function ManageTestimonials() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewTestimonial, setViewTestimonial] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Fetch testimonials when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchTestimonials();
    }
  }, [isAuthenticated]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("No autenticado");
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/testimonials?limit=100&locale=es&admin=true`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-admin-view": "true",
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Backend returns localized data, but we need the full object with all languages for the table
        // So we'll fetch again with admin=true to get full objects, or use the localized data
        const transformedTestimonials: TestimonialData[] = data.data.map((testimonial: any) => ({
          _id: testimonial.id || testimonial._id,
          id: testimonial.id || testimonial._id,
          name: testimonial.name || "",
          role: testimonial.role || "",
          text: testimonial.text || "",
          rating: testimonial.rating || 0,
          featured: testimonial.featured || false,
          createdAt: testimonial.createdAt,
        }));
        setTestimonials(transformedTestimonials);
      } else {
        setError("Error al cargar testimonios");
      }
    } catch (err: any) {
      setError("Error al cargar testimonios");
      console.error("Error fetching testimonials:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (testimonialId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("No autenticado");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      // Pass locale=es to delete only Spanish version
      const response = await fetch(`${API_URL}/api/testimonials/${testimonialId}?locale=es`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Testimonio eliminado con éxito");
        // Refresh testimonials to get updated list
        fetchTestimonials();
      } else {
        toast.error("Error al eliminar testimonio: " + (data.message || "Error desconocido"));
      }
    } catch (err: any) {
      console.error("Error deleting testimonial:", err);
      toast.error("Error al eliminar testimonio");
    }
  };

  const handleEdit = (testimonialId: string) => {
    window.location.href = `/es/testimonials/edit/${testimonialId}`;
  };

  const handleView = async (testimonialId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("No autenticado");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      // Fetch with locale=es to get Spanish content, but also get full object for admin view
      const response = await fetch(`${API_URL}/api/testimonials/${testimonialId}?locale=es&admin=true`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-admin-view": "true",
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Use the full object with all languages
        // The backend returns full object with admin=true, so we have all language data
        setViewTestimonial(data.data);
        setShowViewModal(true);
      } else {
        toast.error("Error al cargar detalles del testimonio");
      }
    } catch (err: any) {
      console.error("Error fetching testimonial:", err);
      toast.error("Error al cargar testimonio");
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewTestimonial(null);
  };

  if (loading) {
    return (
      <RouteGuard>
        <div className="text-black/80">
          <p className="mb-1 text-sm">Testimonios / Gestionar Testimonios</p>
          <h1 className="font-semibold text-3xl">Gestionar Testimonios</h1>
          <div className="mt-4 flex items-center justify-center py-12">
            <LoadingSpinner inline message="Cargando testimonios..." />
          </div>
        </div>
      </RouteGuard>
    );
  }

  if (error) {
    return (
      <RouteGuard>
        <div className="text-black/80">
          <p className="mb-1 text-sm">Testimonios / Gestionar Testimonios</p>
          <h1 className="font-semibold text-3xl">Gestionar Testimonios</h1>
          <div className="mt-4 flex items-center justify-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard>
      <div className="text-black/80">
      <p className="mb-1 text-sm">Testimonios / Gestionar Testimonios</p>
      <h1 className="font-semibold text-3xl">Gestionar Testimonios</h1>
      <div className="mt-4">
        <TestimonialTable
          data={testimonials}
          locale="es"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      </div>

      {/* View Modal */}
      {showViewModal && viewTestimonial && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={closeViewModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20">
                  <span className="text-2xl font-bold text-primary">
                    {(viewTestimonial.name || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 truncate">
                    {viewTestimonial.name || "—"}
                  </h2>
                  <p className="text-gray-600 text-sm mt-0.5 truncate">
                    {viewTestimonial.role || "—"}
                  </p>
                  <span
                    className={`inline-flex mt-2 rounded-full px-3 py-1 text-xs font-medium ${
                      viewTestimonial.featured
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {viewTestimonial.featured ? "Destacado" : "Regular"}
                  </span>
                </div>
                <button
                  onClick={closeViewModal}
                  aria-label="Close"
                  className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body - scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Calificación
                  </p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: viewTestimonial.rating || 0 }).map((_, i) => (
                      <span key={i} className="text-yellow-400 text-xl">★</span>
                    ))}
                    {(!viewTestimonial.rating || viewTestimonial.rating === 0) && (
                      <span className="text-gray-600 font-medium">N/A</span>
                    )}
                  </div>
                </div>

                {viewTestimonial.createdAt && (
                  <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Fecha de creación
                    </p>
                    <p className="text-gray-900 font-medium">
                      {new Date(viewTestimonial.createdAt).toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}

                <div className="sm:col-span-2 p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs font-medium text-primary/80 uppercase tracking-wider mb-1">
                    Texto del testimonio
                  </p>
                  <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {viewTestimonial.text || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={closeViewModal}
                className="px-5 py-2.5 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
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

