import { InternalAxiosRequestConfig } from "axios";
import { authStorage } from "@/lib/auth/auth-storage";

export const getBaseUrl = (): string => {
  if (typeof window === "undefined") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require("path");
      const envPath = path.resolve(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        const match = content.match(/BACKEND_BASE_URL\s*=\s*([^\r\n]+)/);
        if (match && match[1]?.trim()) {
          return match[1].trim().replace(/\/+$/, "");
        }
      }
    } catch {
      // ignore
    }
  }

  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
    process.env.BACKEND_BASE_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");
};

/**
 * Attaches authentication headers and request tracking metadata
 */
export async function onRequest(
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> {
  const currentBase = getBaseUrl();

  // Route internal auth and proxy endpoints to Next.js API routes
  if (config.url?.startsWith("/api/auth/")) {
    config.baseURL = "";
  } else if (typeof window !== "undefined") {
    // In browser, route internal proxy paths to same-origin API routes to leverage secure HTTP-only cookies
    if (
      config.url?.startsWith("/api/v1/navigation/sidebar") ||
      config.url?.startsWith("/api/v1/permissions/") ||
      config.url?.startsWith("/api/v1/users/") ||
      config.url?.startsWith("/api/v1/roles/") ||
      config.url?.startsWith("/api/v1/auth/logout")
    ) {
      config.baseURL = "";
    } else {
      config.baseURL = currentBase;
    }
  } else {
    config.baseURL = currentBase;
  }

  // Set default tracking headers
  config.headers = config.headers || {};
  if (!config.headers["X-Request-ID"]) {
    config.headers["X-Request-ID"] = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  if (!config.headers["X-Workspace-ID"]) {
    config.headers["X-Workspace-ID"] = "ws-default";
  }

  // Attach authorization token
  let token = typeof window !== "undefined" ? authStorage.getAccessToken() : null;

  if (typeof window === "undefined") {
    try {
      const { cookies, headers } = await import("next/headers");
      const cookieStore = await cookies();
      token =
        cookieStore.get("uam_auth_token")?.value ||
        cookieStore.get("token")?.value ||
        cookieStore.get("access_token")?.value ||
        cookieStore.get("uam_pending_token")?.value ||
        null;

      // Forward client user-agent and IP if running in server request context
      const headersList = await headers();
      const clientUa = headersList.get("user-agent");
      if (
        clientUa &&
        (!config.headers["User-Agent"] ||
          String(config.headers["User-Agent"]).startsWith("axios"))
      ) {
        config.headers["User-Agent"] = clientUa;
      }

      const clientIp =
        headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headersList.get("x-real-ip");
      if (clientIp && !config.headers["X-Forwarded-For"]) {
        config.headers["X-Forwarded-For"] = clientIp;
      }
    } catch {
      // Server context without request cookies/headers
    }
  }

  // Avoid attaching old/expired Bearer token to unauthenticated auth routes (refresh, login, forgot password)
  const isAuthRefreshOrLogin =
    config.url?.includes("/auth/token/refresh") ||
    config.url?.includes("/auth/login") ||
    config.url?.includes("/auth/forgot-password");

  if (!isAuthRefreshOrLogin && token && !config.headers.Authorization) {
    const cleanToken = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();
    if (cleanToken && cleanToken !== "null" && cleanToken !== "undefined") {
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
  }

  return config;
}

export function onRequestError(error: unknown) {
  return Promise.reject(error);
}
