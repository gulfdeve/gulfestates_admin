"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
});

export default function EditJob() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const editor = useRef(null);
  const [originalJob, setOriginalJob] = useState<any>(null);
  
  // Form fields - Spanish only
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("On-site");
  const [type, setType] = useState("Full Time");
  const [status, setStatus] = useState("Open");
  const [department, setDepartment] = useState("");
  const [experience, setExperience] = useState("");
  const [salary, setSalary] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (jobId) {
      fetchJobData();
    }
  }, [jobId]);

  const fetchJobData = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("No autenticado");
        setLoadingData(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/jobs/${jobId}?admin=true`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-admin-view": "true",
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        const job = data.data;
        setOriginalJob(job);
        // Load Spanish content if available, otherwise fallback to English
        setTitle(job.languages?.es?.title || job.title || "");
        setDescription(job.languages?.es?.description || job.description || "");
        setLocation(job.location || "On-site");
        setType(job.type || "Full Time");
        setStatus(job.status || "Open");
        setDepartment(job.department || "");
        setExperience(job.experience || "");
        setSalary(job.salary || "");
        setSeoTitle(job.seo?.title || "");
        setSeoDescription(job.seo?.description || "");
      } else {
        setError("Error al cargar datos del trabajo");
      }
    } catch (err: any) {
      setError("Error al cargar datos del trabajo");
      console.error("Error fetching job:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title || !description) {
      setError("El título y la descripción son obligatorios");
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
        title: originalJob?.title || "", // Keep original English title
        description: originalJob?.description || "", // Keep original English description
        location,
        type,
        status,
        department: department || undefined,
        experience: experience || undefined,
        salary: salary || undefined,
        languages: {
          es: {
            title: title,
            description: description
          },
          ...(originalJob?.languages?.fr ? { fr: originalJob.languages.fr } : {})
        },
        seo: seoTitle || seoDescription ? {
          title: seoTitle || undefined,
          description: seoDescription || undefined,
        } : undefined,
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("¡Trabajo actualizado exitosamente!");
        setTimeout(() => {
          router.push("/es/jobs/manage-jobs");
        }, 1500);
      } else {
        setError(data.message || "Error al actualizar trabajo");
      }
    } catch (err: any) {
      setError("Error al actualizar trabajo");
      console.error("Error updating job:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="text-black/80">
        <p className="mb-1 text-sm">Trabajos / Editar Trabajo</p>
        <h1 className="font-semibold text-3xl">Editar Trabajo</h1>
                <LoadingSpinner message="Cargando datos del trabajo..." />
      </div>
    );
  }

  return (
    <div className="text-black/80">
      <p className="mb-1 text-sm">Trabajos / Editar Trabajo</p>
      <h1 className="font-semibold text-3xl">Editar Trabajo</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

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
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="ej., $50,000 - $70,000"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
            {loading ? "Actualizando..." : "Actualizar Trabajo"}
          </button>
        </div>
      </form>
    </div>
  );
}

