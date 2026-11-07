import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { postToBackend, getBaseUrl } from "@/lib/api-client";
import { logBackendErrorToTerminal } from "@/lib/api/backend-logger";

// Module endpoints for OTP dispatch
const BACKEND_OTP_SEND_ENDPOINTS = [
  "/api/v1/auth/otp/send"
];

const BACKEND_FORGOT_PASSWORD_ENDPOINTS = [
  "/api/v1/auth/forgot-password"
];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const reason = body?.reason;

    const cookieStore = await cookies();
    const recipientEmail =
      cookieStore.get("uam_reset_email")?.value ||
      cookieStore.get("uam_pending_email")?.value ||
      cookieStore.get("uam_user_email")?.value;

    if (!recipientEmail) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No active verification session found. Please enter your credentials again.",
        },
        { status: 400 },
      );
    }

    // Determine target endpoint based on recovery or login flow
    const isResetFlow =
      reason === "reset" ||
      (!cookieStore.get("uam_pending_token") &&
        Boolean(cookieStore.get("uam_reset_email")));

    const endpoints = isResetFlow
      ? BACKEND_FORGOT_PASSWORD_ENDPOINTS
      : BACKEND_OTP_SEND_ENDPOINTS;

    const token =
      cookieStore.get("uam_pending_token")?.value ||
      cookieStore.get("uam_auth_token")?.value;

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
      response = await postToBackend(
        endpoints,
        {
          email: recipientEmail.trim(),
        },
        { headers },
      );
    } catch (networkError: unknown) {
      const errWithStatus = networkError as {
        status?: number;
        response?: { status?: number; data?: Record<string, unknown> };
        data?: Record<string, unknown>;
      };
      const status = errWithStatus?.status || errWithStatus?.response?.status || 500;
      const respData = (errWithStatus?.data || errWithStatus?.response?.data) as Record<string, unknown> | undefined;
      const detail = respData?.detail || respData?.message;
      const errorMsg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail) && detail[0]?.msg
            ? String(detail[0].msg)
            : "";

      if (status >= 400 && status < 500) {
        return NextResponse.json(
          {
            success: false,
            message: errorMsg || "Failed to dispatch verification code. Please check your email.",
          },
          { status },
        );
      }

      logBackendErrorToTerminal({
        action: "Resend OTP Dispatch",
        endpoint: endpoints.join(" | "),
        baseUrl: getBaseUrl(),
        status: status >= 500 ? status : 502,
        message: "Failed to dispatch verification code. Backend service is offline.",
      });

      return NextResponse.json(
        {
          success: false,
          message: "Unable to dispatch verification code. Please try again later.",
        },
        { status: status >= 500 ? status : 502 },
      );
    }

    const responseData = response.data;
    const isOk = response.status >= 200 && response.status < 300 && responseData?.success !== false;

    if (!isOk) {
      const errorMessage =
        responseData?.detail ||
        responseData?.message ||
        (Array.isArray(responseData?.detail)
          ? responseData.detail[0]?.msg
          : null) ||
        "Backend was unable to dispatch a new verification code.";

      return NextResponse.json(
        {
          success: false,
          message:
            typeof errorMessage === "string"
              ? errorMessage
              : "Failed to dispatch verification code.",
        },
        { status: response.status || 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        responseData?.message || "Verification code successfully dispatched.",
      expiresInSeconds: 60,
    });
  } catch (error: unknown) {
    const safeMsg = error instanceof Error ? error.message : "Unexpected error";
    console.error("[Send OTP API] Route Error:", safeMsg);
    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to dispatch verification code. Please check connection.",
      },
      { status: 500 },
    );
  }
}
