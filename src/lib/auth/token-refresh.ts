import { authStorage } from "./auth-storage";

/**
 * Token Refresh Coordinator
 * Coordinates refreshing the session token across both client and server environments.
 * Prevents duplicate simultaneous requests using single-flight promises.
 */

let clientRefreshPromise: Promise<string | null> | null = null;
let serverRefreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  // 1. Browser Client Environment
  if (typeof window !== "undefined") {
    if (clientRefreshPromise) {
      return clientRefreshPromise;
    }

    clientRefreshPromise = (async () => {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          authStorage.clear();
          return null;
        }

        const data = await response.json();
        const newToken = data?.accessToken || data?.token || null;
        if (newToken) {
          authStorage.setAccessToken(newToken);
        }
        return newToken;
      } catch (error) {
        console.warn("[token-refresh] Failed to refresh token in browser:", error);
        authStorage.clear();
        return null;
      } finally {
        clientRefreshPromise = null;
      }
    })();

    return clientRefreshPromise;
  }

  // 2. Server Environment (Next.js Server Components, Server Actions, Route Handlers)
  if (serverRefreshPromise) {
    return serverRefreshPromise;
  }

  serverRefreshPromise = (async () => {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const refreshToken = cookieStore.get("uam_refresh_token")?.value;

      if (!refreshToken) {
        return null;
      }

      const { getBaseUrl } = await import("@/lib/api/request.interceptor");
      const backendBaseUrl = getBaseUrl();
      if (!backendBaseUrl) {
        return null;
      }

      const axios = (await import("axios")).default;
      const backendResponse = await axios.post(
        `${backendBaseUrl}/api/v1/auth/token/refresh`,
        { refresh_token: refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      const isSuccess =
        backendResponse.status >= 200 && backendResponse.status < 300;
      const backendData = backendResponse.data;

      if (!isSuccess) {
        try {
          cookieStore.delete("uam_refresh_token");
          cookieStore.delete("uam_auth_token");
          cookieStore.delete("uam_verified");
        } catch {
          // Read-only cookie context in server component render
        }
        return null;
      }

      const newAccessToken =
        backendData?.data?.access_token ||
        backendData?.access_token ||
        backendData?.data?.token ||
        backendData?.data?.accessToken;

      const newRefreshToken =
        backendData?.data?.refresh_token ||
        backendData?.refresh_token ||
        backendData?.data?.refreshToken;

      if (!newAccessToken) {
        return null;
      }

      const isProduction = process.env.NODE_ENV === "production";
      try {
        cookieStore.set("uam_auth_token", String(newAccessToken), {
          httpOnly: true,
          secure: isProduction,
          sameSite: "lax",
          maxAge: 60 * 60 * 24,
          path: "/",
        });

        if (newRefreshToken) {
          cookieStore.set("uam_refresh_token", String(newRefreshToken), {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
          });
        }
      } catch {
        // Read-only cookie context in server component render:
        // Cookie mutation is deferred to Server Actions / API routes,
        // but newAccessToken is returned for the active server query.
      }

      return String(newAccessToken);
    } catch (error) {
      console.warn("[token-refresh] Failed to refresh token on server:", error);
      return null;
    } finally {
      serverRefreshPromise = null;
    }
  })();

  return serverRefreshPromise;
}

