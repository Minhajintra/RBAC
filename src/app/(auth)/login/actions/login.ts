"use server";

import { authService } from "@/services/auth.service";
import { LoginRequest, LoginResponse } from "../types/login.types";

/**
 * Server Action for User Login
 */
export async function loginAction(
  payload: LoginRequest,
): Promise<LoginResponse> {
  return authService.login(payload);
}
