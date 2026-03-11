"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RouteGuard from "@/components/auth/RouteGuard";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface TestimonialFormData {
  name: string;
  role: string;
  text: string;
  rating: number;
  featured: boolean;
}

export default function EditTestimonial() {
  const params = useParams();
  const router = useRouter();
  const testimonialId = params.id as string;
  const { isAuthenticated } = useAuth();

  const [formData, setFormData] = useState<TestimonialFormData>({
    name: "",
    role: "",
    text: "",
    rating: 5,
    featured: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch testimonial when authenticated
  useEffect(() => {
    if (isAuthenticated && testimonialId) {
      fetchTestimonial();
    }
  }, [isAuthenticated, testimonialId]);

  const fetchTestimonial = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("No autenticado");
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
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
        // For Spanish dashboard, load Spanish content from main fields
        // The testimonial is already Spanish (locale='es'), so main fields are Spanish
        setFormData({
          name: data.data.name || "",
          role: data.data.role || "",
          text: data.data.text || "",
          rating: data.data.rating || 5,
          featured: data.data.featured || false,
        });
      } else {
        setError("Error al cargar testimonio");
      }
    } catch (err: any) {
      setError("Error al cargar testimonio");
      console.error("Error fetching testimonial:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("No autenticado");
        setSaving(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      // For Spanish dashboard, save main fields directly (testimonial is already Spanish)
      const updateData = {
        ...formData,
        locale: 'es', // Ensure we're updating Spanish testimonial
      };

      const response = await fetch(`${API_URL}/api/testimonials/${testimonialId}?locale=es`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("¡Testimonio actualizado con éxito!");
        router.push("/es/testimonials/manage-testimonials");
      } else {
        setError(data.message || "Error al actualizar testimonio");
      }
    } catch (err: any) {
      setError("Error al actualizar testimonio");
      console.error("Error updating testimonial:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? parseInt(value) || 0 : value,
    }));
  };

  if (loading) {
    return (
      <RouteGuard>
        <div className="text-black/80">
          <p className="mb-1 text-sm">Testimonios / Editar Testimonio</p>
          <h1 className="font-semibold text-3xl">Editar Testimonio</h1>
          <div className="mt-4 flex items-center justify-center py-12">
            <LoadingSpinner inline message="Cargando testimonio..." />
          </div>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard>
      <div className="text-black/80">
        <p className="mb-1 text-sm">Testimonios / Editar Testimonio</p>
      <h1 className="font-semibold text-3xl">Editar Testimonio</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Spanish Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Contenido en Español</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol *
              </label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto *
              </label>
              <textarea
                name="text"
                value={formData.text}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calificación * (1-5)
              </label>
              <select
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value={1}>1 Estrella</option>
                <option value={2}>2 Estrellas</option>
                <option value={3}>3 Estrellas</option>
                <option value={4}>4 Estrellas</option>
                <option value={5}>5 Estrellas</option>
              </select>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Testimonio Destacado</span>
              </label>
            </div>
          </div>
        </div>


        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Guardando..." : "Actualizar Testimonio"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/es/testimonials/manage-testimonials")}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>
      </form>
      </div>
    </RouteGuard>
  );
}