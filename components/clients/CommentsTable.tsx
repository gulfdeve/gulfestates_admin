"use client";

import React, { useState } from "react";
import Image from "next/image";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";

export interface CommentData {
  _id: string;
  blog: { _id: string; title?: string; slug?: string };
  name: string;
  email: string;
  comment: string;
  approved: boolean;
  createdAt: string;
}

interface CommentsTableProps {
  data: CommentData[];
  onApprove?: (id: string) => void;
  onDelete?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onView?: (id: string) => void;
}

const CommentsTable: React.FC<CommentsTableProps> = ({
  data,
  onApprove,
  onDelete,
  onBulkDelete,
  onView,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const truncateComment = (text: string, maxLen = 60) =>
    !text ? "—" : text.length <= maxLen ? text : text.substring(0, maxLen) + "...";

  const getBlogTitle = (blog: CommentData["blog"]) =>
    blog ? (blog as { title?: string }).title || "Unknown" : "—";

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
            <th className="px-4 py-4 text-left text-sm font-semibold">Blog</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Comment</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Status</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Date</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={item._id || index}
              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {onBulkDelete && (
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item._id)}
                    onChange={() => toggleSelect(item._id)}
                    className="rounded border-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
              )}
              <td className="px-4 py-4 text-sm text-gray-900 font-medium">{item.name}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{item.email}</td>
              <td className="px-4 py-4 text-sm text-gray-900">{getBlogTitle(item.blog)}</td>
              <td className="px-4 py-4 text-sm text-gray-600 max-w-[200px]">
                <span title={item.comment}>{truncateComment(item.comment)}</span>
              </td>
              <td className="px-4 py-4 text-sm">
                <span
                  className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    item.approved ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {item.approved ? "Approved" : "Pending"}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">{formatDate(item.createdAt)}</td>
              <td className="px-4 py-4 text-sm">
                <div className="flex items-center gap-3">
                  {onView && (
                    <button
                      onClick={() => onView(item._id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="View"
                    >
                      <Image src="/icons/eye.svg" alt="View" width={18} height={18} />
                    </button>
                  )}
                  {onApprove && !item.approved && (
                    <button
                      onClick={() => onApprove(item._id)}
                      className="p-1 hover:bg-green-100 rounded transition-colors text-green-700"
                      title="Approve"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => setDeleteConfirmId(item._id)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                      title="Delete"
                    >
                      <Image src="/icons/delete.svg" alt="Delete" width={18} height={18} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <DeleteConfirmModal
        isOpen={bulkDeleteConfirm}
        title="Bulk Delete Comments"
        message={`Are you sure you want to delete ${selectedIds.size} selected comment(s)? This cannot be undone.`}
        onConfirm={() => {
          if (selectedIds.size > 0 && onBulkDelete) {
            onBulkDelete(Array.from(selectedIds));
            setBulkDeleteConfirm(false);
            setSelectedIds(new Set());
          }
        }}
        onCancel={() => setBulkDeleteConfirm(false)}
      />
      <DeleteConfirmModal
        isOpen={!!deleteConfirmId}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This cannot be undone."
        onConfirm={() => {
          if (deleteConfirmId) {
            onDelete?.(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};

export default CommentsTable;
