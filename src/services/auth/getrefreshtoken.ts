import { authService } from "../auth.service";

export async function getRefreshToken(): Promise<string> {
  return authService.refreshToken();
}
