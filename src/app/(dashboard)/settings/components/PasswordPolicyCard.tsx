"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

interface PasswordPolicyCardProps {
  complexityEnabled: boolean;
  onComplexityToggle: () => void;
  configuredPolicyText: string;
  onOpenPasswordConfig: () => void;
}

/**
 * Password Policy Card Component (FG-UAM-16)
 */
export function PasswordPolicyCard({
  complexityEnabled,
  onComplexityToggle,
  configuredPolicyText,
  onOpenPasswordConfig,
}: PasswordPolicyCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5ebe7] p-5 sm:p-6 shadow-xs">
      <h3 className="text-base font-bold text-[#16382b]">Password policy</h3>
      <p className="text-xs text-[#6b7c72] mt-0.5 mb-5">
        Apply the configured policy when passwords are set or reset.
      </p>

      {/* Complexity Toggle Row */}
      <div className="flex items-center justify-between pb-5 border-b border-[#f0f4f1]">
        <div>
          <div className="text-sm font-bold text-[#16382b]">
            Password complexity
          </div>
          <p className="text-xs text-[#6b7c72] mt-0.5">
            Illustrative control state; load the deployment setting.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            role="switch"
            aria-checked={complexityEnabled}
            onClick={onComplexityToggle}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              complexityEnabled ? "bg-[#1b4332]" : "bg-gray-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                complexityEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-xs font-semibold text-[#6b7c72] select-none w-7">
            {complexityEnabled ? "On" : "Off"}
          </span>
        </div>
      </div>

      {/* Configured Policy Summary & Configuration Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5">
        <span className="text-xs text-[#6b7c72]">
          [{configuredPolicyText}]
        </span>

        <button
          type="button"
          onClick={onOpenPasswordConfig}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-[#d1ded6] bg-white text-xs font-semibold text-[#16382b] hover:bg-gray-50 transition cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <span>Password Configuration</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default PasswordPolicyCard;

