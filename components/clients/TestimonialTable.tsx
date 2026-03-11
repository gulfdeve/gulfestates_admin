"use client";
import React, { useState } from "react";
import Image from "next/image";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";

interface TestimonialData {
  _id: string;
  id?: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  featured?: boolean;
  createdAt?: string;
  languages?: {
    es?: { text?: string; role?: string };
    fr?: { text?: string; role?: string };
  };
}

interface TestimonialTableProps {
  data: TestimonialData[];
  locale?: string; // 'en', 'es', or 'fr'
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}

const TestimonialTable: React.FC<TestimonialTableProps> = ({
  data,
  locale = "en",
  onEdit,
  onDelete,
  onView,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Get localized role and text based on locale
  const getLocalizedRole = (testimonial: TestimonialData): string => {
    if (locale === "es" && testimonial.languages?.es?.role) {
      return testimonial.languages.es.role;
    }
    if (locale === "fr" && testimonial.languages?.fr?.role) {
      return testimonial.languages.fr.role;
    }
    return testimonial.role;
  };

  const getLocalizedText = (testimonial: TestimonialData): string => {
    if (locale === "es" && testimonial.languages?.es?.text) {
      return testimonial.languages.es.text;
    }
    if (locale === "fr" && testimonial.languages?.fr?.text) {
      return testimonial.languages.fr.text;
    }
    return testimonial.text;
  };
  const getShortId = (id: string) => {
    if (!id) return "N/A";
    return `#${id.substring(0, 8)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  if (data.length === 0) {
    return (
      <div className="w-full rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">No testimonials found</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-x-auto rounded-lg shadow-md custom-scrollbar">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-primary text-white">
            <th className="px-4 py-4 text-left text-sm font-semibold">ID</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Name</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Role</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Rating</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Text Preview</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Featured</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Date Created</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((testimonial, index) => (
            <tr
              key={testimonial._id || testimonial.id || index}
              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-4 text-sm text-gray-900">
                {getShortId(testimonial._id || testimonial.id || "")}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                {testimonial.name}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                {getLocalizedRole(testimonial)}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                <div className="flex items-center gap-1">
                  {Array.from({ length: testimonial.rating || 0 }).map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                <p className="truncate" title={getLocalizedText(testimonial)}>
                  {(() => {
                    const text = getLocalizedText(testimonial);
                    return text.length > 50 ? `${text.substring(0, 50)}...` : text;
                  })()}
                </p>
              </td>
              <td className="px-4 py-4 text-sm">
                {testimonial.featured ? (
                  <span className="inline-flex rounded-lg bg-green-100 text-green-800 px-3 py-1 text-xs font-medium">
                    Featured
                  </span>
                ) : (
                  <span className="inline-flex rounded-lg bg-gray-100 text-gray-800 px-3 py-1 text-xs font-medium">
                    Regular
                  </span>
                )}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                {formatDate(testimonial.createdAt)}
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  {onView && (
                    <button
                      onClick={() => onView(testimonial._id || testimonial.id || "")}
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
                  {onEdit && (
                    <button
                      onClick={() => onEdit(testimonial._id || testimonial.id || "")}
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
                      onClick={() =>
                        setDeleteConfirmId(testimonial._id || testimonial.id || "")
                      }
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
        title="Delete Testimonial"
        message="Are you sure you want to delete this testimonial? This will permanently remove it."
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

export default TestimonialTable;

