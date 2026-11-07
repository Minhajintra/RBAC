"use client";

import React from "react";
import { Search, ArrowLeft, ArrowRight } from "lucide-react";
import { AuditEvent } from "../types/audit.types";

interface AuditLogsTableProps {
  events: AuditEvent[];
  isLoading: boolean;
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  displayTotalRecords?: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
}

/**
 * Audit Logs Table Component (FG-UAM-15)
 * Displays actor, action, resource, timestamp, and status badges with pagination
 */
export function AuditLogsTable({
  events,
  isLoading,
  currentPage,
  pageSize,
  totalRecords,
  displayTotalRecords,
  totalPages,
  onPageChange,
  onClearFilters,
}: AuditLogsTableProps) {
  const validCurrentPage = Math.min(currentPage, totalPages);
  const totalCountToDisplay = displayTotalRecords !== undefined ? displayTotalRecords : totalRecords;

  const startRecord = totalRecords === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(validCurrentPage * pageSize, totalRecords);

  return (
    <div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[#edf3ef] text-[#4d5e54] text-[11px] font-bold tracking-wider uppercase">
              <th className="py-3 px-4 rounded-l-xl">ACTOR</th>
              <th className="py-3 px-4">ACTION</th>
              <th className="py-3 px-4">RESOURCE</th>
              <th className="py-3 px-4">TIME</th>
              <th className="py-3 px-4 rounded-r-xl">RESULT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4f1]">
            {/* Loading Skeleton */}
            {isLoading &&
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200" />
                      <div className="space-y-1">
                        <div className="w-24 h-3 bg-gray-200 rounded" />
                        <div className="w-32 h-2 bg-gray-100 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="w-20 h-3 bg-gray-200 rounded" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="w-24 h-3 bg-gray-200 rounded" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="w-16 h-3 bg-gray-100 rounded" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="w-14 h-5 bg-gray-200 rounded-full" />
                  </td>
                </tr>
              ))}

            {/* Data Rows matching FG-UAM-15 */}
            {!isLoading &&
              events.map((evt) => (
                <tr
                  key={evt.id}
                  className="hover:bg-[#f8faf8] transition-colors"
                >
                  {/* Actor */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#e0ece3] text-[#1b4332] font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {evt.actor.initials}
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-[#16382b]">
                          {evt.actor.name}
                        </div>
                        <div className="text-[11px] text-[#6b7c72]">
                          {evt.actor.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-xs sm:text-sm font-medium text-[#16382b]">
                    {evt.action}
                  </td>

                  {/* Resource */}
                  <td className="py-3.5 px-4">
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#16382b]">
                        {evt.resource.primary}
                      </div>
                      <div className="text-[11px] text-[#6b7c72]">
                        {evt.resource.category}
                      </div>
                    </div>
                  </td>

                  {/* Time */}
                  <td className="py-3.5 px-4 text-xs text-[#6b7c72] whitespace-nowrap">
                    {evt.time || evt.timestamp}
                  </td>

                  {/* Result Badge */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold ${
                        evt.result === "Success"
                          ? "bg-[#eaf5ed] text-[#225740]"
                          : "bg-[#fee2e2] text-[#b91c1c]"
                      }`}
                    >
                      {evt.result}
                    </span>
                  </td>
                </tr>
              ))}

            {/* Empty State */}
            {!isLoading && events.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <div className="max-w-xs mx-auto space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#f0f4f1] text-[#225740] flex items-center justify-center mx-auto">
                      <Search className="w-5 h-5 text-[#6b7c72]" />
                    </div>
                    <p className="text-sm font-bold text-[#16382b]">
                      No audit events found
                    </p>
                    <p className="text-xs text-[#6b7c72]">
                      No audit logs matched your active search or filter criteria.
                    </p>
                    <button
                      type="button"
                      onClick={onClearFilters}
                      className="mt-2 px-3 py-1.5 rounded-lg border border-[#d1ded6] text-xs font-semibold text-[#1b4332] hover:bg-[#f0f4f1] cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer matching FG-UAM-15 */}
      <div className="mt-4 pt-4 border-t border-[#f0f4f1] flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-[#6b7c72]">
          Showing {startRecord}–{endRecord} of {totalCountToDisplay.toLocaleString()} events
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={validCurrentPage <= 1}
            onClick={() => onPageChange(Math.max(1, validCurrentPage - 1))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#d1ded6] bg-white text-xs font-semibold text-[#16382b] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => {
            const pNum = idx + 1;
            return (
              <button
                key={`page-${pNum}`}
                type="button"
                onClick={() => onPageChange(pNum)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                  pNum === validCurrentPage
                    ? "bg-[#edf3ef] text-[#16382b] font-bold border border-[#d1ded6]"
                    : "text-[#6b7c72] hover:bg-[#f0f4f1]"
                }`}
              >
                {pNum}
              </button>
            );
          })}

          <button
            type="button"
            disabled={validCurrentPage >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, validCurrentPage + 1))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#d1ded6] bg-white text-xs font-semibold text-[#16382b] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuditLogsTable;
