"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";

export type Property = {
  id: string;
  title: string;
  title_es?: string;
  title_fr?: string;
  developer: string;
  location: string;
  type: string;
  beds: number;
  price: string;
  status: string;
  addedOn: string;
};

interface BuyPropertyTableProps {
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

const BuyPropertyTable: React.FC<BuyPropertyTableProps> = ({
  data,
  lang,
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
      const allIds = data.map((property) => property.id);
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
            {selected.length} property{selected.length > 1 ? "ies" : ""}{" "}
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
              <th className="px-3 py-4 text-left text-sm font-medium text-white/90 w-12">
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
                <th className="px-3 py-4 text-left text-sm font-medium text-white/90">
                  Title (EN)
                </th>
              ) : (
                <th className="px-3 py-4 text-left text-sm font-medium text-white/90">
                  Title ({lang.toUpperCase()})
                </th>
              )}

              <th className="px-3 py-4 text-left text-sm font-medium text-white/90">
                Developer
              </th>
              <th className="px-3 py-4 text-left text-sm font-medium text-white/90">
                Location
              </th>
              <th className="px-3 py-4 text-left text-sm font-medium text-white/90">
                Type
              </th>
              <th className="px-3 py-4 text-left text-sm font-medium text-white/90">
                Beds
              </th>
              <th className="px-3 py-4 text-left text-sm font-medium text-white/90">
                Price
              </th>
              <th className="px-3 py-4 text-left text-sm font-medium text-white/90">
                Status
              </th>
              <th className="px-3 py-4 text-left text-sm font-medium text-white/90">
                Added On
              </th>
              <th className="px-3 py-4 text-center text-sm font-medium text-white/90">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((property, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-3 py-4 text-sm">
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
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
                    {property.title}
                  </td>
                ) : (
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
                    {lang === "es" ? (property.title_es || "-") : (property.title_fr || "-")}
                  </td>
                )}
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
                  {property.developer}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
                  {property.location}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
                  {property.type}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                  {property.beds}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
                  {property.price}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span className="inline-flex rounded-lg bg-[#D9D9D9] px-3 py-1 text-xs leading-5">
                    {property.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                  {property.addedOn}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    {onView && (
                      <button
                        onClick={() => onView(property.id)}
                        className="flex items-center justify-center w-8 h-8 hover:bg-gray-200 rounded transition-colors"
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
                        href={onEditLink + `?id=${property.id}`}
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
                        href={`/${lang}/properties/edit?id=${property.id}`}
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
                        onClick={() => setDeleteConfirmId(property.id)}
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

export default BuyPropertyTable;
