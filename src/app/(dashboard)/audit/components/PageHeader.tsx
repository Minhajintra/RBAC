"use client";

import React from "react";
import { Download, Loader2 } from "lucide-react";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  isExporting?: boolean;
  onExport?: () => void;
}

/**
 * Audit Logs Page Header
 * Displays title, subtitle, and CSV export button
 */
export function PageHeader({
  title = "Audit Logs",
  subtitle = "A traceable history of account activity and workspace access changes.",
  isExporting = false,
  onExport,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-[28px] font-bold text-[#16382b] tracking-tight leading-tight">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-[#6b7c72] mt-1">
          {subtitle}
        </p>
      </div>

      {onExport && (
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143225] text-white text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-60"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export logs</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default PageHeader;

