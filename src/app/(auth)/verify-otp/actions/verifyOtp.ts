"use server";

import { authService } from "@/services/auth.service";
import {
  VerifyOtpRequest,
  VerifyOtpResponse,
  SendOtpRequest,
  SendOtpResponse,
} from "../types/verifyOtp.types";

/**
 * Server Action to verify 6-digit MFA OTP code
 */
export async function verifyOtpAction(
  payload: VerifyOtpRequest,
): Promise<VerifyOtpResponse> {
  return authService.verifyOtp(payload);
}

/**
 * Server Action to resend MFA OTP code
 */
export async function sendOtpAction(
  payload: SendOtpRequest = {},
): Promise<SendOtpResponse> {
  return authService.sendOtp(payload);
}
