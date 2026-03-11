"use client";
import React, { useState } from "react";
import Image from "next/image";
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

interface ContactTableProps {
  data: ContactData[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: string[]) => void;
}

const ContactTable: React.FC<ContactTableProps> = ({
  data,
  onEdit,
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

  const getItemId = (item: ContactData) => item._id || item.id || "";

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
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((d) => getItemId(d)).filter(Boolean)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size > 0) setBulkDeleteConfirm(true);
  };

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
            <th className="px-4 py-4 text-left text-sm font-semibold">Name</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Email</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Phone</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Date</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((contact, index) => (
            <tr
              key={contact._id || contact.id || index}
              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {onBulkDelete && (
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(getItemId(contact))}
                    onChange={() => toggleSelect(getItemId(contact))}
                    className="rounded border-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
              )}
              <td className="px-4 py-4 text-sm text-gray-900">
                {contact.name}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                {contact.email}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                {formatPhone(contact.countryCode, contact.phone)}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                {formatDate(contact.date || contact.createdAt)}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                <div className="flex items-center gap-3">
                  {onView && (
                    <button
                      onClick={() => onView(contact._id || contact.id || "")}
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
                      onClick={() => onDownload(getItemId(contact))}
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
                  {onEdit && (
                    <button
                      onClick={() => onEdit(getItemId(contact))}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Edit"
                    >
                      <Image
                        src="/icons/edit.svg"
                        alt="Edit"
                        width={18}
                        height={18}
                      />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => setDeleteConfirmId(contact._id || contact.id || "")}
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
        isOpen={bulkDeleteConfirm}
        title="Bulk Delete Contacts"
        message={`Are you sure you want to delete ${selectedIds.size} selected contact(s)? This will permanently remove them.`}
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
        title="Delete Contact"
        message="Are you sure you want to delete this contact? This will permanently remove it."
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

export default ContactTable;
