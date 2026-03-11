"use client";

import NewsletterTable, {
  NewsletterData,
} from "@/components/clients/NewsletterTable";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RouteGuard from "@/components/auth/RouteGuard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Build CSV and trigger download
function downloadNewsletterCSV(subsToExport: NewsletterData[]) {
  if (subsToExport.length === 0) return;
  const headers = ["Email", "Date Subscribed"];
  const escape = (v: string | undefined) => {
    const s = v === undefined || v === null ? "" : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = subsToExport.map((s) =>
    [
      s.email,
      s.createdAt ? new Date(s.createdAt).toISOString() : "",
    ].map(escape).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function NewsletterPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [subscriptions, setSubscriptions] = useState<NewsletterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Fetch subscriptions when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscriptions();
    }
  }, [isAuthenticated]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");

      if (!token) {
        setError("Authentication required. Please login.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/subscribe`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch subscriptions");
      }

      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.data || []);
      } else {
        setError(data.message || "Failed to fetch subscriptions");
      }
    } catch (err: any) {
      console.error("Error fetching subscriptions:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }
      let successCount = 0;
      for (const id of ids) {
        const res = await fetch(`${API_URL}/api/subscribe/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (data.success) {
          successCount++;
          setSubscriptions((prev) => prev.filter((sub) => sub._id !== id));
        }
      }
      if (successCount > 0) toast.success(`${successCount} subscriber(s) deleted`);
      if (successCount < ids.length) toast.error(`Failed to delete ${ids.length - successCount} subscriber(s)`);
    } catch (err: any) {
      console.error("Error deleting subscriptions:", err);
      toast.error("Error deleting subscriptions");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const res = await fetch(`${API_URL}/api/subscribe/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Subscriber deleted");
        setSubscriptions((prev) => prev.filter((sub) => sub._id !== id));
      } else {
        toast.error(data.message || "Failed to delete subscription");
      }
    } catch (err: any) {
      console.error("Error deleting subscription:", err);
      toast.error("Error deleting subscription. Please try again.");
    }
  };

  const handleDownload = () => {
    const toExport =
      selectedIds.size > 0 ? subscriptions.filter((s) => selectedIds.has(s._id)) : subscriptions;
    if (toExport.length === 0) {
      toast.info("No subscribers to download");
      return;
    }
    downloadNewsletterCSV(toExport);
    toast.success(`Downloaded ${toExport.length} subscriber(s) as CSV`);
  };

  const handleDownloadOne = (id: string) => {
    const sub = subscriptions.find((s) => s._id === id);
    if (sub) {
      downloadNewsletterCSV([sub]);
      toast.success("Subscriber downloaded as CSV");
    }
  };

  return (
    <RouteGuard>
      <div className="text-black/80">
        <p className="mb-1 text-sm">Clients / Newsletter Subscribers</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-semibold text-3xl">Newsletter Subscribers</h1>
          {!loading && !error && (
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
          )}
        </div>
        <div className="mt-4">
          {loading ? (
            <LoadingSpinner inline message="Loading subscriptions..." />
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">Error: {error}</p>
            </div>
          ) : (
            <NewsletterTable
              data={subscriptions}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              onDownload={handleDownloadOne}
              selectedIds={selectedIds}
              onSelectionChange={(ids) => setSelectedIds(new Set(ids))}
            />
          )}
        </div>

        <DeleteConfirmModal
          isOpen={showBulkDeleteConfirm}
          title="Delete selected subscribers"
          message={`Are you sure you want to delete ${selectedIds.size} selected subscriber(s)? This will permanently remove them.`}
          onConfirm={async () => {
            if (selectedIds.size > 0) {
              await handleBulkDelete(Array.from(selectedIds));
              setSelectedIds(new Set());
            }
            setShowBulkDeleteConfirm(false);
          }}
          onCancel={() => setShowBulkDeleteConfirm(false)}
        />
      </div>
    </RouteGuard>
  );
}
