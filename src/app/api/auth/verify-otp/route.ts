import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { postToBackend, BackendResponseEnvelope, getBaseUrl } from "@/lib/api-client";
import { logBackendErrorToTerminal } from "@/lib/api/backend-logger";

// Module endpoint for OTP verification matching FastAPI backend API contract
const BACKEND_OTP_VERIFY_ENDPOINT = "/api/v1/auth/otp/verify";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  try {
    const body = await request.json().catch(() => ({}));
    const { otp, flow } = body;

    // Validate 6-digit numeric code
    if (!otp || typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
      return NextResponse.json(
        {
          success: false,
          message: "Verification code must be exactly 6 numeric digits.",
        },
        { status: 400 },
      );
    }

    const cleanOtp = otp.trim();

    // Handle password reset flow: verify code with backend API before allowing password update
    if (flow === "reset") {
      const resetEmail = cookieStore.get("uam_reset_email")?.value;
      if (!resetEmail) {
        return NextResponse.json(
          {
            success: false,
            redirectToLogin: true,
            message: "Password recovery session has expired. Please log in again.",
          },
          { status: 400 },
        );
      }

      try {
        const backendResetResponse = await postToBackend([BACKEND_OTP_VERIFY_ENDPOINT], {
          email: resetEmail.trim(),
          otp_code: cleanOtp,
        });

        if (!backendResetResponse || backendResetResponse.status < 200 || backendResetResponse.status >= 300) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid or expired verification code.",
            },
            { status: 400 },
          );
        }
      } catch (err: unknown) {
        const apiErr = err as {
          status?: number;
          message?: string;
          data?: Record<string, unknown>;
          response?: { status?: number; data?: Record<string, unknown> };
        };
        const status = apiErr.status || apiErr.response?.status || 500;
        if (status >= 500 || !apiErr.response) {
          logBackendErrorToTerminal({
            action: "OTP Verify (Reset Flow)",
            endpoint: BACKEND_OTP_VERIFY_ENDPOINT,
            baseUrl: getBaseUrl(),
            status: status >= 500 ? status : 502,
            message: "OTP verification service unreachable. Please check backend connection.",
          });

          return NextResponse.json(
            {
              success: false,
              message: "Unable to communicate with verification service. Please try again.",
            },
            { status: status >= 500 ? status : 502 },
          );
        }

        const responseData = (apiErr.data || apiErr.response?.data) as Record<string, unknown> | undefined;
        const detail = responseData?.detail || responseData?.message || apiErr.message;
        const msg = typeof detail === "string" ? detail : "Invalid or expired verification code.";
        return NextResponse.json(
          { success: false, message: msg },
          { status: apiErr.status || apiErr.response?.status || 400 },
        );
      }

      cookieStore.set("uam_reset_otp", cleanOtp, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 15 * 60,
        path: "/",
      });

      return NextResponse.json({
        success: true,
        message: "Code verified. Please set your new password.",
      });
    }

    // Login verification flow: retrieve pending user email from secure cookie
    const targetEmail = cookieStore.get("uam_pending_email")?.value;
    if (!targetEmail) {
      return NextResponse.json(
        {
          success: false,
          redirectToLogin: true,
          message: "Verification session has expired. Please log in again.",
        },
        { status: 400 },
      );
    }

    const pendingToken = cookieStore.get("uam_pending_token")?.value;

    // Capture incoming client headers to forward real device and IP details to backend
    const userAgent = request.headers.get("user-agent") || "";
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "";

    // Call real backend OTP verification endpoint exclusively
    let backendResponse;
    try {
      const verifyHeaders: Record<string, string> = {};
      if (userAgent) verifyHeaders["User-Agent"] = userAgent;
      if (clientIp) verifyHeaders["X-Forwarded-For"] = clientIp;
      if (pendingToken) {
        verifyHeaders.Authorization = `Bearer ${pendingToken}`;
      }

      const payload = {
        email: targetEmail.trim(),
        otp_code: cleanOtp,
      };

      try {
        backendResponse = await postToBackend(
          [BACKEND_OTP_VERIFY_ENDPOINT],
          payload,
          { headers: verifyHeaders },
        );
      } catch (authHeaderErr: unknown) {
        const hErr = authHeaderErr as { status?: number; response?: { status?: number } };
        const hStatus = hErr.status || hErr.response?.status;
        // If rejected with 401/403/422 with Authorization header, retry without it
        if ((hStatus === 401 || hStatus === 403 || hStatus === 422) && pendingToken) {
          const retryHeaders: Record<string, string> = {};
          if (userAgent) retryHeaders["User-Agent"] = userAgent;
          if (clientIp) retryHeaders["X-Forwarded-For"] = clientIp;
          backendResponse = await postToBackend(
            [BACKEND_OTP_VERIFY_ENDPOINT],
            payload,
            { headers: retryHeaders },
          );
        } else {
          throw authHeaderErr;
        }
      }
    } catch (err: unknown) {
      const apiErr = err as {
        status?: number;
        message?: string;
        data?: Record<string, unknown>;
        response?: { status?: number; data?: Record<string, unknown> };
      };
      const status = apiErr.status || apiErr.response?.status || 500;
      if (status >= 500 || !apiErr.response) {
        logBackendErrorToTerminal({
          action: "OTP Verify (Login Flow)",
          endpoint: BACKEND_OTP_VERIFY_ENDPOINT,
          baseUrl: getBaseUrl(),
          status: status >= 500 ? status : 502,
          message: "OTP verification service unreachable. Please check backend connection.",
        });

        return NextResponse.json(
          {
            success: false,
            message: "Verification service is currently unavailable. Please try again.",
          },
          { status: status >= 500 ? status : 502 },
        );
      }

      const responseData = (apiErr.data || apiErr.response?.data) as Record<string, unknown> | undefined;
      const detail = responseData?.detail || responseData?.message;
      const msg = typeof detail === "string" ? detail : "Invalid or expired verification code.";

      return NextResponse.json(
        { success: false, message: msg },
        { status: apiErr.status || apiErr.response?.status || 400 },
      );
    }

    const backendData = backendResponse?.data as BackendResponseEnvelope | undefined;
    const isOk = Boolean(
      backendResponse &&
      backendResponse.status >= 200 &&
      backendResponse.status < 300 &&
      backendData?.success !== false,
    );

    if (!isOk) {
      const errorMessage =
        backendData?.detail ||
        backendData?.message ||
        "Invalid or expired verification code.";

      return NextResponse.json(
        {
          success: false,
          message:
            typeof errorMessage === "string"
              ? errorMessage
              : "Invalid or expired verification code.",
        },
        { status: backendResponse?.status || 400 },
      );
    }

    // Extract access token strictly from real backend response or backend-provided pending token
    const accessToken =
      backendData?.data?.access_token ||
      backendData?.access_token ||
      backendData?.data?.token ||
      backendData?.token ||
      backendData?.data?.accessToken ||
      backendData?.accessToken ||
      backendData?.data?.jwt ||
      backendData?.jwt ||
      pendingToken;

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication verification failed: Backend did not return an access token.",
        },
        { status: 502 },
      );
    }

    // Extract optional refresh token if provided by backend (or pending login session)
    const pendingRefreshToken = cookieStore.get("uam_pending_refresh_token")?.value;
    const refreshToken =
      backendData?.data?.refresh_token ||
      backendData?.refresh_token ||
      backendData?.data?.refreshToken ||
      backendData?.refreshToken ||
      pendingRefreshToken;

    const backendUser =
      (backendData?.data?.user as Record<string, unknown> | undefined) ||
      (backendData?.user as Record<string, unknown> | undefined) ||
      (backendData?.data as Record<string, unknown> | undefined) ||
      {};

    const pendingRole = cookieStore.get("uam_pending_role")?.value;
    const pendingName = cookieStore.get("uam_pending_name")?.value;

    const userEmail = String(
      backendUser?.email ||
        backendData?.data?.email ||
        backendData?.email ||
        targetEmail ||
        "",
    ).trim();

    const candidateName = String(
      backendUser?.name ||
        backendUser?.full_name ||
        backendUser?.fullName ||
        (backendUser?.first_name
          ? `${backendUser.first_name} ${backendUser.last_name || ""}`.trim()
          : "") ||
        backendUser?.username ||
        backendData?.data?.name ||
        backendData?.data?.username ||
        pendingName ||
        (userEmail.includes("@") ? userEmail.split("@")[0] : userEmail) ||
        "User",
    ).trim();

    const candidateRole = String(
      backendUser?.role ||
        backendUser?.role_name ||
        backendUser?.roleName ||
        backendUser?.user_role ||
        backendData?.data?.role ||
        pendingRole ||
        "Administrator",
    ).trim();

    const userName = candidateName;
    const userRole = candidateRole;
    const initials = userName
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

    // Establish secure authenticated session cookies
    cookieStore.set("uam_auth_token", String(accessToken), {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    if (refreshToken) {
      cookieStore.set("uam_refresh_token", String(refreshToken), {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
    }

    cookieStore.set("uam_verified", "true", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    cookieStore.set("uam_user_email", userEmail, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    if (userName) {
      cookieStore.set("uam_user_name", userName, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      });
    }

    if (userRole) {
      cookieStore.set("uam_user_role", userRole, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      });
    }

    // Clean up temporary pending cookies
    cookieStore.delete("uam_pending_email");
    cookieStore.delete("uam_pending_token");
    cookieStore.delete("uam_pending_refresh_token");
    cookieStore.delete("uam_pending_role");
    cookieStore.delete("uam_pending_name");
    cookieStore.delete("uam_expected_otp");

    return NextResponse.json({
      success: true,
      message: backendData?.message || "Verification successful. Welcome back!",
      accessToken: String(accessToken),
      user: {
        name: userName,
        email: userEmail,
        role: userRole,
        initials,
      },
    });
  } catch (err: unknown) {
    const safeErrorMsg = err instanceof Error ? err.message : "Unexpected error";
    console.error("[Verify OTP API] Error:", safeErrorMsg);
    return NextResponse.json(
      {
        success: false,
        message:
          "An unexpected error occurred during verification. Please try again.",
      },
      { status: 500 },
    );
  }
}
