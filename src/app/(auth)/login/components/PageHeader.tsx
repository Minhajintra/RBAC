"use client";

import React from "react";
import { brandingData } from "../../constants/auth-content";

/**
 * Login Page Header Component
 * Displays the IntraShip portal tag and help/support button
 */
export function PageHeader() {
  return (
    <header className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-between gap-2 flex-shrink-0">
      <div className="px-3.5 sm:px-5 py-1.5 rounded-2xl bg-white/85 backdrop-blur-md border border-white/90 text-[10.5px] sm:text-xs font-semibold text-[#1e4d3a] shadow-xs truncate max-w-[210px] sm:max-w-none">
        {brandingData.portalTag}
      </div>

      <button
        type="button"
        onClick={() =>
          alert(
            "IntraShip Support: Please reach out to your administrator for access assistance.",
          )
        }
        className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-white/90 hover:bg-white text-[10.5px] sm:text-xs font-semibold text-[#16382b] shadow-xs border border-white/90 transition-all cursor-pointer flex-shrink-0"
      >
        <span className="text-[#225740] font-bold">?</span>
        <span>{brandingData.helpSupportText}</span>
      </button>
    </header>
  );
}

export default PageHeader;

