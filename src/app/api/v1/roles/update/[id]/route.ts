import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { getBaseUrl } from "@/lib/api/request.interceptor";
import { logBackendErrorToTerminal } from "@/lib/api/backend-logger";

export const dynamic = "force-dynamic";

/**
 * Next.js API Route Handler: PUT /api/v1/roles/update/[id]
 * Proxies role updates to backend FastAPI service.
 * Injects session bearer token from secure HTTP-only cookies.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  const numId = parseInt(id.replace(/\D/g, ""), 10) || id;

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

  const backendUrl = `${backendBaseUrl}/api/v1/roles/update/${numId}`;

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
      action: `PUT /api/v1/roles/update/${numId} Proxy`,
      endpoint: `/api/v1/roles/update/${numId}`,
      baseUrl: backendBaseUrl,
      status: isNetworkError ? 502 : 500,
      message: "Failed to connect to backend roles service.",
      error: err,
    });

    return NextResponse.json(
      {
        success: false,
        message: "Backend roles service is temporarily unavailable.",
      },
      { status: isNetworkError ? 502 : 500 },
    );
  }
}

