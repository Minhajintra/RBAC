import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { getBaseUrl } from "@/lib/api/request.interceptor";
import { logBackendErrorToTerminal } from "@/lib/api/backend-logger";

export const dynamic = "force-dynamic";

/**
 * Next.js API Route Handler: GET /api/v1/users/user-list
 * Securely proxies user list queries from browser to live backend service.
 * Automatically injects session bearer token from HTTP-only cookies without client exposure.
 */
export async function GET(request: Request) {
  const backendBaseUrl = getBaseUrl();

  if (!backendBaseUrl) {
    return NextResponse.json(
      {
        success: false,
        message: "BACKEND_BASE_URL is not configured in environment.",
      },
      { status: 500 },
    );
  }

  // 1. Resolve token from incoming header or secure HTTP-only cookies
  let token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim();

  if (!token) {
    try {
      const cookieStore = await cookies();
      token =
        cookieStore.get("uam_auth_token")?.value ||
        cookieStore.get("token")?.value ||
        cookieStore.get("access_token")?.value ||
        cookieStore.get("uam_pending_token")?.value;
    } catch {
      // Cookies not accessible
    }
  }

  const { search } = new URL(request.url);
  const backendUrl = `${backendBaseUrl}/api/v1/users/user-list${search}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Request-ID": `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    "X-Workspace-ID": "ws-default",
  };

  if (token && token !== "null" && token !== "undefined") {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  try {
    const backendResponse = await axios.get(backendUrl, {
      headers,
      timeout: 15000,
      validateStatus: () => true, // capture all status codes
    });

    return NextResponse.json(backendResponse.data, {
      status: backendResponse.status,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: unknown) {
    const axiosError = err as { code?: string; message?: string };
    const isNetworkError =
      axiosError.code === "ECONNREFUSED" ||
      axiosError.code === "ENOTFOUND" ||
      axiosError.code === "ERR_NETWORK" ||
      axiosError.message?.includes("Network Error");

    logBackendErrorToTerminal({
      action: "GET /api/v1/users/user-list Proxy",
      endpoint: "/api/v1/users/user-list",
      baseUrl: backendBaseUrl,
      status: isNetworkError ? 502 : 500,
      message: "Failed to connect to backend users service.",
      error: err,
    });

    return NextResponse.json(
      {
        success: false,
        message: "Backend users service is temporarily unavailable.",
      },
      { status: isNetworkError ? 502 : 500 },
    );
  }
}

