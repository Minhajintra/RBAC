"use client";

import React from "react";
import { Search, ChevronDown } from "lucide-react";

interface AuditFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  actionFilter: string;
  onActionFilterChange: (value: string) => void;
  actionOptions: string[];
  resultFilter: string;
  onResultFilterChange: (value: string) => void;
  dateRangeFilter: string;
  onDateRangeFilterChange: (value: string) => void;
  dateRangeOptions: string[];
}

/**
 * Audit Filters Component (FG-UAM-15)
 * Search input, All actions, All results, and Date range dropdowns
 */
export function AuditFilters({
  search,
  onSearchChange,
  actionFilter,
  onActionFilterChange,
  actionOptions,
  resultFilter,
  onResultFilterChange,
  dateRangeFilter,
  onDateRangeFilterChange,
  dateRangeOptions,
}: AuditFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Event history title & live update indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#16382b]">
            Login history
          </h2>
          <p className="text-xs text-[#6b7c72] mt-0.5">
            Workspace activity, newest first
          </p>
        </div>

        <span className="text-xs text-[#6b7c72]">Updated just now</span>
      </div>

      {/* Filter controls row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search actor, action or resource..."
            className="w-full h-10 pl-10 pr-3.5 bg-white border border-[#d1ded6] text-xs sm:text-sm rounded-xl text-[#16382b] placeholder:text-gray-400 focus:outline-none focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] transition-colors"
          />
        </div>

        {/* Dropdown Filters matching FG-UAM-15 */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Action dropdown */}
          <div className="relative">
            <select
              value={actionFilter}
              onChange={(e) => onActionFilterChange(e.target.value)}
              className="h-10 pl-3.5 pr-8 bg-white border border-[#d1ded6] text-xs sm:text-sm font-medium rounded-xl text-[#16382b] appearance-none focus:outline-none focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] cursor-pointer transition-colors"
            >
              {actionOptions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Result dropdown */}
          <div className="relative">
            <select
              value={resultFilter}
              onChange={(e) => onResultFilterChange(e.target.value)}
              className="h-10 pl-3.5 pr-8 bg-white border border-[#d1ded6] text-xs sm:text-sm font-medium rounded-xl text-[#16382b] appearance-none focus:outline-none focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] cursor-pointer transition-colors"
            >
              <option value="All results">All results</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Date range dropdown */}
          <div className="relative">
            <select
              value={dateRangeFilter}
              onChange={(e) => onDateRangeFilterChange(e.target.value)}
              className="h-10 pl-3.5 pr-8 bg-white border border-[#d1ded6] text-xs sm:text-sm font-medium rounded-xl text-[#16382b] appearance-none focus:outline-none focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] cursor-pointer transition-colors"
            >
              {dateRangeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuditFilters;
