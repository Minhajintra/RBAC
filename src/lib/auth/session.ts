import { authStorage } from "./auth-storage";

/**
 * Session Helpers
 * Human-readable helpers to inspect user authentication session
 */

export function getClientToken(): string | null {
  return authStorage.getAccessToken();
}

export function isAuthenticatedClient(): boolean {
  return Boolean(authStorage.getAccessToken());
}

export async function getServerSessionToken(): Promise<string | null> {
  if (typeof window !== "undefined") {
    return authStorage.getAccessToken();
  }

  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const isVerified = cookieStore.get("uam_verified")?.value === "true";
    if (!isVerified) return null;
    return cookieStore.get("uam_auth_token")?.value || null;
  } catch {
    return null;
  }
}
