"use client";
import ContactTable from "@/components/clients/ContactTable";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RouteGuard from "@/components/auth/RouteGuard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";

// Types
interface ContactData {
  _id: string;
  id?: string;
  name: string;
  email: string;
  countryCode?: string;
  phone: string;
  message: string;
  createdAt?: string;
  date?: string;
}

// Build CSV and trigger download
function downloadContactsCSV(contactsToExport: ContactData[]) {
  if (contactsToExport.length === 0) return;
  const headers = ["Name", "Email", "Country Code", "Phone", "Message", "Date Submitted"];
  const escape = (v: string | undefined) => {
    const s = v === undefined || v === null ? "" : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = contactsToExport.map((c) =>
    [
      c.name,
      c.email,
      c.countryCode ?? "",
      c.phone,
      c.message ?? "",
      c.createdAt ? new Date(c.createdAt).toISOString() : "",
    ].map(escape).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `contact-us-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ContactUsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewContact, setViewContact] = useState<ContactData | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Fetch contacts when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchContacts();
    }
  }, [isAuthenticated]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/contact`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        const transformedContacts: ContactData[] = data.data.map(
          (contact: any) => ({
            _id: contact._id,
            id: contact._id,
            name: contact.name || "",
            email: contact.email || "",
            countryCode: contact.countryCode || "",
            phone: contact.phone || "",
            message: contact.message || "",
            createdAt: contact.createdAt,
            date: contact.createdAt,
          })
        );
        setContacts(transformedContacts);
      } else {
        setError("Failed to load contacts");
      }
    } catch (err: any) {
      setError("Error loading contacts");
      console.error("Error fetching contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async (contactIds: string[]) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        return;
      }
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      let successCount = 0;
      for (const id of contactIds) {
        const response = await fetch(`${API_URL}/api/contact/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (data.success) {
          successCount++;
          setContacts((prev) => prev.filter((c) => c._id !== id));
        }
      }
      if (successCount > 0) toast.success(`${successCount} contact(s) deleted`);
      if (successCount < contactIds.length) toast.error(`Failed to delete ${contactIds.length - successCount} contact(s)`);
    } catch (err: any) {
      console.error("Error deleting contacts:", err);
      toast.error("Error deleting contacts");
    }
  };

  const handleDelete = async (contactId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/contact/${contactId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Contact deleted");
        setContacts((prev) => prev.filter((c) => c._id !== contactId));
      } else {
        toast.error(data.message || "Failed to delete contact");
      }
    } catch (err: any) {
      console.error("Error deleting contact:", err);
      toast.error("Error deleting contact");
    }
  };

  const handleEdit = (contactId: string) => {
    window.location.href = `/clients/contact-us/edit/${contactId}`;
  };

  const handleView = async (contactId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/contact/${contactId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setViewContact(data.data);
        setShowViewModal(true);
      } else {
        toast.error("Failed to load contact details");
      }
    } catch (err: any) {
      console.error("Error fetching contact:", err);
      toast.error("Error loading contact");
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewContact(null);
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

  const handleDownload = () => {
    const toExport =
      selectedIds.size > 0 ? contacts.filter((c) => selectedIds.has(c._id)) : contacts;
    if (toExport.length === 0) {
      toast.info("No contacts to download");
      return;
    }
    downloadContactsCSV(toExport);
    toast.success(`Downloaded ${toExport.length} contact(s) as CSV`);
  };

  const handleDownloadOne = (contactId: string) => {
    const contact = contacts.find((c) => c._id === contactId);
    if (contact) {
      downloadContactsCSV([contact]);
      toast.success("Contact downloaded as CSV");
    }
  };

  const handleDownloadViewModal = () => {
    if (!viewContact) return;
    downloadContactsCSV([viewContact]);
    toast.success("Contact downloaded as CSV");
  };

  if (loading) {
    return (
      <RouteGuard>
        <div className="text-black/80">
          <p className="mb-1 text-sm">Clients / Contact Us Page Leads</p>
          <h1 className="font-semibold text-3xl">Contact Us Page Leads</h1>
          <div className="mt-4">
            <LoadingSpinner inline message="Loading contacts..." />
          </div>
        </div>
      </RouteGuard>
    );
  }

  if (error) {
    return (
      <RouteGuard>
        <div className="text-black/80">
          <p className="mb-1 text-sm">Clients / Contact Us Page Leads</p>
          <h1 className="font-semibold text-3xl">Contact Us Page Leads</h1>
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
        <p className="mb-1 text-sm">Clients / Contact Us Page Leads</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-semibold text-3xl">Contact Us Page Leads</h1>
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
          <ContactTable
            data={contacts}
            onEdit={handleEdit}
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
          title="Delete selected contacts"
          message={`Are you sure you want to delete ${selectedIds.size} selected contact(s)? This will permanently remove them.`}
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
        {showViewModal && viewContact && (
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
                      {(viewContact.name || "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 truncate">
                      {viewContact.name || "—"}
                    </h2>
                    <p className="text-gray-600 text-sm mt-0.5 truncate">{viewContact.email}</p>
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
                  <div className="sm:col-span-2 p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                    <p className="text-gray-900 font-medium">
                      {viewContact.countryCode
                        ? `${viewContact.countryCode} ${viewContact.phone}`
                        : viewContact.phone || "N/A"}
                    </p>
                  </div>
                  <div className="sm:col-span-2 p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Message</p>
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{viewContact.message || "—"}</p>
                  </div>
                  <div className="sm:col-span-2 p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs font-medium text-primary/80 uppercase tracking-wider mb-1">Date Submitted</p>
                    <p className="text-gray-900 font-medium">{formatDate(viewContact.createdAt)}</p>
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
