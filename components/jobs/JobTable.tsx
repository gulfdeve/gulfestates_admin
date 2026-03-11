"use client";
import Image from "next/image";
import React, { useState } from "react";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";

interface JobData {
  id: string;
  _id?: string;
  title: string;
  title_es?: string;
  title_fr?: string;
  location: string;
  type: string;
  status: string;
  dateCreated: string;
  department?: string;
}

interface JobTableProps {
  data: JobData[];
  lang: "en" | "es" | "fr";
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}

const JobTable: React.FC<JobTableProps> = ({ data, lang, onEdit, onDelete, onView }) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const showExtraColumn = lang === "es" || lang === "fr";

  const getShortId = (id: string) => {
    if (!id) return "N/A";
    // Return last 8 characters of ID
    return `#${id.slice(-8)}`;
  };

  const handleEdit = (job: JobData) => {
    if (onEdit) {
      onEdit(job._id || job.id);
    }
  };

  const handleDeleteClick = (job: JobData) => {
    setDeleteConfirmId(job._id || job.id);
  };

  const handleView = (job: JobData) => {
    if (onView) {
      onView(job._id || job.id);
    }
  };

  if (data.length === 0) {
    return (
      <div className="w-full p-8 text-center border border-gray-200 rounded-lg">
        <p className="text-gray-500">No jobs found. Create your first job!</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-x-auto custom-scrollbar rounded-lg shadow-md">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-primary text-white">
            <th className="px-6 py-4 text-left text-sm font-semibold">
              Job ID
            </th>

            {/* English Title - only show for English locale */}
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
              Location
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold">
              Type
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
          {data.map((job, index) => (
            <tr
              key={`${job.id || job._id}-${index}`}
              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <td className="px-6 py-4 text-sm text-gray-900">
                {getShortId(job._id || job.id)}
              </td>

              {/* English Title - only show for English locale */}
              {lang === "en" && (
                <td className="px-6 py-4 text-sm text-gray-900">{job.title}</td>
              )}

              {/* Translated Title */}
              {showExtraColumn && (
                <td className="px-6 py-4 text-sm text-gray-900">
                  {lang === "es" ? job.title_es || "-" : job.title_fr || "-"}
                </td>
              )}

              <td className="px-6 py-4 text-sm text-gray-900">
                {job.location}
              </td>

              <td className="px-6 py-4 text-sm text-gray-900">
                {job.type}
              </td>
              <td className="px-6 py-4 text-sm">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${job.status === "Open"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                    }`}
                >
                  {job.status}
                </span>
              </td>

              <td className="px-6 py-4 text-sm text-gray-900">
                {job.dateCreated}
              </td>

              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  {onView && (
                    <button
                      onClick={() => handleView(job)}
                      aria-label="View"
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
                      onClick={() => handleEdit(job)}
                      aria-label="Edit"
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
                      onClick={() => handleDeleteClick(job)}
                      aria-label="Delete"
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
        title="Delete Job"
        message="Are you sure you want to delete this job? This will permanently remove it."
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

export default JobTable;


