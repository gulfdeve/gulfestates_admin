"use client";

import Image from "next/image";
import React, { useState } from "react";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import Link from "next/link";

export type Property = {
  id: string;
  title: string;
  title_es?: string;
  title_fr?: string;
  location: string;
  type: string;
  beds: number;
  monthlyRent: string;
  status: string;
  tenant: string;
  leaseStart: string;
  leaseEnd: string;
  rentDuration?: string;
};

interface RentTableProps {
  data: Property[];
  lang: "en" | "es" | "fr";
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

const RentTable: React.FC<RentTableProps> = ({
  data,
  lang,
  onDelete,
  onView,
  onEditLink,
  onEdit,
  onBulkDelete,
  selectedIds = EMPTY_IDS,
  onSelectionChange,
}) => {
  console.log({data});
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
  const isControlled =
    Array.isArray(selectedIds) && typeof onSelectionChange === "function";
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const selected = isControlled ? selectedIds : internalSelected;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = data.map((property) => property.id);
      if (!isControlled) {
        setInternalSelected(allIds);
      }
      onSelectionChange?.(allIds);
    } else {
      if (!isControlled) {
        setInternalSelected([]);
      }
      onSelectionChange?.([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      const newSelected = [...selected, id];
      if (!isControlled) {
        setInternalSelected(newSelected);
      }
      onSelectionChange?.(newSelected);
    } else {
      const newSelected = selected.filter((selectedId) => selectedId !== id);
      if (!isControlled) {
        setInternalSelected(newSelected);
      }
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
            {selected.length} propert{selected.length > 1 ? "ies" : "y"}{" "}
            selected
          </span>
          <button
            onClick={() => setBulkDeleteIds([...selected])}
            className="px-4 py-2 bg-[#01366F] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
          >
            Delete Selected ({selected.length})
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg bg-white shadow-md custom-scrollbar">
        <table className="min-w-full">
          <thead className="bg-primary">
            <tr>
              <th className="px-2 py-4 text-left text-sm font-medium text-white/90 w-12">
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

              {/* For FR/ES: show only locale title. For EN: show EN title */}
              {lang === "en" ? (
                <th className="px-2 py-4 text-left text-sm font-medium text-white/90">
                  Title (EN)
                </th>
              ) : (
                <th className="px-2 py-4 text-left text-sm font-medium text-white/90">
                  Title ({lang.toUpperCase()})
                </th>
              )}

              <th className="px-2 py-4 text-left text-sm font-medium text-white/90">
                Location
              </th>
              <th className="px-2 py-4 text-left text-sm font-medium text-white/90">
                Type
              </th>
              <th className="px-2 py-4 text-left text-sm font-medium text-white/90">
                Beds
              </th>
              <th className="px-2 py-4 text-left text-sm font-medium text-white/90">
                Rent
              </th>
              <th className="px-3 py-4 text-center text-sm font-medium text-white/90 min-w-[120px]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((property, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-2 py-4 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(property.id)}
                    onChange={(e) =>
                      handleSelectOne(property.id, e.target.checked)
                    }
                    className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                  />
                </td>

                {/* For EN: show title. For FR/ES: show locale-specific title only */}
                {lang === "en" ? (
                  <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-700">
                    {property.title}
                  </td>
                ) : (
                  <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-700">
                    {lang === "es" ? property.title_es : property.title_fr}
                  </td>
                )}

                <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-700">
                  {property.location}
                </td>
                <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-700">
                  {property.type}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                  {property.beds}
                </td>
                <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-700">
                  {property.monthlyRent}
                  {property?.rentDuration ? ` / ${property.rentDuration}` : ""}
                </td>

                <td className="whitespace-nowrap px-3 py-4 text-sm min-w-[120px]">
                  <div className="flex items-center justify-center gap-1 flex-shrink-0">
                    {onView && (
                      <button
                        onClick={() => onView(property.id)}
                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-200 rounded transition-colors border border-gray-200"
                        title="View"
                      >
                        <Image
                          src="/icons/eye.svg"
                          alt="View"
                          width={18}
                          height={18}
                          className="cursor-pointer"
                        />
                      </button>
                    )}
                    {onEditLink && (
                      <Link
                        href={onEditLink + `?id=${property.id}`}
                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-200 rounded transition-colors border border-gray-200"
                        title="Edit"
                      >
                        <Image
                          src="/icons/edit.svg"
                          alt="edit"
                          width={18}
                          height={18}
                          className="cursor-pointer"
                        />
                      </Link>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => setDeleteConfirmId(property.id)}
                        className="w-9 h-9 flex items-center justify-center hover:bg-red-100 rounded transition-colors border border-gray-200"
                        title="Delete"
                      >
                        <Image
                          src="/icons/delete.svg"
                          alt="delete"
                          width={18}
                          height={18}
                          className="cursor-pointer"
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
        title="Delete Property"
        message="Are you sure you want to delete this property? This will permanently remove it."
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
        title={`Delete ${bulkDeleteIds?.length || 0} Propert${(bulkDeleteIds?.length || 0) > 1 ? "ies" : "y"}`}
        message={`Are you sure you want to delete ${bulkDeleteIds?.length || 0} selected propert${(bulkDeleteIds?.length || 0) > 1 ? "ies" : "y"}? This will permanently remove them.`}
        onConfirm={() => {
          if (bulkDeleteIds) {
            onBulkDelete?.(bulkDeleteIds);
            if (!isControlled) {
              setInternalSelected([]);
            }
            onSelectionChange?.([]);
            setBulkDeleteIds(null);
          }
        }}
        onCancel={() => setBulkDeleteIds(null)}
      />
    </div>
  );
};

export default RentTable;
