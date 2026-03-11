"use client";
import Image from "next/image";
import React, { useState } from "react";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";

// Types
interface HomeData {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  countryCode?: string;
  source: string;
  date?: string;
  createdAt?: string;
  status: string;
}

interface HomeTableProps {
  data: HomeData[];
  onDelete?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: string[]) => void;
}

const HomeTable: React.FC<HomeTableProps> = ({
  data,
  onDelete,
  onBulkDelete,
  onView,
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

  const getItemId = (item: HomeData) => item._id || item.id || "";

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

  const formatPhone = (countryCode?: string, phone?: string) => {
    if (!phone) return "N/A";
    return countryCode ? `${countryCode} ${phone}` : phone;
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
    setSelectedIds((prev) => {
      if (prev.size === data.length) return new Set();
      return new Set(data.map((d) => getItemId(d)).filter(Boolean));
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size > 0) {
      setBulkDeleteConfirm(true);
    }
  };

  return (
    <div className="relative w-full overflow-x-auto custom-scrollbar rounded-lg shadow-md">
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
            <th className="px-4 py-4 text-left text-sm font-semibold">Phone</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">
              Source
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Date</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">
              Status
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((home, index) => (
            <tr
              key={home._id || home.id || index}
              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {onBulkDelete && (
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(getItemId(home))}
                    onChange={() => toggleSelect(getItemId(home))}
                    className="rounded border-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
              )}
              <td className="px-4 py-4 text-sm text-gray-900">{home.name}</td>
              <td className="px-4 py-4 text-sm text-gray-900">{home.email}</td>
              <td className="px-4 py-4 text-sm text-gray-900">
                {formatPhone(home.countryCode, home.phone)}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">{home.source}</td>
              <td className="px-4 py-4 text-sm text-gray-900">
                {formatDate(home.date || home.createdAt)}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${home.status === "New"
                    ? "bg-blue-100 text-blue-800"
                    : home.status === "Contacted"
                      ? "bg-yellow-100 text-yellow-800"
                      : home.status === "Qualified"
                        ? "bg-purple-100 text-purple-800"
                        : home.status === "Converted"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                >
                  {home.status}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  {onView && (
                    <button
                      onClick={() => onView(getItemId(home))}
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
                      onClick={() => onDownload(getItemId(home))}
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
                      onClick={() => setDeleteConfirmId(getItemId(home))}
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
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This will permanently remove it."
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
        title="Delete Selected Leads"
        message={`Are you sure you want to delete ${selectedIds.size} selected lead(s)? This will permanently remove them.`}
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

export default HomeTable;
