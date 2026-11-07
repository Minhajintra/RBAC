"use client";

import React from "react";
import { Info, Loader2 } from "lucide-react";

interface ConfirmGlobalLogoutCardProps {
  onCancel: () => void;
  onConfirm: () => void;
  isLoggingOut: boolean;
}

/**
 * Confirm Global Logout Card Component (FG-UAM-16 Right Panel)
 */
export function ConfirmGlobalLogoutCard({
  onCancel,
  onConfirm,
  isLoggingOut,
}: ConfirmGlobalLogoutCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5ebe7] p-5 sm:p-6 shadow-xs flex flex-col justify-between h-fit">
      <div>
        <h3 className="text-base font-bold text-[#16382b]">
          Confirm global logout
        </h3>
        <p className="text-[11px] text-[#6b7c72] mt-0.5 mb-5">
          UX recommendation • static confirmation pattern
        </p>

        {/* Warning Callout Box */}
        <div className="bg-[#fff9ea] border border-[#fde4aa] rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-[#b45309] mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#92400e]">
                Sign out all users?
              </h4>
              <p className="text-xs text-[#b45309] mt-1 leading-relaxed">
                This action ends all active sessions. Users will need to sign in again.
              </p>
            </div>
          </div>
        </div>

        {/* Explanatory Note */}
        <p className="text-xs text-[#6b7c72] leading-relaxed my-5">
          Review the impact before continuing. Confirmation is a proposed safeguard,
          not an established backend rule.
        </p>
      </div>

      {/* Buttons */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoggingOut}
          className="w-full py-2.5 rounded-xl border border-[#d1ded6] bg-white text-xs sm:text-sm font-semibold text-[#16382b] hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoggingOut}
          className="w-full py-2.5 rounded-xl bg-[#a82323] hover:bg-[#8e1c1c] text-white text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Logging out all users...</span>
            </>
          ) : (
            <span>Logout All Users</span>
          )}
        </button>
      </div>
    </div>
  );
}

export default ConfirmGlobalLogoutCard;

