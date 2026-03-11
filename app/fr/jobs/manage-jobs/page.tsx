"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import JobTable from "@/components/jobs/JobTable";
import { useRouter } from "next/navigation";
import { formatSalaryForDisplay } from "@/utils/salaryFormat";
import { sanitizeHtml } from "@/utils/htmlCleaner";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface JobData {
  _id: string;
  id: string;
  title: string;
  title_es?: string;
  title_fr?: string;
  location: string;
  type: string;
  status: string;
  dateCreated: string;
  department?: string;
  languages?: {
    es?: { title?: string; description?: string };
    fr?: { title?: string; description?: string };
  };
}

export default function ManageJobs() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewJob, setViewJob] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Non authentifié");
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      // Filter by locale to only show jobs with French content
      const response = await fetch(`${API_URL}/api/jobs?page=1&limit=100&locale=fr&admin=true`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-admin-view": "true",
        },
      });

      const data = await response.json();

      if (data.success && data.data?.items) {
        // Additional client-side filter to ensure only French jobs are shown
        const frenchJobs = data.data.items.filter((job: any) => {
          return job.languages?.fr?.title && job.languages.fr.title.trim() !== "";
        });

        const transformedJobs: JobData[] = frenchJobs.map((job: any) => {
          const jobId = job._id || job.id || "";
          return {
            _id: jobId,
            id: jobId,
            title: job.title || "",
            title_es: job.languages?.es?.title,
            title_fr: job.languages?.fr?.title,
            location: job.location || "Sur site",
            type: job.type || "Temps plein",
            status: job.status || "Ouvert",
            dateCreated: job.createdAt
              ? new Date(job.createdAt).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
              : "N/A",
            department: job.department,
            languages: job.languages,
          };
        });
        setJobs(transformedJobs);
      } else {
        setError("Erreur lors du chargement des emplois");
      }
    } catch (err: any) {
      setError("Erreur lors du chargement des emplois");
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet emploi ?")) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Non authentifié");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Emploi supprimé");
        setJobs(jobs.filter((job) => job._id !== jobId));
      } else {
        toast.error(data.message || "Erreur lors de la suppression de l'emploi");
      }
    } catch (err: any) {
      console.error("Error deleting job:", err);
      toast.error("Erreur lors de la suppression de l'emploi");
    }
  };

  const handleEdit = (jobId: string) => {
    router.push(`/fr/jobs/edit-job/${jobId}`);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewJob(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const getJobTitle = () => {
    if (!viewJob) return "—";
    return viewJob.languages?.fr?.title || viewJob.title || viewJob.languages?.es?.title || "—";
  };

  const handleView = async (jobId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Non authentifié");
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
        setViewJob(data.data);
        setShowViewModal(true);
      } else {
        toast.error(data.message || "Erreur lors du chargement de l'emploi");
      }
    } catch (err: any) {
      toast.error("Erreur lors du chargement de l'emploi");
      console.error("Error fetching job:", err);
    }
  };

  if (loading) {
    return (
      <div className="text-black/80">
        <p className="mb-1 text-sm">Emplois / Gérer les Emplois</p>
        <h1 className="font-semibold text-3xl">Gérer les Emplois</h1>
        <LoadingSpinner message="Chargement des emplois..." />
      </div>
    );
  }

  return (
    <div className="text-black/80">
      <p className="mb-1 text-sm">Emplois / Gérer les Emplois</p>
      <h1 className="font-semibold text-3xl">Gérer les Emplois</h1>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="mt-4">
        <JobTable
          data={jobs}
          lang="fr"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      </div>

      {/* View Job Modal */}
      {showViewModal && viewJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={closeViewModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20">
                  <span className="text-2xl font-bold text-primary">
                    {(getJobTitle() || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 truncate">
                    {getJobTitle()}
                  </h2>
                  <p className="text-gray-600 text-sm mt-0.5">
                    {viewJob.department ? `${viewJob.location || "Sur site"} · ${viewJob.department}` : viewJob.location || "Sur site"}
                  </p>
                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                      viewJob.status === "Open"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {viewJob.status || "Ouvert"}
                  </span>
                </div>
                <button
                  onClick={closeViewModal}
                  aria-label="Fermer"
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
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Lieu</p>
                  <p className="text-gray-900 font-medium">{viewJob.location || "N/A"}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type</p>
                  <p className="text-gray-900 font-medium">{viewJob.type || "N/A"}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Département</p>
                  <p className="text-gray-900 font-medium">{viewJob.department || "N/A"}</p>
                </div>
                {viewJob.experience && (
                  <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Expérience</p>
                    <p className="text-gray-900 font-medium">{viewJob.experience}</p>
                  </div>
                )}
                {viewJob.salary && (
                  <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Salaire</p>
                    <p className="text-gray-900 font-medium">{formatSalaryForDisplay(viewJob.salary)}</p>
                  </div>
                )}
                <div className="sm:col-span-2 p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs font-medium text-primary/80 uppercase tracking-wider mb-1">Date de Création</p>
                  <p className="text-gray-900 font-medium">{formatDate(viewJob.createdAt)}</p>
                </div>

                {viewJob.description && (
                  <div className="sm:col-span-2 p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Description</p>
                    <div
                      className="text-gray-900 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(viewJob.description) }}
                    />
                  </div>
                )}

                {viewJob.seo && (viewJob.seo.title || viewJob.seo.description) && (
                  <div className="sm:col-span-2 p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Paramètres SEO</p>
                    <div className="space-y-3">
                      {viewJob.seo.title && (
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Titre SEO</p>
                          <p className="text-gray-900 font-medium">{viewJob.seo.title}</p>
                        </div>
                      )}
                      {viewJob.seo.description && (
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Description SEO</p>
                          <p className="text-gray-900 font-medium">{viewJob.seo.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={closeViewModal}
                className="px-5 py-2.5 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
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

