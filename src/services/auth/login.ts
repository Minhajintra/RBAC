import { authService } from "../auth.service";
import { LoginRequest, LoginResponse } from "@/app/(auth)/login/types/login.types";

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  return authService.login(payload);
}

