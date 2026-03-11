"use client";
import React, { useState } from "react";
import Image from "next/image";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";

// Types
export interface NewsletterData {
  _id: string;
  email: string;
  createdAt: string;
}

interface NewsletterTableProps {
  data: NewsletterData[];
  onDelete?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onDownload?: (id: string) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: string[]) => void;
}

const NewsletterTable: React.FC<NewsletterTableProps> = ({
  data,
  onDelete,
  onBulkDelete,
  onDownload,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const isControlled = controlledSelectedIds !== undefined && onSelectionChange !== undefined;
  const selectedIds = isControlled ? controlledSelectedIds : internalSelectedIds;
  const setSelectedIds = isControlled
    ? (next: Set<string> | ((prev: Set<string>) => Set<string>)) => {
        const nextSet = typeof next === "function" ? next(selectedIds) : next;
        onSelectionChange(Array.from(nextSet));
      }
    : setInternalSelectedIds;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return "N/A";
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
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
      setSelectedIds(new Set(data.map((d) => d._id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size > 0) setBulkDeleteConfirm(true);
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No newsletter subscribers found.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-x-auto custom-scrollbar rounded-lg shadow-md">
      {onBulkDelete && !isControlled && selectedIds.size > 0 && (
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
            <th className="px-4 py-4 text-left text-sm font-semibold">Email</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Date</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Time</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">
              Status
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((subscription) => (
            <tr
              key={subscription._id}
              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {onBulkDelete && (
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(subscription._id)}
                    onChange={() => toggleSelect(subscription._id)}
                    className="rounded border-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
              )}
              <td className="px-4 py-4 text-sm text-gray-900">
                {subscription.email}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                {formatDate(subscription.createdAt)}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                {formatTime(subscription.createdAt)}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Active
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                <div className="flex items-center gap-3">
                  {onDownload && (
                    <button
                      onClick={() => onDownload(subscription._id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Download CSV"
                      type="button"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => setDeleteConfirmId(subscription._id)}
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
          ))}
        </tbody>
      </table>

      <DeleteConfirmModal
        isOpen={!!deleteConfirmId}
        title="Delete Subscriber"
        message="Are you sure you want to delete this newsletter subscriber? This will permanently remove it."
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
        title="Delete Selected Subscribers"
        message={`Are you sure you want to delete ${selectedIds.size} selected subscriber(s)? This will permanently remove them.`}
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

export default NewsletterTable;
