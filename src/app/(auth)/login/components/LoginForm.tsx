"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Check } from "lucide-react";
import Logo from "@/components/layout/Logo";
import {
  Button,
  Input,
  PasswordInput,
  Checkbox,
  Modal,
  Alert,
} from "@/components/ui";
import { loginData } from "../../constants/auth-content";
import { loginSchema, getFieldErrors } from "../schema/loginSchema";
import { authService } from "@/services/auth.service";

interface LoginAlertProps {
  message?: string;
}

function LoginAlert({ message }: LoginAlertProps) {
  if (!message) return null;

  const isInternalServerError =
    message.toLowerCase().includes("internal server error") ||
    message.toLowerCase().includes("500") ||
    message.toLowerCase().includes("offline") ||
    message.toLowerCase().includes("unavailable");

  if (isInternalServerError) {
    const cleanMsg = message
      .replace(/^500\s*:?\s*/i, "")
      .replace(/^internal server error\s*:?\s*/i, "");
    return (
      <Alert
        variant="error"
        title="500 Internal Server Error"
        message={
          cleanMsg ||
          "Unable to establish connection with the backend server. Please verify the service is running."
        }
        className="mb-2.5 text-left"
      />
    );
  }

  return <Alert variant="error" message={message} className="mb-2.5 text-left" />;
}

interface OtpModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

function OtpModal({ isOpen, onConfirm }: OtpModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onConfirm}
      title="OTP Sent Successfully!"
      maxWidth="sm"
    >
      <div className="space-y-4">
        <p className="text-xs sm:text-sm text-[#465b50] leading-relaxed">
          A verification code has been sent successfully to your registered
          email address. Please check your inbox.
        </p>
        <div className="pt-2 flex justify-end">
          <Button type="button" variant="primary" onClick={onConfirm}>
            OK
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isServerOfflineParam = searchParams.get("error") === "server_offline";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loginData.loadingButton);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const handleModalConfirm = () => {
    setShowOtpModal(false);
    router.push("/verify-otp?from=login");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError("");

    const validation = loginSchema.safeParse({
      identifier,
      password,
      rememberMe,
    });
    if (!validation.success) {
      setErrors(getFieldErrors(validation.error));
      return;
    }

    setErrors({});
    setIsLoading(true);
    setLoadingMessage("Authenticating credentials...");

    const progressTimer = setTimeout(() => {
      setLoadingMessage("Dispatching code to email...");
    }, 2200);

    try {
      const response = await authService.login({
        identifier,
        password,
        rememberMe,
      });
      clearTimeout(progressTimer);

      if (!response.success) {
        setServerError(
          response.message || loginData.validation.invalidCredentials,
        );
        setIsLoading(false);
        setLoadingMessage(loginData.loadingButton);
        return;
      }

      // All valid logins require Multi-Factor Authentication (OTP)
      setIsLoading(false);
      setLoadingMessage(loginData.loadingButton);
      setShowOtpModal(true);
      // Auto-transition to OTP verification screen if OK button is not clicked immediately
      setTimeout(() => {
        router.push("/verify-otp?from=login");
      }, 2000);
      return;
    } catch (error) {
      clearTimeout(progressTimer);
      let message =
        "500 Internal Server Error: Unable to establish connection with the backend server. Please verify the service is running.";
      if (error instanceof Error) {
        if (
          error.message.includes("timeout") ||
          (error as { code?: string }).code === "ECONNABORTED"
        ) {
          message =
            "500 Internal Server Error: The backend server took too long to respond. Please check your backend connection.";
        } else if (
          error.message.includes("Backend endpoint not found") ||
          error.message.includes("404") ||
          error.message.includes("500") ||
          error.message.includes("502") ||
          error.message.includes("503") ||
          error.message.includes("ECONNREFUSED") ||
          error.message.includes("Network Error") ||
          error.message.includes("offline")
        ) {
          message =
            "500 Internal Server Error: Unable to establish connection with the backend server. Please verify the service is running.";
        } else {
          message = error.message;
        }
      }
      setServerError(message);
      setIsLoading(false);
      setLoadingMessage(loginData.loadingButton);
    }
  };

  return (
    <div className="w-full max-w-[360px] sm:max-w-[390px] xl:max-w-[410px] mx-auto lg:mr-0 shrink-0">
      <div className="bg-white/90 backdrop-blur-xl border border-white/95 rounded-[28px] p-5 sm:p-6 shadow-2xl transition-all">
        <div className="mb-2">
          <Logo href="/login" />
        </div>

        <span className="inline-block px-2.5 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider uppercase bg-[#e6efe8] text-[#225740] mb-1">
          {loginData.badge}
        </span>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[#11261c] tracking-tight mb-0.5">
          {loginData.title}
        </h2>
        <p className="text-[11px] text-[#6b7c72] mb-2.5">
          {loginData.subtitle}
        </p>

        <LoginAlert
          message={
            serverError ||
            (isServerOfflineParam
              ? "500 Internal Server Error: Backend service is currently unavailable. Please verify that the backend server is running."
              : "")
          }
        />

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-2.5 sm:space-y-3"
        >
          {/* Email / Username Input */}
          <Input
            id="identifier"
            label={loginData.emailLabel}
            type="text"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (errors.identifier) {
                setErrors((prev) => ({ ...prev, identifier: undefined }));
              }
            }}
            placeholder={loginData.emailPlaceholder}
            disabled={isLoading}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
            error={errors.identifier}
          />

          {/* Password Input */}
          <PasswordInput
            id="password"
            label={loginData.passwordLabel}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            placeholder={loginData.passwordPlaceholder}
            disabled={isLoading}
            autoComplete="current-password"
            error={errors.password}
          />

          {/* Remember Me and Forgot Password */}
          <div className="flex items-center justify-between text-[11px] pt-0.5">
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              label={loginData.rememberMe}
            />

            <Link
              href="/forgot-password"
              className="font-bold text-[#225740] hover:text-[#16382b] hover:underline"
            >
              {loginData.forgotPasswordLink}
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            isLoading={isLoading}
            loadingText={loadingMessage}
            className="w-full mt-1"
          >
            <span>{loginData.submitButton}</span>
          </Button>

          {isLoading && loadingMessage.includes("Dispatching") && (
            <p className="text-[10.5px] text-center text-[#225740] font-medium animate-pulse -mt-1">
              Connecting to secure email server to deliver code...
            </p>
          )}
        </form>

        {/* Support Section */}
        <div className="mt-2.5 pt-2 border-t border-[#e5ece7] text-[10.5px]">
          <p className="text-[#6b7c72]">{loginData.supportTroubleText}</p>
          <button
            type="button"
            onClick={() =>
              alert(
                "Please reach out to your system administrator for access assistance.",
              )
            }
            className="font-bold text-[#225740] hover:underline text-[10.5px] inline-block mt-0.5 cursor-pointer"
          >
            {loginData.supportContactText}
          </button>

          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#556b5e]">
            <Check className="w-3.5 h-3.5 text-[#225740] flex-shrink-0" />
            <span>{loginData.securityNote}</span>
          </div>
        </div>
      </div>

      <OtpModal isOpen={showOtpModal} onConfirm={handleModalConfirm} />
    </div>
  );
}
