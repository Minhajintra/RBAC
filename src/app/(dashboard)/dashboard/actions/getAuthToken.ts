"use server";

import { cookies } from "next/headers";
import { refreshAccessToken } from "@/lib/auth/token-refresh";

function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = Buffer.from(base64, "base64").toString("utf-8");
    const parsed = JSON.parse(jsonStr);
    return typeof parsed?.exp === "number" ? parsed.exp : null;
  } catch {
    return null;
  }
}

/**
 * Resolves active session token for Server Actions / Server Components.
 * Proactively refreshes if the access token is missing or expired and refresh token exists.
 */
export async function getDashboardAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("uam_auth_token")?.value ||
    cookieStore.get("token")?.value ||
    cookieStore.get("access_token")?.value;

  if (token) {
    const exp = decodeJwtExp(token);
    if (exp && Date.now() >= exp * 1000) {
      // Proactively refresh expired token
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return refreshed;
      }
    }
    return token;
  }

  // If no access token but refresh token exists, refresh immediately
  const hasRefreshToken = Boolean(cookieStore.get("uam_refresh_token")?.value);
  if (hasRefreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return refreshed;
    }
  }

  return undefined;
}

