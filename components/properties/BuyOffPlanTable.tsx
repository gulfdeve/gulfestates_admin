"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";

export type Project = {
  id: string;
  name_en: string;
  name_es?: string;
  name_fr?: string;
  developer: string;
  location: string;
  type: string;
  completion: string;
  status: "Under Construction" | "Upcoming";
  progress: number;
  units: number;
  price: string;
};

const ProgressBar: React.FC<{ percentage: number }> = ({ percentage }) => (
  <div className="w-20 overflow-hidden rounded-full bg-gray-200">
    <div
      className="h-2.5 rounded-full bg-primary"
      style={{ width: `${percentage}%` }}
    ></div>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const isGray = status === "Upcoming" || status === "Under Construction";
  const bgColor = isGray ? "bg-gray-200" : "bg-gray-100";
  const textColor = "text-gray-700";

  return (
    <span
      className={`inline-flex rounded px-2 py-2 text-[11px] font-medium w-[75px] ${bgColor} ${textColor}`}
    >
      {status}
    </span>
  );
};
interface BuyOffPlanTableProps {
  lang: "en" | "es" | "fr";
  data: Project[];
  onEditLink?: string;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

// Stable empty array to avoid "Maximum update depth exceeded" when selectedIds is not passed
const EMPTY_IDS: string[] = [];

const BuyOffPlanTable: React.FC<BuyOffPlanTableProps> = ({
  lang,
  data,
  onEditLink,
  onDelete,
  onView,
  onEdit,
  onBulkDelete,
  selectedIds = EMPTY_IDS,
  onSelectionChange,
}) => {
  const [selected, setSelected] = useState<string[]>(selectedIds);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);

  useEffect(() => {
    setSelected(selectedIds);
  }, [selectedIds]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = data.map((project) => project.id);
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

  return (
    <div className="min-h-full">
      {selected.length > 0 && onBulkDelete && (
        <div className="mb-4 flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-3">
          <span className="text-sm text-gray-700">
            {selected.length} project{selected.length > 1 ? "s" : ""} selected
          </span>
          <button
            onClick={() => setBulkDeleteIds([...selected])}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
          >
            Delete Selected ({selected.length})
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg bg-white shadow-md custom-scrollbar">
        <table className="min-w-full">
          <thead className="bg-primary">
            <tr>
              <th className="px-2 py-4 text-left text-xs text-white/90 w-12">
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
              {lang === "en" && (
                <th className="px-2 py-4 text-left text-xs text-white/90">
                  Project Name (EN)
                </th>
              )}

              {lang === "es" && (
                <th className="px-2 py-4 text-left text-xs text-white/90">
                  Project Name (ES)
                </th>
              )}

              {lang === "fr" && (
                <th className="px-2 py-4 text-left text-xs text-white/90">
                  Project Name (FR)
                </th>
              )}

              <th className="px-2 py-4 text-left text-xs text-white/90">
                Developer
              </th>
              <th className="px-2 py-4 text-left text-xs text-white/90">
                Location
              </th>
              <th className="px-2 py-4 text-left text-xs text-white/90">
                Type
              </th>
              <th className="px-2 py-4 text-left text-xs text-white/90">
                Completion
              </th>
              <th className="px-2 py-4 text-left text-xs text-white/90">
                Status
              </th>
              <th className="px-2 py-4 text-left text-xs text-white/90">
                Price
              </th>
              <th className="px-3 py-4 text-center text-sm font-medium text-white/90">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((project, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-2 py-4 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(project.id)}
                    onChange={(e) =>
                      handleSelectOne(project.id, e.target.checked)
                    }
                    className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                  />
                </td>

                {/* English Name - only when lang is EN */}
                {lang === "en" && (
                  <td className="px-2 py-4 text-sm">{project.name_en}</td>
                )}

                {/* Spanish Name - only when lang is ES */}
                {lang === "es" && (
                  <td className="px-2 py-4 text-sm">
                    {project.name_es ?? project.name_en ?? "-"}
                  </td>
                )}

                {/* French Name - only when lang is FR */}
                {lang === "fr" && (
                  <td className="px-2 py-4 text-sm">
                    {project.name_fr ?? project.name_en ?? "-"}
                  </td>
                )}

                <td className="px-2 py-4 text-sm">{project.developer}</td>
                <td className="px-2 py-4 text-sm">{project.location}</td>
                <td className="px-2 py-4 text-sm">{project.type}</td>
                <td className="px-2 py-4 text-sm">{project.completion}</td>

                <td className="px-2 py-4 text-sm">
                  <StatusBadge status={project.status} />
                </td>
                <td className="px-2 py-4 text-sm">{project.price}</td>

                <td className="px-3 py-4 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    {onView && (
                      <button
                        onClick={() => onView(project.id)}
                        className="w-8 h-8 hover:bg-gray-200 rounded transition-colors"
                        title="View"
                      >
                        <Image
                          src="/icons/eye.svg"
                          alt="View"
                          width={20}
                          height={20}
                          className="w-5 h-5 cursor-pointer flex-nowrap"
                        />
                      </button>
                    )}
                    {onEditLink ? (
                      <Link
                        href={onEditLink + `?id=${project.id}`}
                        // onClick={() => onEdit(project.id)}
                        className="flex items-center justify-center w-8 h-8 hover:bg-gray-200 rounded transition-colors"
                        title="Edit"
                      >
                        <Image
                          src="/icons/edit.svg"
                          alt="edit"
                          width={20}
                          height={20}
                          className="w-5 h-5 cursor-pointer flex-nowrap"
                        />
                      </Link>
                    ) : (
                      <Link
                        href={`/${lang}/off-plans/edit?id=${project.id}`}
                        className="w-8 h-8 hover:bg-gray-200 rounded transition-colors"
                        title="Edit"
                      >
                        <Image
                          src="/icons/edit.svg"
                          alt="edit"
                          width={20}
                          height={20}
                          className="w-5 h-5 cursor-pointer flex-nowrap"
                        />
                      </Link>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => setDeleteConfirmId(project.id)}
                        className="p-1.5 hover:bg-red-100 rounded transition-colors flex items-center justify-center"
                        title="Delete"
                      >
                        <Image
                          src="/icons/delete.svg"
                          alt="delete"
                          width={20}
                          height={20}
                          className="w-5 h-5 cursor-pointer flex-nowrap"
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
        title="Delete Off-Plan Project"
        message="Are you sure you want to delete this off-plan project? This will permanently remove it."
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
        title={`Delete ${bulkDeleteIds?.length || 0} Project${(bulkDeleteIds?.length || 0) > 1 ? "s" : ""}`}
        message={`Are you sure you want to delete ${bulkDeleteIds?.length || 0} selected off-plan project${(bulkDeleteIds?.length || 0) > 1 ? "s" : ""}? This will permanently remove them.`}
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

export default BuyOffPlanTable;
