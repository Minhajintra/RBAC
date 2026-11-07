import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { postToBackend, BackendResponseEnvelope, getBaseUrl } from "@/lib/api-client";
import { logBackendErrorToTerminal } from "@/lib/api/backend-logger";

// Module endpoints for authentication
const BACKEND_LOGIN_ENDPOINTS = [
  "/api/v1/auth/login",
];

const BACKEND_OTP_SEND_ENDPOINTS = [
  "/api/v1/auth/otp/send",
];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter both email/username and password.",
        },
        { status: 400 },
      );
    }

    // Capture incoming client headers to forward real device and IP details to backend
    const userAgent = request.headers.get("user-agent") || "";
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "";

    const forwardHeaders: Record<string, string> = {};
    if (userAgent) forwardHeaders["User-Agent"] = userAgent;
    if (clientIp) forwardHeaders["X-Forwarded-For"] = clientIp;

    // 1. Authenticate user credentials against real backend API directly
    let loginResponse;
    try {
      loginResponse = await postToBackend(
        BACKEND_LOGIN_ENDPOINTS,
        {
          email_or_username: String(identifier).trim(),
          password: String(password),
        },
        { headers: forwardHeaders },
      );
    } catch (err: unknown) {
      const apiErr = err as {
        status?: number;
        message?: string;
        data?: Record<string, unknown>;
        response?: { status?: number; data?: Record<string, unknown> };
      };

      const status = apiErr.status || apiErr.response?.status || 502;
      const responseData = (apiErr.data || apiErr.response?.data) as Record<string, unknown> | undefined;

      let msg = "Invalid email/username or password. Please try again.";
      const detail = responseData?.detail || responseData?.message;
      if (typeof detail === "string") {
        msg = detail;
      } else if (Array.isArray(detail) && detail[0]?.msg) {
        msg = String(detail[0].msg);
      }

      if (status === 400 || status === 401 || status === 403) {
        return NextResponse.json(
          { success: false, message: msg },
          { status: 401 },
        );
      }

      if (status === 404) {
        return NextResponse.json(
          { success: false, message: msg || "User not found. Please check your credentials." },
          { status: 404 },
        );
      }

      if (status === 422) {
        return NextResponse.json(
          { success: false, message: msg || "Invalid email/username format. Please check your inputs." },
          { status: 422 },
        );
      }

      // Backend server is offline or returned 5xx error
      logBackendErrorToTerminal({
        action: "User Login Authentication",
        endpoint: BACKEND_LOGIN_ENDPOINTS.join(" | "),
        baseUrl: getBaseUrl(),
        status: status >= 500 ? status : 502,
        message: "Backend server is offline or unreachable.",
      });

      return NextResponse.json(
        {
          success: false,
          message: "Unable to establish connection to the backend server. Please verify the backend service is running.",
        },
        { status: status >= 500 ? status : 502 },
      );
    }

    const loginData = loginResponse?.data as BackendResponseEnvelope | undefined;
    const isSuccess = Boolean(
      loginResponse &&
      loginResponse.status >= 200 &&
      loginResponse.status < 300 &&
      loginData?.success !== false,
    );

    if (!isSuccess) {
      const detail = loginData?.detail || loginData?.message;
      const msg = typeof detail === "string" ? detail : "Invalid email/username or password. Please try again.";
      return NextResponse.json(
        { success: false, message: msg },
        { status: 401 },
      );
    }

    // 2. Identify email and token for Multi-Factor Authentication (OTP)
    const rawIdentifier = String(identifier).trim();
    const authorizedEmail: string = String(
      loginData?.data?.email ||
        loginData?.data?.user?.email ||
        loginData?.user?.email ||
        loginData?.email ||
        (rawIdentifier.includes("@") ? rawIdentifier : ""),
    ).trim();

    if (!authorizedEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "User account does not have a verified email address for OTP verification.",
        },
        { status: 400 },
      );
    }

    const pendingToken =
      loginData?.data?.access_token ||
      loginData?.access_token ||
      loginData?.data?.token ||
      loginData?.token ||
      loginData?.data?.accessToken ||
      loginData?.accessToken;

    const pendingRefreshToken =
      loginData?.data?.refresh_token ||
      loginData?.refresh_token ||
      loginData?.data?.refreshToken ||
      loginData?.refreshToken;

    const backendUser =
      (loginData?.data?.user as Record<string, unknown> | undefined) ||
      (loginData?.user as Record<string, unknown> | undefined) ||
      (loginData?.data as Record<string, unknown> | undefined) ||
      {};

    const loginDataObj = loginData as Record<string, unknown> | undefined;

    const candidateRole = String(
      backendUser.role ||
        backendUser.role_name ||
        backendUser.user_role ||
        loginData?.data?.role ||
        loginDataObj?.role ||
        "",
    ).trim();

    const candidateName = String(
      backendUser.name ||
        backendUser.full_name ||
        backendUser.fullName ||
        (backendUser.first_name
          ? `${backendUser.first_name} ${backendUser.last_name || ""}`.trim()
          : "") ||
        backendUser.username ||
        loginData?.data?.name ||
        loginData?.data?.username ||
        "",
    ).trim();

    // 3. Multi-Factor Authentication (OTP): Always dispatch OTP to registered email
    let otpDispatchMessage = "A verification code has been dispatched to your email address.";
    try {
      const otpHeaders: Record<string, string> = { ...forwardHeaders };
      if (pendingToken) {
        otpHeaders.Authorization = `Bearer ${pendingToken}`;
      }

      let otpResponse;
      try {
        otpResponse = await postToBackend(
          BACKEND_OTP_SEND_ENDPOINTS,
          {
            email: authorizedEmail,
          },
          { headers: otpHeaders },
        );
      } catch (authErr: unknown) {
        const hErr = authErr as { status?: number; response?: { status?: number } };
        const hStatus = hErr.status || hErr.response?.status;
        if ((hStatus === 401 || hStatus === 403 || hStatus === 422) && pendingToken) {
          otpResponse = await postToBackend(
            BACKEND_OTP_SEND_ENDPOINTS,
            {
              email: authorizedEmail,
            },
            { headers: forwardHeaders },
          );
        } else {
          throw authErr;
        }
      }

      if (otpResponse?.data?.message) {
        otpDispatchMessage = String(otpResponse.data.message);
      }
    } catch (otpErr: unknown) {
      const errWithStatus = otpErr as {
        status?: number;
        response?: { status?: number; data?: Record<string, unknown> };
        data?: Record<string, unknown>;
      };
      const otpStatus = errWithStatus?.status || errWithStatus?.response?.status || 500;
      const otpData = (errWithStatus?.data || errWithStatus?.response?.data) as Record<string, unknown> | undefined;
      const otpDetail = otpData?.detail || otpData?.message;
      const otpMsg =
        typeof otpDetail === "string"
          ? otpDetail
          : Array.isArray(otpDetail) && otpDetail[0]?.msg
            ? String(otpDetail[0].msg)
            : "";

      // If backend already dispatched or pending
      if (
        otpMsg.toLowerCase().includes("already") ||
        otpMsg.toLowerCase().includes("sent") ||
        otpMsg.toLowerCase().includes("pending") ||
        otpMsg.toLowerCase().includes("success")
      ) {
        otpDispatchMessage = otpMsg || "Verification code dispatched.";
      } else if (otpStatus >= 400 && otpStatus < 500) {
        return NextResponse.json(
          {
            success: false,
            message: otpMsg || "Failed to dispatch verification code. Please check your credentials.",
          },
          { status: otpStatus },
        );
      } else {
        logBackendErrorToTerminal({
          action: "OTP Dispatch (Login Flow)",
          endpoint: BACKEND_OTP_SEND_ENDPOINTS.join(" | "),
          baseUrl: getBaseUrl(),
          status: otpStatus >= 500 ? otpStatus : 502,
          message: "OTP dispatch service unavailable.",
        });
        return NextResponse.json(
          {
            success: false,
            message: "Verification code service is currently unreachable. Please ensure the backend is running.",
          },
          { status: 502 },
        );
      }
    }

    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === "production";

    // Clear any previous fully authenticated session until OTP is verified
    cookieStore.delete("uam_auth_token");
    cookieStore.delete("uam_verified");

    // 4. Store pending session strictly for Multi-Factor Authentication (OTP)
    cookieStore.set("uam_pending_email", authorizedEmail, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });

    if (pendingToken) {
      cookieStore.set("uam_pending_token", String(pendingToken), {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 15 * 60,
        path: "/",
      });
    }

    if (pendingRefreshToken) {
      cookieStore.set("uam_pending_refresh_token", String(pendingRefreshToken), {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 15 * 60,
        path: "/",
      });
    }

    if (candidateRole) {
      cookieStore.set("uam_pending_role", candidateRole, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 15 * 60,
        path: "/",
      });
    }

    if (candidateName) {
      cookieStore.set("uam_pending_name", candidateName, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 15 * 60,
        path: "/",
      });
    }

    return NextResponse.json({
      success: true,
      requiresOtp: true,
      otpSent: true,
      message: otpDispatchMessage,
      email: authorizedEmail,
    });
  } catch (err: unknown) {
    const safeErrorMsg = err instanceof Error ? err.message : "Unexpected error";
    console.error("[Login API] Error:", safeErrorMsg);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred during login. Please try again.",
      },
      { status: 500 },
    );
  }
}
