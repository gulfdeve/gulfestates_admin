"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";

interface BlogData {
  id: string;
  _id?: string;
  title: string;
  title_es?: string;
  title_fr?: string;
  category: string;
  dateCreated: string;
  published?: boolean;
}

interface BlogTableProps {
  data: BlogData[];
  lang: "en" | "es" | "fr";
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

// Stable empty array to avoid "Maximum update depth exceeded" when selectedIds is not passed
const EMPTY_IDS: string[] = [];

const BlogTable: React.FC<BlogTableProps> = ({
  data,
  lang,
  onEdit,
  onDelete,
  onView,
  onBulkDelete,
  selectedIds = EMPTY_IDS,
  onSelectionChange,
}) => {
  const showExtraColumn = lang === "es" || lang === "fr";
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<string[]>(selectedIds);

  useEffect(() => {
    setSelected(selectedIds);
  }, [selectedIds]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = data.map((blog) => blog._id || blog.id);
      setSelected(allIds);
      onSelectionChange?.(allIds);
    } else {
      setSelected([]);
      onSelectionChange?.([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      const newSelected = [...selected, id];
      setSelected(newSelected);
      onSelectionChange?.(newSelected);
    } else {
      const newSelected = selected.filter((selectedId) => selectedId !== id);
      setSelected(newSelected);
      onSelectionChange?.(newSelected);
    }
  };

  const isAllSelected = data.length > 0 && selected.length === data.length;
  const isIndeterminate = selected.length > 0 && selected.length < data.length;

  const handleEdit = (blog: BlogData) => {
    if (onEdit) {
      onEdit(blog._id || blog.id);
    }
  };

  const handleDelete = (blog: BlogData) => {
    setDeleteConfirmId(blog._id || blog.id);
  };

  const handleView = (blog: BlogData) => {
    if (onView) {
      onView(blog._id || blog.id);
    }
  };

  if (data.length === 0) {
    return (
      <div className="w-full p-8 text-center border border-gray-200 rounded-lg">
        <p className="text-gray-500">No blogs found. Create your first blog!</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full">
      {selected.length > 0 && onBulkDelete && (
        <div className="mb-4 flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-3">
          <span className="text-sm text-gray-700">
            {selected.length} blog{selected.length > 1 ? "s" : ""} selected
          </span>
          <button
            onClick={() => setBulkDeleteIds([...selected])}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
          >
            Delete Selected ({selected.length})
          </button>
        </div>
      )}
      <div className="w-full overflow-x-auto rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-primary text-white">
              <th className="px-3 py-4 text-left text-sm font-semibold w-12">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                />
              </th>

              {/* English Title - only show on English page */}
              {lang === "en" && (
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Title (EN)
                </th>
              )}

              {/* Spanish or French Title */}
              {showExtraColumn && (
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Title ({lang.toUpperCase()})
                </th>
              )}

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Category
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Date Created
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {data.map((blog, index) => (
              <tr
                key={`${blog.id || blog._id}-${index}`}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <td className="px-3 py-4 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(blog._id || blog.id)}
                    onChange={(e) =>
                      handleSelectOne(blog._id || blog.id, e.target.checked)
                    }
                    className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                  />
                </td>

                {/* English Title - only show on English page */}
                {lang === "en" && (
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="line-clamp-3">{blog.title}</div>
                  </td>
                )}

                {/* Translated Title */}
                {showExtraColumn && (
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="line-clamp-3">
                      {lang === "es"
                        ? blog.title_es || "-"
                        : blog.title_fr || "-"}
                    </div>
                  </td>
                )}

                <td className="px-6 py-4 text-sm text-gray-900">
                  {blog.category}
                </td>

                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      blog.published
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {blog.published ? "Published" : "Draft"}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm text-gray-900">
                  {blog.dateCreated}
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    {onView && (
                      <button
                        onClick={() => handleView(blog)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="View"
                      >
                        <Image
                          src="/icons/eye.svg"
                          width={28}
                          height={28}
                          alt="View"
                        />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => handleEdit(blog)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Edit"
                      >
                        <Image
                          src="/icons/edit.svg"
                          width={28}
                          height={28}
                          alt="Edit"
                        />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => handleDelete(blog)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        title="Delete"
                      >
                        <Image
                          src="/icons/delete.svg"
                          width={28}
                          height={28}
                          alt="Delete"
                        />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteConfirmId}
        title="Delete Blog"
        message="Are you sure you want to delete this blog? This will permanently remove it."
        onConfirm={() => {
          if (deleteConfirmId) {
            onDelete?.(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />

      <DeleteConfirmModal
        isOpen={!!bulkDeleteIds}
        title={`Delete ${bulkDeleteIds?.length || 0} Blog${
          (bulkDeleteIds?.length || 0) > 1 ? "s" : ""
        }`}
        message={`Are you sure you want to delete ${
          bulkDeleteIds?.length || 0
        } selected blog${
          (bulkDeleteIds?.length || 0) > 1 ? "s" : ""
        }? This will permanently remove them.`}
        onConfirm={() => {
          if (bulkDeleteIds) {
            onBulkDelete?.(bulkDeleteIds);
            setSelected([]);
            onSelectionChange?.([]);
            setBulkDeleteIds(null);
          }
        }}
        onCancel={() => setBulkDeleteIds(null)}
      />
    </div>
  );
};

export default BlogTable;
