"use client";

import React from "react";
import Logo from "@/components/layout/Logo";
import PageHeader from "./components/PageHeader";
import ResetPasswordForm from "./components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f5f8f5] font-sans flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-12 overflow-x-hidden">
      <main className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left Side: Reset Password Form Card */}
        <div className="flex flex-col">
          <div className="mb-5 sm:mb-6">
            <Logo href="/login" />
          </div>

          <ResetPasswordForm />
        </div>

        {/* Right Side: Password Security Guidelines */}
        <div className="w-full bg-[#e6f0e8] rounded-[28px] p-6 sm:p-8 lg:p-9 shadow-xs flex flex-col justify-between min-h-[460px]">
          <div>
            <PageHeader />

            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-white/80">
                <h4 className="text-xs font-bold text-[#16382b] mb-1">
                  Minimum 6 characters
                </h4>
                <p className="text-[11px] text-[#55695e]">
                  Longer passwords provide stronger protection against
                  brute-force attempts.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-white/80">
                <h4 className="text-xs font-bold text-[#16382b] mb-1">
                  Do not reuse old passwords
                </h4>
                <p className="text-[11px] text-[#55695e]">
                  Avoid using passwords previously associated with other email
                  accounts.
                </p>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-bold tracking-wider text-[#4a6355] uppercase mt-8 pt-4">
            INTRASHIP &bull; SECURE BY DESIGN
          </div>
        </div>
      </main>
    </div>
  );
}
