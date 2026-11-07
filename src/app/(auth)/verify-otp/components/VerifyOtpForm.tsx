"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Alert } from "@/components/ui";
import { otpSchema } from "../schema/verifyOtpSchema";
import { authService } from "@/services/auth.service";
import { authStorage } from "@/lib/auth-storage";
import { useAuth } from "@/context/auth-context";

function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

interface CountdownTimerBadgeProps {
  seconds: number;
}

function CountdownTimerBadge({ seconds }: CountdownTimerBadgeProps) {
  return (
    <span className="text-[11px] font-semibold text-[#245b43] bg-[#e6f0e8] px-2.5 py-0.5 rounded-full flex items-center gap-1">
      <span>⏱</span>
      <span>{formatSeconds(seconds)}</span>
    </span>
  );
}

const COUNTDOWN_INITIAL_SECONDS = 60;

export default function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthSession } = useAuth();
  const flow = searchParams.get("from") || searchParams.get("flow") || "login";

  const [otpDigits, setOtpDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resendNotification, setResendNotification] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [countdownSeconds, setCountdownSeconds] = useState(
    COUNTDOWN_INITIAL_SECONDS,
  );

  useEffect(() => {
    if (countdownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdownSeconds]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleVerifySubmission = async (code: string) => {
    if (isLoading) return;
    setErrorMessage("");

    const validation = otpSchema.safeParse({ otp: code });
    if (!validation.success) {
      setErrorMessage(
        validation.error.issues[0]?.message || "Please enter all 6 digits.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.verifyOtp({
        otp: code,
        flow: flow === "reset" ? "reset" : "login",
      });

      // Agar backend server band ho ya session redirect signal mila
      const rawResp = response as unknown as { serverOffline?: boolean; redirectToLogin?: boolean };
      if (rawResp.serverOffline || rawResp.redirectToLogin) {
        authStorage.clear();
        router.push("/login?error=server_offline");
        return;
      }

      // Jab tak backend chal raha hai -> verify hone par redirect hojay
      if (response.success) {
        if (response.user) {
          setAuthSession(response.user, response.accessToken);
        }
        if (flow === "reset") {
          router.push("/reset-password");
        } else {
          router.push("/dashboard");
        }
      } else {
        setErrorMessage(response.message || "Invalid verification code.");
        setIsLoading(false);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Verification error. Please try again.";

      const isServerOffline =
        message.toLowerCase().includes("unavailable") ||
        message.toLowerCase().includes("offline") ||
        message.toLowerCase().includes("500") ||
        message.toLowerCase().includes("503") ||
        message.toLowerCase().includes("failed to communicate") ||
        message.toLowerCase().includes("econnrefused") ||
        message.toLowerCase().includes("network error") ||
        message.toLowerCase().includes("timeout");

      // Jasay hi server band ho wasay hi login page per ajay
      if (isServerOffline) {
        authStorage.clear();
        try {
          await authService.logout();
        } catch {
          // ignore
        }
        router.push("/login?error=server_offline");
        return;
      }

      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    // Handle multi-digit paste into a single box
    if (value.length > 1) {
      const parsedDigits = value.replace(/\D/g, "").slice(0, 6).split("");
      const updatedDigits = [...otpDigits];
      parsedDigits.forEach((digit, offset) => {
        if (index + offset < 6) {
          updatedDigits[index + offset] = digit;
        }
      });
      setOtpDigits(updatedDigits);

      const nextFocusIndex = Math.min(index + parsedDigits.length, 5);
      inputRefs.current[nextFocusIndex]?.focus();

      if (updatedDigits.every((d) => d.length === 1)) {
        handleVerifySubmission(updatedDigits.join(""));
      }
      return;
    }

    const updatedDigits = [...otpDigits];
    updatedDigits[index] = value;
    setOtpDigits(updatedDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (value && index === 5) {
      const fullCode = updatedDigits.join("");
      if (fullCode.length === 6 && /^\d{6}$/.test(fullCode)) {
        handleVerifySubmission(fullCode);
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pastedText) return;

    const parts = pastedText.split("");
    const updatedDigits = [...otpDigits];
    parts.forEach((digit, idx) => {
      if (idx < 6) updatedDigits[idx] = digit;
    });
    setOtpDigits(updatedDigits);

    const targetFocus = Math.min(parts.length, 5);
    inputRefs.current[targetFocus]?.focus();

    if (parts.length === 6) {
      handleVerifySubmission(pastedText);
    }
  };

  const handleResendOtp = async () => {
    setErrorMessage("");
    setResendNotification("");
    setIsResending(true);
    try {
      await authService.sendOtp({
        reason: flow === "reset" ? "reset" : "login",
      });
      setCountdownSeconds(COUNTDOWN_INITIAL_SECONDS);
      setOtpDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setResendNotification(
        "A new 6-digit verification code has been dispatched.",
      );
      setTimeout(() => setResendNotification(""), 4500);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to resend code. Please check connection.";

      const isServerOffline =
        message.toLowerCase().includes("unavailable") ||
        message.toLowerCase().includes("offline") ||
        message.toLowerCase().includes("500") ||
        message.toLowerCase().includes("503") ||
        message.toLowerCase().includes("failed to communicate") ||
        message.toLowerCase().includes("econnrefused") ||
        message.toLowerCase().includes("network error");

      if (isServerOffline) {
        authStorage.clear();
        router.push("/login?error=server_offline");
        return;
      }

      setErrorMessage(message);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleVerifySubmission(otpDigits.join(""));
  };

  return (
    <div className="w-full bg-white rounded-[28px] p-6 sm:p-8 lg:p-9 border border-[#dce6df] shadow-xs">
      <span className="block text-[10px] sm:text-[10.5px] font-bold tracking-wider uppercase text-[#16382b] mb-2 sm:mb-2.5">
        MULTI-FACTOR AUTHENTICATION
      </span>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11261c] mb-1.5 tracking-tight">
        Verify your identity
      </h1>

      <p className="text-xs sm:text-sm text-[#55695e] mb-6 leading-relaxed">
        Enter the 6-digit verification code sent to your registered email
        address.
      </p>

      {/* Resend notification */}
      {resendNotification && (
        <Alert
          variant="success"
          message={resendNotification}
          className="mb-4"
        />
      )}

      {/* Error message banner */}
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
          className="mb-4 animate-shake text-left"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-[#16382b]">
              Verification code
            </label>
            <CountdownTimerBadge seconds={countdownSeconds} />
          </div>

          {/* 6-box OTP input */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 justify-start">
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-10 h-11 sm:w-12 sm:h-13 text-center text-lg sm:text-xl font-bold text-[#16382b] bg-white border border-[#d5ded7] rounded-xl focus:border-[#245b43] focus:ring-2 focus:ring-[#245b43]/20 outline-none transition-all"
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#6b7c72] mt-3">
            <span>
              {countdownSeconds > 0
                ? `Code expires in ${formatSeconds(countdownSeconds)}.`
                : "Code expired. Please request a new code."}
            </span>
            <span>Keep this page open while you verify.</span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || isResending}
            isLoading={isLoading}
            loadingText="Verifying code..."
            className="w-full h-11 sm:h-12 text-sm shadow-sm"
          >
            Verify code
          </Button>
        </div>

        {/* Resend Link */}
        <div className="pt-1 text-xs">
          <span className="text-[#16382b]">Didn&apos;t receive a code? </span>
          {countdownSeconds > 0 ? (
            <span className="text-[#6b7c72]">
              Resend in{" "}
              <span className="font-semibold text-[#245b43]">
                {formatSeconds(countdownSeconds)}
              </span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResending}
              className="font-bold text-[#245b43] hover:underline cursor-pointer disabled:opacity-50"
            >
              {isResending ? "Resending code..." : "Resend"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
