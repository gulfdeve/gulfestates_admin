"use client";
import JobApplicationTable from "@/components/clients/JobApplicationTable";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import RouteGuard from "@/components/auth/RouteGuard";
import LoadingSpinner from "@/components/common/LoadingSpinner";

// Types
interface JobApplicationData {
  _id: string;
  id?: string;
  jobId: {
    _id: string;
    title: string;
  };
  firstName: string;
  lastName: string;
  email: string;
  coverLetter: string;
  resume?: string;
  portfolio?: string;
  status: string;
  createdAt?: string;
  date?: string;
}

function downloadJobApplicationsCSV(appsToExport: JobApplicationData[]) {
  if (appsToExport.length === 0) return;
  const headers = [
    "First Name",
    "Last Name",
    "Email",
    "Job Title",
    "Status",
    "Resume URL",
    "Portfolio URL",
    "Date Applied",
  ];
  const escape = (v: string | undefined) => {
    const s = v === undefined || v === null ? "" : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = appsToExport.map((a) =>
    [
      a.firstName,
      a.lastName,
      a.email,
      typeof a.jobId === "object" ? a.jobId.title : "",
      a.status,
      a.resume || "",
      a.portfolio || "",
      a.createdAt ? new Date(a.createdAt).toISOString() : "",
    ].map(escape).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `job-applications-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function JobApplicationsPage() {
  const { isAuthenticated } = useAuth();
  const [applications, setApplications] = useState<JobApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewApplication, setViewApplication] =
    useState<JobApplicationData | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Check user role and access
  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated, statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const url =
        statusFilter !== "all"
          ? `${API_URL}/api/job-applications?status=${statusFilter}`
          : `${API_URL}/api/job-applications`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        const transformedApplications: JobApplicationData[] =
          data.data.items.map((app: any) => ({
            _id: app._id,
            id: app._id,
            jobId: app.jobId || { _id: "", title: "N/A" },
            firstName: app.firstName || "",
            lastName: app.lastName || "",
            email: app.email || "",
            coverLetter: app.coverLetter || "",
            resume: app.resume || "",
            portfolio: app.portfolio || "",
            status: app.status || "Pending",
            createdAt: app.createdAt,
            date: app.createdAt,
          }));
        setApplications(transformedApplications);
      } else {
        setError("Failed to load job applications");
      }
    } catch (err: any) {
      setError("Error loading job applications");
      console.error("Error fetching job applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (applicationId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${API_URL}/api/job-applications/${applicationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Application deleted");
        setApplications((prev) => prev.filter((a) => a._id !== applicationId));
      } else {
        toast.error(data.message || "Failed to delete application");
      }
    } catch (err: any) {
      console.error("Error deleting application:", err);
      toast.error("Error deleting application");
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    for (const id of ids) {
      await handleDelete(id);
    }
  };

  const handleView = async (applicationId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${API_URL}/api/job-applications/${applicationId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success && data.data) {
        setViewApplication(data.data);
        setShowViewModal(true);
      } else {
        toast.error("Failed to load application details");
      }
    } catch (err: any) {
      console.error("Error fetching application:", err);
      toast.error("Error loading application");
    }
  };

  const handleUpdateStatus = async (
    applicationId: string,
    newStatus: string
  ) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${API_URL}/api/job-applications/${applicationId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setApplications((prev) =>
          prev.map((app) =>
            app._id === applicationId ? { ...app, status: newStatus } : app
          )
        );
        if (viewApplication && viewApplication._id === applicationId) {
          setViewApplication({ ...viewApplication, status: newStatus });
        }
        toast.success("Status updated");
      } else {
        toast.error("Failed to update status");
      }
    } catch (err: any) {
      console.error("Error updating status:", err);
      toast.error("Error updating status");
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewApplication(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const handleDownloadOne = async (applicationId: string) => {
    const app = applications.find((a) => a._id === applicationId);
    if (!app) return;
    if (!app.resume) {
      toast.error("No resume PDF available for this application");
      return;
    }
    try {
      const res = await fetch(app.resume, { mode: "cors" });
      if (!res.ok) {
        window.open(app.resume, "_blank");
        toast.success("Resume opened in new tab");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-${app.firstName}-${app.lastName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Resume PDF downloaded");
    } catch {
      window.open(app.resume!, "_blank");
      toast.success("Resume opened in new tab");
    }
  };

  const handleDownloadViewModal = async () => {
    if (!viewApplication) return;
    if (!viewApplication.resume) {
      toast.error("No resume PDF available for this application");
      return;
    }
    try {
      const res = await fetch(viewApplication.resume, { mode: "cors" });
      if (!res.ok) {
        window.open(viewApplication.resume!, "_blank");
        toast.success("Resume opened in new tab");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-${viewApplication.firstName}-${viewApplication.lastName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Resume PDF downloaded");
    } catch {
      window.open(viewApplication.resume!, "_blank");
      toast.success("Resume opened in new tab");
    }
  };

  if (loading) {
    return (
      <RouteGuard>
        <div className="text-black/80">
          <p className="mb-1 text-sm">Clients / Job Applications</p>
          <h1 className="font-semibold text-3xl">Job Applications</h1>
          <div className="mt-4">
            <LoadingSpinner inline message="Loading applications..." />
          </div>
        </div>
      </RouteGuard>
    );
  }

  if (error) {
    return (
      <RouteGuard>
        <div className="text-black/80">
          <p className="mb-1 text-sm">Clients / Job Applications</p>
          <h1 className="font-semibold text-3xl">Job Applications</h1>
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
        <p className="mb-1 text-sm">Clients / Job Applications</p>
        <h1 className="font-semibold text-3xl">Job Applications</h1>

        {/* Status Filter */}
        <div className="mt-4 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="mt-4">
          <JobApplicationTable
            data={applications}
            onView={handleView}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            onUpdateStatus={handleUpdateStatus}
            onDownload={handleDownloadOne}
          />
        </div>

        {/* View Modal */}
        {showViewModal && viewApplication && (
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
                      {(viewApplication.firstName || "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 truncate">
                      {viewApplication.firstName} {viewApplication.lastName}
                    </h2>
                    <p className="text-gray-600 text-sm mt-0.5 truncate">{viewApplication.email}</p>
                    <span
                      className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                        viewApplication.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : viewApplication.status === "Reviewed"
                            ? "bg-blue-100 text-blue-800"
                            : viewApplication.status === "Accepted"
                              ? "bg-green-100 text-green-800"
                              : viewApplication.status === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {viewApplication.status}
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    <select
                      value={viewApplication.status}
                      onChange={(e) =>
                        handleUpdateStatus(viewApplication._id, e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Reviewed">Reviewed</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <button
                    onClick={closeViewModal}
                    aria-label="Close"
                    className="flex-shrink-0 p-2 rounded-lg text-primary hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Job Position</p>
                    <p className="text-gray-900 font-medium">
                      {viewApplication.jobId && typeof viewApplication.jobId === "object"
                        ? viewApplication.jobId.title
                        : "N/A"}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date Applied</p>
                    <p className="text-gray-900 font-medium">{formatDate(viewApplication.createdAt)}</p>
                  </div>
                  <div className="sm:col-span-2 p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Cover Letter</p>
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{viewApplication.coverLetter || "—"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Resume</p>
                    {viewApplication.resume ? (
                      <a
                        href={viewApplication.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 font-medium underline"
                      >
                        View Resume (PDF)
                      </a>
                    ) : (
                      <p className="text-gray-500">No resume uploaded</p>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Portfolio</p>
                    {viewApplication.portfolio ? (
                      <a
                        href={viewApplication.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 font-medium underline"
                      >
                        View Portfolio (PDF)
                      </a>
                    ) : (
                      <p className="text-gray-500">No portfolio uploaded</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleDownloadViewModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={closeViewModal}
                  className="px-5 py-2.5 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
