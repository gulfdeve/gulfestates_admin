"use client";

import RouteGuard from "@/components/auth/RouteGuard";
import { useState } from "react";
import { toast } from "sonner";

function parseFilename(contentDisposition: string | null): string {
  if (!contentDisposition) {
    return `gulfestates-db-backup-${Date.now()}.json`;
  }
  const match = contentDisposition.match(/filename="([^"]+)"/i);
  return match?.[1] ?? `gulfestates-db-backup-${Date.now()}.json`;
}

function DatabaseBackupContent() {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadBackup = async () => {
    try {
      setDownloading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated. Please sign in again.");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
      const response = await fetch(`${API_URL}/api/admin/database/backup`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let message = "Failed to create database backup.";
        try {
          const data = await response.json();
          message = data.message || message;
        } catch {
          // response may not be JSON
        }
        toast.error(message);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = parseFilename(response.headers.get("Content-Disposition"));
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Database backup downloaded.");
    } catch (error) {
      console.error("Database backup download error:", error);
      toast.error("Could not download backup. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 text-gray-800">
      <h1 className="text-3xl font-semibold mb-2">Database backup</h1>
      <p className="text-gray-600 mb-8">
        Download a JSON snapshot of all MongoDB collections. This action is restricted to
        superadmin accounts only.
      </p>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <p className="text-sm text-gray-600">
          The file includes every non-system collection in the connected database. Store backups
          securely; they may contain sensitive customer and admin data.
        </p>
        <button
          type="button"
          onClick={handleDownloadBackup}
          disabled={downloading}
          className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? "Preparing backup..." : "Download database backup"}
        </button>
      </div>
    </div>
  );
}

export default function DatabaseBackupPage() {
  return (
    <RouteGuard requiredRole="superadmin">
      <DatabaseBackupContent />
    </RouteGuard>
  );
}
