"use client";
import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatSalaryForDisplay, parseSalaryInput } from "@/utils/salaryFormat";

const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
});

export default function CreateJob() {
  const router = useRouter();
  const editor = useRef(null);

  // Form fields - Spanish only
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("On-site");
  const [type, setType] = useState("Full Time");
  const [status, setStatus] = useState("Open");
  const [department, setDepartment] = useState("");
  const [experience, setExperience] = useState("");
  const [salary, setSalary] = useState("");
  const [salaryDisplay, setSalaryDisplay] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description) {
      toast.error("El título y la descripción son obligatorios");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("No autenticado");
        return;
      }

      const jobData = {
        title: "", // Empty for Spanish-only jobs - don't set English title
        description: "", // Empty for Spanish-only jobs - don't set English description
        location,
        type,
        status,
        department: department || undefined,
        experience: experience || undefined,
        salary: salaryDisplay || salary || undefined,
        languages: {
          es: {
            title: title,
            description: description
          }
        },
        seo: seoTitle || seoDescription ? {
          title: seoTitle || undefined,
          description: seoDescription || undefined,
        } : undefined,
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/jobs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("¡Trabajo creado exitosamente!");
        setTimeout(() => {
          router.push("/es/jobs/manage-jobs");
        }, 1500);
      } else {
        toast.error(data.message || "Error al crear trabajo");
      }
    } catch (err: any) {
      toast.error("Error al crear trabajo");
      console.error("Error creating job:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-black/80">
      <p className="mb-1 text-sm">Trabajos / Crear Trabajo</p>
      <h1 className="font-semibold text-3xl">Crear Nuevo Trabajo</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Spanish Fields Only */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Contenido del Trabajo (Español)</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción *
              </label>
              <JoditEditor
                ref={editor}
                value={description}
                onBlur={(newContent) => setDescription(newContent)}
                onChange={(newContent) => setDescription(newContent)}
              />
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Detalles del Trabajo</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación *
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="On-site">Presencial</option>
                <option value="Remote">Remoto</option>
                <option value="Hybrid">Híbrido</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Full Time">Tiempo Completo</option>
                <option value="Part Time">Medio Tiempo</option>
                <option value="Contract">Contrato</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Open">Abierto</option>
                <option value="Closed">Cerrado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experiencia
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar Experiencia</option>
                <option value="Entry Level">Nivel Inicial</option>
                <option value="Mid Level">Nivel Medio</option>
                <option value="Senior">Senior</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salario
              </label>
              <input
                type="text"
                value={salaryDisplay}
                onChange={(e) => {
                  const input = e.target.value;
                  setSalaryDisplay(input);
                  const parsed = parseSalaryInput(input);
                  setSalary(parsed);
                }}
                onBlur={(e) => {
                  if (salary) {
                    setSalaryDisplay(formatSalaryForDisplay(salary));
                  }
                }}
                placeholder="ej., 1550000 o 1.55 (para 1.55M)"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {salary && (
                <p className="mt-1 text-sm text-gray-500">
                  Se mostrará como: {formatSalaryForDisplay(salary)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Configuración SEO (Opcional)</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título SEO
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción SEO
              </label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creando..." : "Crear Trabajo"}
          </button>
        </div>
      </form>
    </div>
  );
}

