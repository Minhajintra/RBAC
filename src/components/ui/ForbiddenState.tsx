"use client";

import React from "react";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ForbiddenStateProps {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export function ForbiddenState({
  title = "403 - Access Forbidden",
  description = "You do not have the required permissions to access this feature or resource.",
  backHref = "/dashboard",
  backLabel = "Return to Dashboard",
}: ForbiddenStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] p-6 text-center bg-white rounded-2xl border border-[#e5ebe7] shadow-xs max-w-lg mx-auto my-12">
      <div className="w-14 h-14 rounded-2xl bg-[#fee2e2] text-[#991b1b] flex items-center justify-center mb-4">
        <ShieldAlert className="w-7 h-7" />
      </div>

      <h2 className="text-xl font-bold text-[#16382b] tracking-tight mb-2">
        {title}
      </h2>

      <p className="text-sm text-[#6b7c72] max-w-md leading-relaxed mb-6">
        {description}
      </p>

      <Link
        href={backHref}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143225] text-white text-xs sm:text-sm font-semibold transition shadow-xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{backLabel}</span>
      </Link>
    </div>
  );
}

export default ForbiddenState;

