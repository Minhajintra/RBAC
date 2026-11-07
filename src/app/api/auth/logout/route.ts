import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { postToBackend } from "@/lib/api-client";

// Real backend logout route per OpenAPI 3.1.0 contract
const BACKEND_LOGOUT_ENDPOINTS = [
  "/api/v1/auth/logout",
];

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    // 1. Resolve token from incoming request Authorization header or secure cookies
    let token = request?.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (!token) {
      token =
        cookieStore.get("uam_auth_token")?.value ||
        cookieStore.get("token")?.value ||
        cookieStore.get("access_token")?.value ||
        cookieStore.get("uam_pending_token")?.value;
    }

    // 2. Notify real backend API of logout so token/session is revoked server-side
    if (token && token !== "null" && token !== "undefined") {
      try {
        await postToBackend(
          BACKEND_LOGOUT_ENDPOINTS,
          {},
          {
            headers: {
              Authorization: `Bearer ${token.trim()}`,
              Accept: "application/json",
            },
            timeout: 10000,
          },
        );
      } catch (backendError: unknown) {
        const safeMsg =
          backendError instanceof Error
            ? backendError.message
            : "Backend notification completed";
        console.warn("[Logout API] Backend notification warning:", safeMsg);
      }
    }

    // 3. Invalidate all authentication and session cookies
    const cookiesToClear = [
      "uam_auth_token",
      "uam_refresh_token",
      "uam_verified",
      "uam_pending_token",
      "uam_pending_email",
      "uam_pending_role",
      "uam_pending_name",
      "uam_user_email",
      "uam_user_name",
      "uam_user_role",
      "uam_reset_email",
      "uam_reset_otp",
      "uam_expected_otp",
      "token",
      "access_token",
    ];

    for (const cookieName of cookiesToClear) {
      cookieStore.delete(cookieName);
    }

    return NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error: unknown) {
    const safeMsg =
      error instanceof Error ? error.message : "Unexpected error";
    console.error("[Logout API] Route Error:", safeMsg);
    return NextResponse.json(
      { success: false, message: "Logout failed." },
      { status: 500 },
    );
  }
}
