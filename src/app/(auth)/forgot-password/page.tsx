"use client";

import React from "react";
import { Info } from "lucide-react";
import { forgotPasswordData } from "../constants/auth-content";
import PageHeader from "./components/PageHeader";
import ForgotPasswordForm from "./components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  const sidePanel = forgotPasswordData.sidePanel;

  return (
    <div className="min-h-screen bg-[#f3f7f4] font-sans flex flex-col justify-between p-4 sm:p-6 lg:px-12 lg:py-6 overflow-x-hidden">
      {/* Top Header Logo */}
      <PageHeader />

      {/* Main 2-column layout */}
      <main className="w-full max-w-6xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-10 items-center my-auto">
        {/* Left Side: Recovery form */}
        <ForgotPasswordForm />

        {/* Right Side: Security guide panel */}
        <div className="w-full max-w-[480px] lg:max-w-none mx-auto bg-[#e6efe8] rounded-3xl p-6 sm:p-8 xl:p-9 border border-[#c7ded0]">
          <div className="flex items-center gap-2.5 text-[#1e4d3a] mb-3">
            <Info className="w-5 h-5 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-bold">
              {sidePanel.title}
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#465b50] leading-relaxed mb-6">
            {sidePanel.subtitle}
          </p>

          {/* Steps list */}
          <div className="space-y-3.5">
            {sidePanel.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/70 border border-white/80"
              >
                <span className="w-6 h-6 rounded-full bg-[#225740] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {item.id}
                </span>
                <span className="text-xs font-semibold text-[#16382b]">
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-[#c7ded0] text-[11px] text-[#556b5e] uppercase tracking-wider font-bold">
            {sidePanel.footer}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto text-center text-[11px] text-[#6b7c72] py-3 flex-shrink-0">
        &copy; 2026 IntraShip. All rights reserved.
      </footer>
    </div>
  );
}
