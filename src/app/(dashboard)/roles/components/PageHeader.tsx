"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  isSaving?: boolean;
  onSave?: () => void;
}

/**
 * Roles Page Header
 * Displays the role configuration title, subtitle, and primary Save button
 */
export function PageHeader({
  title = "Create / Edit Role",
  subtitle = "Choose reachable screens, CRUD rights and Special permissions independently.",
  isSaving = false,
  onSave,
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

      {onSave && (
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143225] text-white text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            "Save Role"
          )}
        </button>
      )}
    </div>
  );
}

export default PageHeader;

