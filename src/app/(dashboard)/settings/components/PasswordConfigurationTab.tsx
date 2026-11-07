"use client";

import React from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { PasswordPolicyData } from "../types/security.types";

interface PasswordConfigurationTabProps {
  policy: PasswordPolicyData;
  onChange: (updated: Partial<PasswordPolicyData>) => void;
  onBackToSettings: () => void;
}

/**
 * Password Configuration Tab Component (FG-UAM-16)
 */
export function PasswordConfigurationTab({
  policy,
  onChange,
  onBackToSettings,
}: PasswordConfigurationTabProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5ebe7] p-5 sm:p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#f0f4f1]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1b4332]" />
            <h3 className="text-base font-bold text-[#16382b]">
              Password Policy Rules &amp; Constraints
            </h3>
          </div>
          <p className="text-xs text-[#6b7c72] mt-1">
            Configure system-wide character rules, expiration policies, and lockout thresholds.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToSettings}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#d1ded6] text-xs font-semibold text-[#16382b] hover:bg-gray-50 transition cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Security Settings</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Minimum password length */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#16382b]">
            Minimum Password Length
          </label>
          <input
            type="number"
            min={8}
            max={64}
            value={policy.minLength}
            onChange={(e) =>
              onChange({ minLength: Number(e.target.value) || 8 })
            }
            className="w-full h-11 px-3.5 bg-white border border-[#d1ded6] text-xs sm:text-sm text-[#16382b] rounded-xl focus:outline-none focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
          />
          <span className="text-[11px] text-[#6b7c72]">
            Minimum character requirement for all user passwords (recommended: 12).
          </span>
        </div>

        {/* Max password age */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#16382b]">
            Password Expiration (Days)
          </label>
          <input
            type="number"
            min={0}
            max={365}
            value={policy.maxAgeDays}
            onChange={(e) =>
              onChange({ maxAgeDays: Number(e.target.value) || 0 })
            }
            className="w-full h-11 px-3.5 bg-white border border-[#d1ded6] text-xs sm:text-sm text-[#16382b] rounded-xl focus:outline-none focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
          />
          <span className="text-[11px] text-[#6b7c72]">
            Days before users are prompted to change their password (0 to disable).
          </span>
        </div>

        {/* Account lockout attempts */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#16382b]">
            Max Failed Attempts Before Lockout
          </label>
          <input
            type="number"
            min={3}
            max={10}
            value={policy.lockoutAttempts}
            onChange={(e) =>
              onChange({ lockoutAttempts: Number(e.target.value) || 5 })
            }
            className="w-full h-11 px-3.5 bg-white border border-[#d1ded6] text-xs sm:text-sm text-[#16382b] rounded-xl focus:outline-none focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
          />
          <span className="text-[11px] text-[#6b7c72]">
            Consecutive failed sign-ins before account lockout is enforced.
          </span>
        </div>

        {/* History reuse limit */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#16382b]">
            Password History Reuse Limit
          </label>
          <input
            type="number"
            min={1}
            max={24}
            value={policy.historyLimit}
            onChange={(e) =>
              onChange({ historyLimit: Number(e.target.value) || 5 })
            }
            className="w-full h-11 px-3.5 bg-white border border-[#d1ded6] text-xs sm:text-sm text-[#16382b] rounded-xl focus:outline-none focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332]"
          />
          <span className="text-[11px] text-[#6b7c72]">
            Number of previous passwords that cannot be reused.
          </span>
        </div>
      </div>

      {/* Complexity Character Checkboxes */}
      <div className="pt-4 border-t border-[#f0f4f1] space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#16382b]">
          Required Character Types
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-[#e5ebe7] hover:bg-[#f8faf8] cursor-pointer">
            <input
              type="checkbox"
              checked={policy.requireUppercase}
              onChange={(e) =>
                onChange({ requireUppercase: e.target.checked })
              }
              className="w-4 h-4 rounded text-[#1b4332] focus:ring-[#1b4332] accent-[#1b4332]"
            />
            <span className="text-xs font-semibold text-[#16382b]">
              Require uppercase letters (A–Z)
            </span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-[#e5ebe7] hover:bg-[#f8faf8] cursor-pointer">
            <input
              type="checkbox"
              checked={policy.requireLowercase}
              onChange={(e) =>
                onChange({ requireLowercase: e.target.checked })
              }
              className="w-4 h-4 rounded text-[#1b4332] focus:ring-[#1b4332] accent-[#1b4332]"
            />
            <span className="text-xs font-semibold text-[#16382b]">
              Require lowercase letters (a–z)
            </span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-[#e5ebe7] hover:bg-[#f8faf8] cursor-pointer">
            <input
              type="checkbox"
              checked={policy.requireNumbers}
              onChange={(e) =>
                onChange({ requireNumbers: e.target.checked })
              }
              className="w-4 h-4 rounded text-[#1b4332] focus:ring-[#1b4332] accent-[#1b4332]"
            />
            <span className="text-xs font-semibold text-[#16382b]">
              Require numeric digits (0–9)
            </span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-[#e5ebe7] hover:bg-[#f8faf8] cursor-pointer">
            <input
              type="checkbox"
              checked={policy.requireSymbols}
              onChange={(e) =>
                onChange({ requireSymbols: e.target.checked })
              }
              className="w-4 h-4 rounded text-[#1b4332] focus:ring-[#1b4332] accent-[#1b4332]"
            />
            <span className="text-xs font-semibold text-[#16382b]">
              Require special characters (!@#$%^&amp;*)
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default PasswordConfigurationTab;

