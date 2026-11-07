import React from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight } from "lucide-react";

export interface PaginationProps {
  currentPage?: number;
  page?: number;
  totalPages: number;
  totalRecords?: number;
  total?: number;
  pageSize?: number;
  recordLabel?: string;
  showTextButtons?: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  page,
  totalPages,
  totalRecords,
  total,
  pageSize,
  recordLabel = "records",
  showTextButtons = false,
  onPageChange,
  className = "",
}: PaginationProps) {
  const activePage = currentPage ?? page ?? 1;
  const count = totalRecords ?? total;
  const showRecordCount = count !== undefined && pageSize !== undefined;

  const startItem = showRecordCount
    ? count === 0
      ? 0
      : (activePage - 1) * pageSize + 1
    : 0;
  const endItem = showRecordCount ? Math.min(activePage * pageSize, count) : 0;

  // Max 5 buttons visible around active page
  const maxButtons = 5;
  const endPage = Math.min(
    totalPages,
    Math.max(1, activePage - Math.floor(maxButtons / 2)) + maxButtons - 1,
  );
  const startPage = Math.max(1, endPage - maxButtons + 1);

  const pageNumbers: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#eef3ef] text-xs text-[#6b7c72] select-none ${className}`}
    >
      {showRecordCount && (
        <div>
          Showing <b className="text-[#16382b]">{startItem}</b> to{" "}
          <b className="text-[#16382b]">{endItem}</b> of{" "}
          <b className="text-[#16382b]">{count}</b> {recordLabel}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={activePage <= 1}
          onClick={() => onPageChange(activePage - 1)}
          aria-label="Previous page"
          className={
            showTextButtons
              ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#dbe5dd] bg-white text-xs font-semibold text-[#16382b] hover:bg-[#f4f7f4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              : "p-1.5 rounded-lg border border-[#dbe5dd] bg-white hover:bg-[#f4f7f4] text-[#16382b] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          }
        >
          {showTextButtons ? (
            <>
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </>
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              pageNumber === activePage
                ? "bg-[#225740] text-white shadow-xs"
                : "border border-[#dbe5dd] bg-white hover:bg-[#f4f7f4] text-[#16382b]"
            }`}
          >
            {pageNumber}
          </button>
        ))}

        <button
          type="button"
          disabled={activePage >= totalPages}
          onClick={() => onPageChange(activePage + 1)}
          aria-label="Next page"
          className={
            showTextButtons
              ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#dbe5dd] bg-white text-xs font-semibold text-[#16382b] hover:bg-[#f4f7f4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              : "p-1.5 rounded-lg border border-[#dbe5dd] bg-white hover:bg-[#f4f7f4] text-[#16382b] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          }
        >
          {showTextButtons ? (
            <>
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
