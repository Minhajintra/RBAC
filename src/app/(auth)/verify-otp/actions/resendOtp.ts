"use server";

import { authService } from "@/services/auth.service";
import { SendOtpRequest, SendOtpResponse } from "../types/verifyOtp.types";

/**
 * Server Action for Resending OTP Code
 */
export async function resendOtpAction(
  payload: SendOtpRequest = {},
): Promise<SendOtpResponse> {
  return authService.sendOtp(payload);
}

