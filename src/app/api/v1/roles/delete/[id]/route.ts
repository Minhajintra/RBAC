import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { getBaseUrl } from "@/lib/api/request.interceptor";
import { logBackendErrorToTerminal } from "@/lib/api/backend-logger";

export const dynamic = "force-dynamic";

/**
 * Next.js API Route Handler: DELETE /api/v1/roles/delete/[id]
 * Proxies role deletion to backend FastAPI service.
 * Injects session bearer token from secure HTTP-only cookies.
 */
export async function DELETE(
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

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Request-ID": `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    "X-Workspace-ID": "ws-default",
  };

  if (token && token !== "null" && token !== "undefined") {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  // Attempt backend deletion endpoints
  const candidates = [
    `${backendBaseUrl}/api/v1/roles/delete/${numId}`,
    `${backendBaseUrl}/api/v1/roles/${numId}`,
    `${backendBaseUrl}/api/v1/roles/delete-role/${numId}`,
  ];

  let lastResponse = null;
  for (const url of candidates) {
    try {
      const backendResponse = await axios.delete(url, {
        headers,
        timeout: 10000,
        validateStatus: () => true,
      });

      if (backendResponse.status >= 200 && backendResponse.status < 300) {
        return NextResponse.json(backendResponse.data || { success: true, message: "Role deleted successfully." }, {
          status: backendResponse.status,
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        });
      }

      lastResponse = backendResponse;
      // If 404 or 405, try next candidate
      if (backendResponse.status !== 404 && backendResponse.status !== 405) {
        break;
      }
    } catch {
      // continue to next candidate
    }
  }

  if (lastResponse) {
    return NextResponse.json(
      lastResponse.data || {
        success: false,
        message: "Backend API does not support role deletion (endpoint not found in backend specification).",
      },
      { status: lastResponse.status },
    );
  }

  logBackendErrorToTerminal({
    action: `DELETE /api/v1/roles/delete/${numId} Proxy`,
    endpoint: `/api/v1/roles/delete/${numId}`,
    baseUrl: backendBaseUrl,
    status: 404,
    message: "No active role deletion endpoint exists on the backend server.",
  });

  return NextResponse.json(
    {
      success: false,
      message: "Backend API does not support role deletion (no DELETE endpoint exists in backend specification).",
    },
    { status: 404 },
  );
}

