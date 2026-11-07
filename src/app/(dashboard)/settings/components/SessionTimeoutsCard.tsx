"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

interface SessionTimeoutsCardProps {
  webTimeout: string;
  onWebTimeoutChange: (val: string) => void;
  webOptions: string[];
  mobileTimeout: string;
  onMobileTimeoutChange: (val: string) => void;
  mobileOptions: string[];
}

/**
 * Session Timeouts Card Component (FG-UAM-16)
 */
export function SessionTimeoutsCard({
  webTimeout,
  onWebTimeoutChange,
  webOptions,
  mobileTimeout,
  onMobileTimeoutChange,
  mobileOptions,
}: SessionTimeoutsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5ebe7] p-5 sm:p-6 shadow-xs">
      <h3 className="text-base font-bold text-[#16382b]">Session timeouts</h3>
      <p className="text-xs text-[#6b7c72] mt-0.5 mb-5">
        Automatically sign out inactive sessions.
      </p>

      <div className="space-y-4">
        {/* Web session timeout */}
        <div>
          <label className="block text-xs font-bold text-[#16382b] mb-1.5">
            Web session timeout
          </label>
          <div className="relative">
            <select
              value={webTimeout}
              onChange={(e) => onWebTimeoutChange(e.target.value)}
              className="w-full h-11 pl-4 pr-10 bg-white border border-[#d1ded6] text-xs sm:text-sm text-[#16382b] rounded-xl appearance-none focus:outline-none focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] cursor-pointer transition-colors"
            >
              {webOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Mobile session timeout */}
        <div>
          <label className="block text-xs font-bold text-[#16382b] mb-1.5">
            Mobile session timeout
          </label>
          <div className="relative">
            <select
              value={mobileTimeout}
              onChange={(e) => onMobileTimeoutChange(e.target.value)}
              className="w-full h-11 pl-4 pr-10 bg-white border border-[#d1ded6] text-xs sm:text-sm text-[#16382b] rounded-xl appearance-none focus:outline-none focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] cursor-pointer transition-colors"
            >
              {mobileOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="text-[11px] text-[#6b7c72] mt-5">
        Values, ranges and units are deployment configuration.
      </div>
    </div>
  );
}

export default SessionTimeoutsCard;

