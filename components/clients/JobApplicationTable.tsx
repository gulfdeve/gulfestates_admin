"use client";
import React, { useState } from "react";
import Image from "next/image";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";

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

interface JobApplicationTableProps {
  data: JobApplicationData[];
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onUpdateStatus?: (id: string, status: string) => void;
  onDownload?: (id: string) => void;
}

const JobApplicationTable: React.FC<JobApplicationTableProps> = ({
  data,
  onView,
  onDelete,
  onBulkDelete,
  onUpdateStatus,
  onDownload,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const getItemId = (item: JobApplicationData) => item._id || item.id || "";

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((d) => getItemId(d)).filter(Boolean)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size > 0) setBulkDeleteConfirm(true);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      Pending: "bg-yellow-100 text-yellow-800",
      Reviewed: "bg-blue-100 text-blue-800",
      Accepted: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusColors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="relative w-full overflow-x-auto custom-scrollbar rounded-lg shadow-md">
      {onBulkDelete && selectedIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-3">
          <span className="text-sm text-gray-700">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
            >
              Delete Selected ({selectedIds.size})
            </button>
          </div>
        </div>
      )}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-primary text-white">
            {onBulkDelete && (
              <th className="px-4 py-4 text-left w-12">
                <input
                  type="checkbox"
                  checked={data.length > 0 && selectedIds.size === data.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
            )}
            <th className="px-4 py-4 text-left text-sm font-semibold">Name</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Email</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Job Position</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Status</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Date</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={onBulkDelete ? 8 : 7} className="px-4 py-8 text-center text-gray-500">
                No job applications found
              </td>
            </tr>
          ) : (
            data.map((application, index) => (
              <tr
                key={application._id || application.id || index}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {onBulkDelete && (
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(getItemId(application))}
                      onChange={() => toggleSelect(getItemId(application))}
                      className="rounded border-gray-300"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                )}
                <td className="px-4 py-4 text-sm text-gray-900">
                  {application.firstName} {application.lastName}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {application.email}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {typeof application.jobId === "object"
                    ? application.jobId.title
                    : "N/A"}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {getStatusBadge(application.status)}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {formatDate(application.date || application.createdAt)}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  <div className="flex items-center gap-3">
                    {onView && (
                      <button
                        onClick={() => onView(getItemId(application))}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="View"
                      >
                        <Image
                          src="/icons/eye.svg"
                          alt="View"
                          width={18}
                          height={18}
                        />
                      </button>
                    )}
                    {onDownload && (
                      <button
                        onClick={() => onDownload(getItemId(application))}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Download CSV"
                        type="button"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => setDeleteConfirmId(getItemId(application))}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        title="Delete"
                      >
                        <Image
                          src="/icons/delete.svg"
                          alt="Delete"
                          width={18}
                          height={18}
                        />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <DeleteConfirmModal
        isOpen={!!deleteConfirmId}
        title="Delete Application"
        message="Are you sure you want to delete this job application? This will permanently remove it."
        onConfirm={() => {
          if (deleteConfirmId) {
            onDelete?.(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
      <DeleteConfirmModal
        isOpen={bulkDeleteConfirm}
        title="Delete Selected Applications"
        message={`Are you sure you want to delete ${selectedIds.size} selected application(s)? This will permanently remove them.`}
        onConfirm={() => {
          if (selectedIds.size > 0) {
            onBulkDelete?.(Array.from(selectedIds));
            setSelectedIds(new Set());
            setBulkDeleteConfirm(false);
          }
        }}
        onCancel={() => setBulkDeleteConfirm(false)}
      />
    </div>
  );
};

export default JobApplicationTable;

