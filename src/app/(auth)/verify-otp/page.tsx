import React, { Suspense } from "react";
import type { Metadata } from "next";
import VerifyOtpContent from "./components/VerifyOtpContent";

export const metadata: Metadata = {
  title: "Verify Identity — IntraShip UAM",
  description: "Enter your 6-digit verification code to access your workspace.",
};

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f5f8f5]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#245b43]" />
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
