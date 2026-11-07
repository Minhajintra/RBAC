import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { getBaseUrl } from "@/lib/api/request.interceptor";
import { logBackendErrorToTerminal } from "@/lib/api/backend-logger";

export const dynamic = "force-dynamic";

/**
 * Next.js API Route Handler: PUT /api/v1/permissions/roles/special-permissions
 * Proxies role special permissions update to backend FastAPI service.
 */
export async function PUT(request: Request) {
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

  const backendUrl = `${backendBaseUrl}/api/v1/permissions/roles/special-permissions`;

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
    const body = await request.json().catch(() => ({}));
    const backendResponse = await axios.put(backendUrl, body, {
      headers,
      timeout: 15000,
      validateStatus: () => true,
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
      action: "PUT /api/v1/permissions/roles/special-permissions Proxy",
      endpoint: "/api/v1/permissions/roles/special-permissions",
      baseUrl: backendBaseUrl,
      status: isNetworkError ? 502 : 500,
      message: "Failed to connect to backend permissions service.",
      error: err,
    });

    return NextResponse.json(
      {
        success: false,
        message: "Backend permissions service is temporarily unavailable.",
      },
      { status: isNetworkError ? 502 : 500 },
    );
  }
}

