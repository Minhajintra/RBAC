/**
 * Data contracts for Multi-Factor OTP Verification
 */

import { AuthUser } from "@/app/(auth)/login/types/login.types";

export interface SendOtpRequest {
  email?: string;
  reason?: "login" | "reset";
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  expiresInSeconds?: number;
}

export interface VerifyOtpRequest {
  otp: string;
  flow?: "login" | "reset";
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  accessToken?: string;
}
