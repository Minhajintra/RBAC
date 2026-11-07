"use client";

import React from "react";

interface GlobalLogoutCardProps {
  onOpenConfirm: () => void;
  isLoggingOut?: boolean;
}

/**
 * Global Logout Trigger Card Component (FG-UAM-16)
 */
export function GlobalLogoutCard({
  onOpenConfirm,
  isLoggingOut = false,
}: GlobalLogoutCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5ebe7] p-5 sm:p-6 shadow-xs">
      <h3 className="text-base font-bold text-[#16382b]">Global logout</h3>
      <p className="text-xs text-[#6b7c72] mt-0.5 mb-5">
        Ends every active session across all users.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-xs text-[#6b7c72] max-w-sm">
          Use during a security event or planned maintenance.
        </p>

        <button
          type="button"
          onClick={onOpenConfirm}
          disabled={isLoggingOut}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#a82323] hover:bg-[#8e1c1c] text-white text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs disabled:opacity-60 whitespace-nowrap self-start sm:self-auto"
        >
          {isLoggingOut ? "Ending sessions..." : "Logout All Users"}
        </button>
      </div>
    </div>
  );
}

export default GlobalLogoutCard;

