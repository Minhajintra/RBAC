"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, PasswordInput, Alert } from "@/components/ui";
import { resetPasswordSchema } from "../schema/resetPasswordSchema";
import { authService } from "@/services/auth.service";

export default function ResetPasswordForm() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    const validation = resetPasswordSchema.safeParse({
      password,
      confirmPassword,
    });
    if (!validation.success) {
      setErrorMessage(
        validation.error.issues[0]?.message || "Invalid password provided.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.resetPassword({
        password,
        confirmPassword,
      });

      if (!response.success) {
        setErrorMessage(response.message || "Failed to update password.");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update password. Please check your connection.";
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-[28px] p-6 sm:p-8 lg:p-9 border border-[#dce6df] shadow-xs">
      <span className="block text-[10px] sm:text-[10.5px] font-bold tracking-wider uppercase text-[#16382b] mb-2 sm:mb-2.5">
        PASSWORD RECOVERY
      </span>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11261c] mb-1.5 tracking-tight">
        Create new password
      </h1>

      <p className="text-xs sm:text-sm text-[#55695e] mb-6 leading-relaxed">
        Choose a strong, memorable password for your IntraShip account.
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

      {isSuccess && (
        <Alert
          variant="success"
          message="Password successfully updated! Redirecting to login..."
          className="mb-4"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput
          label="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter at least 6 characters"
          disabled={isLoading || isSuccess}
        />

        <PasswordInput
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          disabled={isLoading || isSuccess}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || isSuccess}
            isLoading={isLoading}
            loadingText="Updating password..."
            className="w-full h-11 sm:h-12 text-sm shadow-sm"
          >
            Update password
          </Button>
        </div>

        <div className="pt-2 text-center text-xs">
          <Link
            href="/login"
            className="font-bold text-[#245b43] hover:underline"
          >
            Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}
