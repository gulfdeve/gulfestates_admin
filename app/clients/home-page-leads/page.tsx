"use client";
import HomeTable from "@/components/clients/HomeTable";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import RouteGuard from "@/components/auth/RouteGuard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";

// Types
interface HomeData {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  countryCode?: string;
  source: string;
  date?: string;
  createdAt?: string;
  status: string;
  fullName?: string;
  phoneNumber?: string;
  budget?: string;
  propertyType?: string;
  consent?: boolean;
}

// Build CSV content and trigger download
function downloadLeadsCSV(leadsToExport: HomeData[]) {
  if (leadsToExport.length === 0) return;
  const headers = [
    "Full Name",
    "Email",
    "Phone",
    "Country Code",
    "Budget",
    "Property Type",
    "Source",
    "Status",
    "Consent",
    "Date Submitted",
  ];
  const escape = (v: string | undefined | boolean) => {
    const s = v === undefined || v === null ? "" : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = leadsToExport.map((l) =>
    [
      l.fullName ?? l.name,
      l.email,
      l.phoneNumber ?? l.phone,
      l.countryCode ?? "",
      l.budget ?? "",
      l.propertyType ?? "",
      l.source ?? "",
      l.status ?? "",
      l.consent ? "Yes" : "No",
      l.createdAt ? new Date(l.createdAt).toISOString() : "",
    ].map(escape).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `homepage-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HomePageLeads() {
  const { isAuthenticated } = useAuth();
  const [leads, setLeads] = useState<HomeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewLead, setViewLead] = useState<HomeData | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Fetch leads when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchLeads();
    }
  }, [isAuthenticated]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/home-page-leads`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        const transformedLeads: HomeData[] = data.data.map((lead: any) => ({
          _id: lead._id,
          id: lead._id,
          name: lead.fullName || "",
          email: lead.email || "",
          phone: lead.phoneNumber || "",
          countryCode: lead.countryCode || "",
          source: lead.source || "From Homepage Popup",
          createdAt: lead.createdAt,
          date: lead.createdAt,
          status: lead.status || "New",
          fullName: lead.fullName,
          phoneNumber: lead.phoneNumber,
          budget: lead.budget,
          propertyType: lead.propertyType,
          consent: lead.consent,
        }));
        setLeads(transformedLeads);
      } else {
        setError("Failed to load leads");
      }
    } catch (err: any) {
      setError("Error loading leads");
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async (leadIds: string[]) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        return;
      }
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      let successCount = 0;
      for (const id of leadIds) {
        const response = await fetch(`${API_URL}/api/home-page-leads/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (data.success) {
          successCount++;
          setLeads((prev) => prev.filter((l) => l._id !== id));
        }
      }
      if (successCount > 0) {
        toast.success(`${successCount} lead(s) deleted`);
      }
      if (successCount < leadIds.length) {
        toast.error(`Failed to delete ${leadIds.length - successCount} lead(s)`);
      }
    } catch (err: any) {
      console.error("Error deleting leads:", err);
      toast.error("Error deleting leads");
    }
  };

  const handleDelete = async (leadId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/home-page-leads/${leadId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Lead deleted");
        setLeads((prev) => prev.filter((l) => l._id !== leadId));
      } else {
        toast.error(data.message || "Failed to delete lead");
      }
    } catch (err: any) {
      console.error("Error deleting lead:", err);
      toast.error("Error deleting lead");
    }
  };

  const handleView = async (leadId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/home-page-leads/${leadId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setViewLead(data.data);
        setShowViewModal(true);
      } else {
        toast.error("Failed to load lead details");
      }
    } catch (err: any) {
      console.error("Error fetching lead:", err);
      toast.error("Error loading lead");
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewLead(null);
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

  if (loading) {
    return (
      <RouteGuard>
        <div className="text-black/80">
          <p className="mb-1 text-sm">Clients / Home Page Leads</p>
          <h1 className="font-semibold text-3xl">Home Page Leads</h1>
          <div className="mt-4">
            <LoadingSpinner inline message="Loading leads..." />
          </div>
        </div>
      </RouteGuard>
    );
  }

  if (error) {
    return (
      <RouteGuard>
        <div className="text-black/80">
          <p className="mb-1 text-sm">Clients / Home Page Leads</p>
          <h1 className="font-semibold text-3xl">Home Page Leads</h1>
          <div className="mt-4 flex items-center justify-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </RouteGuard>
    );
  }

  const handleDownload = () => {
    const toExport =
      selectedIds.size > 0 ? leads.filter((l) => selectedIds.has(l._id)) : leads;
    if (toExport.length === 0) {
      toast.info("No leads to download");
      return;
    }
    downloadLeadsCSV(toExport);
    toast.success(`Downloaded ${toExport.length} lead(s) as CSV`);
  };

  const handleDownloadOne = (leadId: string) => {
    const lead = leads.find((l) => l._id === leadId);
    if (lead) {
      downloadLeadsCSV([lead]);
      toast.success("Lead downloaded as CSV");
    }
  };

  const handleDownloadViewModal = () => {
    if (!viewLead) return;
    const row: HomeData = {
      _id: viewLead._id,
      id: viewLead._id,
      name: viewLead.fullName ?? viewLead.name ?? "",
      email: viewLead.email ?? "",
      phone: viewLead.phoneNumber ?? viewLead.phone ?? "",
      countryCode: viewLead.countryCode,
      source: viewLead.source ?? "",
      date: viewLead.createdAt,
      createdAt: viewLead.createdAt,
      status: viewLead.status ?? "New",
      fullName: viewLead.fullName ?? viewLead.name,
      phoneNumber: viewLead.phoneNumber ?? viewLead.phone,
      budget: viewLead.budget,
      propertyType: viewLead.propertyType,
      consent: viewLead.consent,
    };
    downloadLeadsCSV([row]);
    toast.success("Lead downloaded as CSV");
  };

  return (
    <RouteGuard>
      <div className="text-black/80">
        <p className="mb-1 text-sm">Clients / Home Page Leads</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-semibold text-3xl">Home Page Leads</h1>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="px-4 py-2.5 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="px-4 py-2.5 rounded-lg font-medium text-white bg-primary hover:bg-primary/80 transition-colors text-sm"
                >
                  Delete selected ({selectedIds.size})
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white bg-primary hover:opacity-90 transition-opacity text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {selectedIds.size > 0 ? `Download (${selectedIds.size})` : "Download all"}
            </button>
          </div>
        </div>
        <div className="mt-4">
          <HomeTable
            data={leads}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            onView={handleView}
            onDownload={handleDownloadOne}
            selectedIds={selectedIds}
            onSelectionChange={(ids) => setSelectedIds(new Set(ids))}
          />
        </div>

        <DeleteConfirmModal
          isOpen={showBulkDeleteConfirm}
          title="Delete selected leads"
          message={`Are you sure you want to delete ${selectedIds.size} selected lead(s)? This will permanently remove them.`}
          onConfirm={async () => {
            if (selectedIds.size > 0) {
              await handleBulkDelete(Array.from(selectedIds));
              setSelectedIds(new Set());
            }
            setShowBulkDeleteConfirm(false);
          }}
          onCancel={() => setShowBulkDeleteConfirm(false)}
        />

        {/* View Modal */}
        {showViewModal && viewLead && (
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
                      {(viewLead.fullName || viewLead.name || "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 truncate">
                      {viewLead.fullName || viewLead.name || "—"}
                    </h2>
                    <p className="text-gray-600 text-sm mt-0.5 truncate">{viewLead.email}</p>
                    <span
                      className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${viewLead.status === "New"
                          ? "bg-blue-100 text-blue-800"
                          : viewLead.status === "Contacted"
                            ? "bg-yellow-100 text-yellow-800"
                            : viewLead.status === "Qualified"
                              ? "bg-purple-100 text-purple-800"
                              : viewLead.status === "Converted"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {viewLead.status || "New"}
                    </span>
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

              {/* Body - scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Contact</p>
                    <p className="text-gray-900 font-medium">
                      {viewLead.countryCode
                        ? `${viewLead.countryCode} ${viewLead.phoneNumber || viewLead.phone || ""}`
                        : viewLead.phoneNumber || viewLead.phone || "N/A"}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Budget</p>
                    <p className="text-gray-900 font-medium">{viewLead.budget || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Property Type</p>
                    <p className="text-gray-900 font-medium">{viewLead.propertyType || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Source</p>
                    <p className="text-gray-900 font-medium">{viewLead.source || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Country Code</p>
                    <p className="text-gray-900 font-medium">{viewLead.countryCode ? viewLead.countryCode.replace("+", "") : "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Consent for Updates</p>
                    <p className={`font-medium ${viewLead.consent ? "text-green-600" : "text-gray-600"}`}>
                      {viewLead.consent ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="sm:col-span-2 p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs font-medium text-primary/80 uppercase tracking-wider mb-1">Date Submitted</p>
                    <p className="text-gray-900 font-medium">{formatDate(viewLead.createdAt)}</p>
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
