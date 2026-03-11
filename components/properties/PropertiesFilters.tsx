"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
export interface FilterState {
  search: string;
  status: string;
  developer: string;
  location: string;
  for?: string; // Optional filter for buy/rent
  disabled?: boolean;
}
interface PropertiesFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}
function CustomDropdown({
  label,
  options,
  onSelect,
  value,
  disabled = false,
}: {
  label: string;
  options: string[];
  onSelect: (value: string) => void;
  value?: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(value || label);

  // Update selected when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setSelected(value);
    }
  }, [value]);

  const handleSelect = (option: string) => {
    setSelected(option);
    setIsOpen(false);
    onSelect(option);
  };

  return (
    <div className="relative">
      <button
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`${disabled ? "opacity-50 cursor-not-allowed" : ""} flex items-center justify-between w-[120px] border border-gray-400 rounded-[10px] px-2 py-1.5 text-sm bg-white hover:bg-gray-50 transition text-black/70`}
      >
        <span className="truncate">{selected}</span>
        <Image
          src="/icons/arrow-up.svg"
          alt="arrow"
          width={12}
          height={12}
          className={`invert transition-transform ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-[10px] shadow-md">
          {options.map((option) => (
            <div
              key={option}
              onClick={() => handleSelect(option)}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PropertiesFilters({
  onFilterChange,
  showForFilter = false, // New prop to show/hide the "for" filter
  forFilterOptions = ["All Types", "Buy", "Rent"], // Options for the "for" filter
}: PropertiesFiltersProps & {
  showForFilter?: boolean;
  forFilterOptions?: string[]; // Custom options for the "for" filter
}) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "All Status",
    developer: "All Developers",
    location: "All Locations",
    for: "All Types",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    onFilterChange(filters);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-black/70 bg-white shadow-md rounded-lg p-4">
      <div className="flex-1 min-w-[400px]">
        <input
          type="search"
          name="search"
          id="search"
          value={filters.search}
          onChange={handleInputChange}
          className="min-w-[400px] w-full px-6 rounded-[10px] border border-gray-400 py-1.5 sm:text-sm focus:outline-none bg-white/10"
          placeholder="Search by Title..."
        />
      </div>

      <CustomDropdown
        label="All Status"
        options={["All Status", "Active", "Sold", "Pending"]}
        onSelect={(value) => handleDropdownChange("status", value)}
        value={filters.status}
      />
      <CustomDropdown
        label="All Developers"
        options={["All Developers", "Emaar", "Nakheel", "DAMAC"]}
        onSelect={(value) => handleDropdownChange("developer", value)}
        value={filters.developer}
      />
      <CustomDropdown
        label="All Locations"
        options={["All Locations", "Dubai Marina", "Abu Dhabi", "Sharjah"]}
        onSelect={(value) => handleDropdownChange("location", value)}
        value={filters.location}
      />

      {showForFilter && (
        <CustomDropdown
          label={forFilterOptions[0] || "All Types"}
          options={forFilterOptions}
          onSelect={(value) => handleDropdownChange("for", value)}
          value={filters.for || forFilterOptions[0] || "All Types"}
        />
      )}

      <button
        onClick={handleApplyFilters}
        className="bg-secondary hover:bg-secondary/90 cursor-pointer text-sm text-white/90 px-3 py-1.5 rounded-[10px]"
      >
        Apply Filters
      </button>
    </div>
  );
}
