"use server";

import { authService } from "@/services/auth.service";
import {
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "../types/resetPassword.types";

/**
 * Server Action to update user password
 */
export async function resetPasswordAction(
  payload: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  return authService.resetPassword(payload);
}
