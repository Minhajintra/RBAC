"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { Button, Input, Alert } from "@/components/ui";
import { forgotPasswordData } from "../../constants/auth-content";
import { forgotPasswordSchema } from "../schema/forgotPasswordSchema";
import { authService } from "@/services/auth.service";

function StepProgressBar() {
  return (
    <div className="mb-5 xl:mb-6">
      <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-[#6b7c72] mb-2.5">
        <span>{forgotPasswordData.badge}</span>
        <span className="text-[#16382b]">Step 1 of 3</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="h-1.5 rounded-full bg-[#225740]"></div>
        <div className="h-1.5 rounded-full bg-[#dbe5dd]"></div>
        <div className="h-1.5 rounded-full bg-[#dbe5dd]"></div>
      </div>
    </div>
  );
}

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setErrorMessage(
        validation.error.issues[0]?.message ||
          forgotPasswordData.validation.invalidFormat,
      );
      return;
    }

    setIsLoading(true);

    try {
      await authService.forgotPassword({ email });
      setTimeout(() => {
        router.push("/verify-otp?from=reset");
      }, 600);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Password recovery request failed. Please try again.";
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] lg:max-w-none mx-auto bg-white rounded-3xl p-6 sm:p-8 xl:p-9 border border-[#e5ece7] shadow-sm">
      <StepProgressBar />

      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11261c] tracking-tight mb-2">
        {forgotPasswordData.title}
      </h1>

      <p className="text-xs sm:text-sm text-[#6b7c72] leading-relaxed mb-6">
        {forgotPasswordData.subtitle}
      </p>

      {errorMessage && (
        <Alert
          variant="error"
          title={
            errorMessage.toLowerCase().includes("internal server error") ||
            errorMessage.toLowerCase().includes("500")
              ? "500 Internal Server Error"
              : undefined
          }
          message={
            errorMessage
              .replace(/^500\s*:?\s*/i, "")
              .replace(/^internal server error\s*:?\s*/i, "")
          }
          className="mb-4 text-left"
        />
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          id="email"
          label={forgotPasswordData.emailLabel}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errorMessage) setErrorMessage("");
          }}
          placeholder={forgotPasswordData.emailPlaceholder}
          disabled={isLoading}
          autoComplete="email"
          leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
        />

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          isLoading={isLoading}
          loadingText={forgotPasswordData.loadingButton}
          className="w-full h-11 sm:h-12 shadow-md"
        >
          {forgotPasswordData.submitButton}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#225740] hover:text-[#16382b] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{forgotPasswordData.backToLogin}</span>
        </Link>
      </div>
    </div>
  );
}
