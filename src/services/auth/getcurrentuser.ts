import { authService } from "../auth.service";
import { AuthUser } from "@/app/(auth)/login/types/login.types";

export async function getCurrentUser(): Promise<AuthUser | null> {
  return authService.getCurrentUser();
}
