"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import RouteGuard from "@/components/auth/RouteGuard";
import { toast } from "sonner";

export default function CreateTestimonial() {
  const router = useRouter();
  
  // Spanish content (required)
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [featured, setFeatured] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !role || !text) {
      toast.error("Por favor complete todos los campos requeridos (Nombre, Rol, Texto)");
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error("La calificación debe estar entre 1 y 5");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("No autenticado");
        return;
      }

      const testimonialData = {
        name,
        role,
        text,
        rating,
        featured,
        locale: 'es', // Spanish testimonial
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/testimonials`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testimonialData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("¡Testimonio creado con éxito!");
        setTimeout(() => {
          router.push("/es/testimonials/manage-testimonials");
        }, 1500);
      } else {
        toast.error(data.message || "Error al crear testimonio");
      }
    } catch (err: any) {
      console.error("Testimonial creation error:", err);
      toast.error("Error al crear testimonio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RouteGuard>
      <div className="text-black/80">
      <p className="mb-1 text-sm">Testimonios / Crear Testimonio</p>
      <h1 className="font-semibold text-3xl">Crear Testimonio</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Spanish Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Contenido en Español *</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ingrese el nombre"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol *
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="ej., Comprador, Vendedor, Inversor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto *
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ingrese el texto del testimonio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calificación * (1-5)
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
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
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
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
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creando..." : "Crear Testimonio"}
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

