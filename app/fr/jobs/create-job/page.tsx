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

  // Form fields - French only
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description) {
      toast.error("Le titre et la description sont obligatoires");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Non authentifié");
        return;
      }

      const jobData = {
        title: "", // Empty for French-only jobs - don't set English title
        description: "", // Empty for French-only jobs - don't set English description
        location,
        type,
        status,
        department: department || undefined,
        experience: experience || undefined,
        salary: salaryDisplay || salary || undefined,
        languages: {
          fr: {
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
        toast.success("Emploi créé avec succès !");
        setTimeout(() => {
          router.push("/fr/jobs/manage-jobs");
        }, 1500);
      } else {
        toast.error(data.message || "Erreur lors de la création de l'emploi");
      }
    } catch (err: any) {
      toast.error("Erreur lors de la création de l'emploi");
      console.error("Error creating job:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-black/80">
      <p className="mb-1 text-sm">Emplois / Créer un Emploi</p>
      <h1 className="font-semibold text-3xl">Créer un Nouvel Emploi</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* French Fields Only */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Contenu de l'Emploi (Français)</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre *
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
                Description *
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
          <h2 className="text-xl font-semibold mb-4">Détails de l'Emploi</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lieu *
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="On-site">Sur site</option>
                <option value="Remote">À distance</option>
                <option value="Hybrid">Hybride</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Full Time">Temps plein</option>
                <option value="Part Time">Temps partiel</option>
                <option value="Contract">Contrat</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Open">Ouvert</option>
                <option value="Closed">Fermé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Département
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
                Expérience
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner l'expérience</option>
                <option value="Entry Level">Niveau débutant</option>
                <option value="Mid Level">Niveau intermédiaire</option>
                <option value="Senior">Senior</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salaire
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
                placeholder="ex., 1550000 ou 1.55 (pour 1.55M)"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {salary && (
                <p className="mt-1 text-sm text-gray-500">
                  S'affichera comme : {formatSalaryForDisplay(salary)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Paramètres SEO (Optionnel)</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre SEO
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
                Description SEO
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
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Création..." : "Créer l'Emploi"}
          </button>
        </div>
      </form>
    </div>
  );
}

