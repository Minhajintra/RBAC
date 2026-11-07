import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { postToBackend, getBaseUrl } from "@/lib/api-client";
import { logBackendErrorToTerminal } from "@/lib/api/backend-logger";

// Module endpoints for password reset
const BACKEND_RESET_PASSWORD_ENDPOINTS = [
  "/api/v1/auth/forgot-password"
];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "A valid new password is required.",
        },
        { status: 400 },
      );
    }

    if (password.trim().length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters long.",
        },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const targetEmail = cookieStore.get("uam_reset_email")?.value;
    const recoveryOtp = cookieStore.get("uam_reset_otp")?.value;

    if (!targetEmail) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No active password recovery session found. Please request a new verification code.",
        },
        { status: 400 },
      );
    }

    if (!recoveryOtp) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Verification code is missing or session expired. Please verify your OTP again.",
        },
        { status: 400 },
      );
    }

    let backendResponse;
    try {
      backendResponse = await postToBackend(BACKEND_RESET_PASSWORD_ENDPOINTS, {
        email: targetEmail.trim(),
        otp_code: recoveryOtp.trim(),
        new_password: String(password).trim(),
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
            message: errorMsg || "Failed to update password. Please check your verification code.",
          },
          { status },
        );
      }

      logBackendErrorToTerminal({
        action: "Reset Password Submission",
        endpoint: BACKEND_RESET_PASSWORD_ENDPOINTS.join(" | "),
        baseUrl: getBaseUrl(),
        status: status >= 500 ? status : 502,
        message: "Password update service unreachable. Backend is not running.",
      });
      return NextResponse.json(
        {
          success: false,
          message: "Unable to contact password update service. Please try again later.",
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
        "Failed to update password. Please check your verification code and try again.";

      return NextResponse.json(
        {
          success: false,
          message:
            typeof errorMessage === "string"
              ? errorMessage
              : "Password update failed.",
        },
        { status: backendResponse.status || 400 },
      );
    }

    // Clean up temporary recovery cookies upon successful reset
    cookieStore.delete("uam_reset_email");
    cookieStore.delete("uam_reset_otp");
    cookieStore.delete("uam_pending_email");

    return NextResponse.json({
      success: true,
      message:
        backendData?.message ||
        "Password has been reset successfully. You can now sign in.",
    });
  } catch (error: unknown) {
    const safeMsg = error instanceof Error ? error.message : "Unexpected error";
    console.error("[Reset Password API] Route Error:", safeMsg);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to reset password. Please try again later.",
      },
      { status: 500 },
    );
  }
}
