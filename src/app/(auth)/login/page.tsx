"use client";

import React from "react";
import Logo from "@/components/layout/Logo";
import { brandingData } from "../constants/auth-content";
import PageHeader from "./components/PageHeader";
import LoginForm from "./components/LoginForm";

/**
 * Login Page Orchestrator
 * Composes the PageHeader, IntraShip branding column, and interactive LoginForm
 */
export default function LoginPage() {
  return (
    <div className="relative h-screen max-h-screen w-full flex flex-col justify-between font-sans selection:bg-[#225740] selection:text-white overflow-hidden py-3 px-4 sm:px-8 lg:px-12 xl:px-14">
      {/* Background image overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0"
        style={{
          backgroundImage: "url('/images/login-bg.webp')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#d9e6dc]/85 via-[#e8f1eb]/55 to-white/10 backdrop-blur-[0.5px]"></div>
      </div>

      {/* Top Header */}
      <PageHeader />

      {/* Main 2-column layout */}
      <main className="relative z-10 w-full max-w-7xl mx-auto flex-1 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-6 xl:gap-14 my-auto min-h-0 py-2">
        {/* Left branding column */}
        <div className="hidden lg:flex flex-col max-w-[440px] xl:max-w-[480px] shrink-0">
          <div className="mb-3 xl:mb-4">
            <Logo href="/login" />
          </div>

          <h1 className="text-3xl xl:text-4xl 2xl:text-[40px] font-black text-[#11261c] leading-[1.15] tracking-tight mb-2 drop-shadow-xs">
            {brandingData.headline}
          </h1>

          <p className="text-xs xl:text-sm text-[#465b50] leading-relaxed mb-4 xl:mb-5 font-normal">
            {brandingData.subheadline}
          </p>

          {/* 3 Step List */}
          <div className="space-y-2 xl:space-y-2.5">
            {brandingData.steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-3 p-2.5 xl:p-3 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 shadow-xs"
              >
                <span className="w-6 h-6 rounded-full bg-[#1b4332] text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 shadow-2xs">
                  {step.id}
                </span>
                <span className="text-xs xl:text-sm font-semibold text-[#16382b]">
                  {step.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side login card */}
        <div className="w-full max-w-[390px] sm:max-w-[430px] lg:max-w-[420px] xl:max-w-[440px] shrink-0">
          <div className="lg:hidden flex justify-center mb-3">
            <Logo href="/login" />
          </div>

          <React.Suspense fallback={<div className="h-96" />}>
            <LoginForm />
          </React.Suspense>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-between text-[10.5px] sm:text-xs text-[#6b7c72] pt-1 flex-shrink-0">
        <p>{brandingData.copyright}</p>
        <div className="flex items-center gap-4">
          <span className="hover:text-[#16382b] cursor-pointer">Security</span>
          <span className="hover:text-[#16382b] cursor-pointer">Privacy</span>
          <span className="hover:text-[#16382b] cursor-pointer">Contact</span>
        </div>
      </footer>
    </div>
  );
}
