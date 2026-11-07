import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { postToBackend, getBaseUrl } from "@/lib/api-client";
import { logBackendErrorToTerminal } from "@/lib/api/backend-logger";

// Module endpoints for password recovery
const BACKEND_FORGOT_PASSWORD_ENDPOINTS = [
  "/api/v1/auth/forgot-password"
];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid email address is required.",
        },
        { status: 400 },
      );
    }

    const cleanedEmail = email.trim().toLowerCase();

    let backendResponse;
    try {
      backendResponse = await postToBackend(BACKEND_FORGOT_PASSWORD_ENDPOINTS, {
        email: cleanedEmail,
      });
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
            message: errorMsg || "Failed to process password recovery. Please check your email address.",
          },
          { status },
        );
      }

      logBackendErrorToTerminal({
        action: "Forgot Password Request",
        endpoint: BACKEND_FORGOT_PASSWORD_ENDPOINTS.join(" | "),
        baseUrl: getBaseUrl(),
        status: status >= 500 ? status : 502,
        message: "Password recovery service unreachable. Backend is not running.",
      });
      return NextResponse.json(
        {
          success: false,
          message: "Unable to contact password recovery service. Please try again later.",
        },
        { status: status >= 500 ? status : 502 },
      );
    }

    const backendData = backendResponse.data;
    const isOk = backendResponse.status >= 200 && backendResponse.status < 300;

    if (!isOk) {
      const errorMessage =
        backendData?.detail ||
        backendData?.message ||
        (Array.isArray(backendData?.detail)
          ? backendData.detail[0]?.msg
          : null) ||
        "This email address was not found in our records.";

      return NextResponse.json(
        {
          success: false,
          message:
            typeof errorMessage === "string"
              ? errorMessage
              : "Password recovery request failed.",
        },
        { status: backendResponse.status || 400 },
      );
    }

    // Save reset email in secure HTTP-only cookies for subsequent OTP verification
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === "production";

    cookieStore.set("uam_reset_email", cleanedEmail, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message:
        backendData?.message ||
        "Verification code has been sent to your registered email address.",
    });
  } catch (error: unknown) {
    const safeMsg = error instanceof Error ? error.message : "Unexpected error";
    console.error("[Forgot Password API] Error:", safeMsg);
    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to process password recovery request. Please try again.",
      },
      { status: 500 },
    );
  }
}
