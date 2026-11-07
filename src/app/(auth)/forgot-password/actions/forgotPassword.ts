"use server";

import { authService } from "@/services/auth.service";
import {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
} from "../types/forgotPassword.types";

/**
 * Server Action to request password recovery email
 */
export async function forgotPasswordAction(
  payload: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  return authService.forgotPassword(payload);
}
