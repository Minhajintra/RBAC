import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { getBaseUrl } from "@/lib/api/request.interceptor";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    let refreshToken = cookieStore.get("uam_refresh_token")?.value;

    if (!refreshToken) {
      const body = await request.json().catch(() => ({}));
      refreshToken = body?.refresh_token || body?.refreshToken;
    }

    const currentAccessToken =
      cookieStore.get("uam_auth_token")?.value ||
      cookieStore.get("token")?.value ||
      cookieStore.get("access_token")?.value;

    // If no refresh token exists, verify if current session access token is still active and valid
    if (!refreshToken) {
      if (currentAccessToken) {
        const payload = decodeJwtPayload(currentAccessToken);
        const isNotExpired = !payload?.exp || Date.now() < (payload.exp as number) * 1000;
        if (isNotExpired) {
          return NextResponse.json({
            success: true,
            message: "Active session token is still valid.",
            accessToken: currentAccessToken,
          });
        }
      }

      return NextResponse.json(
        {
          success: false,
          message: "No active refresh token found. Please log in again.",
        },
        { status: 401 },
      );
    }

    const backendBaseUrl = getBaseUrl();
    if (!backendBaseUrl) {
      return NextResponse.json(
        { success: false, message: "Backend base URL is not configured." },
        { status: 502 },
      );
    }

    // Call real backend token refresh without attaching an expired Bearer token
    let backendResponse;
    try {
      backendResponse = await axios.post(
        `${backendBaseUrl}/api/v1/auth/token/refresh`,
        { refresh_token: refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 10000,
          validateStatus: () => true,
        },
      );
    } catch (netError: unknown) {
      const safeMsg = netError instanceof Error ? netError.message : "Network error";
      console.error("[Refresh API] Token refresh network error:", safeMsg);
      return NextResponse.json(
        {
          success: false,
          message: "Unable to contact token refresh service.",
        },
        { status: 502 },
      );
    }

    const isSuccess =
      backendResponse.status >= 200 && backendResponse.status < 300;
    const backendData = backendResponse.data;
    const isProduction = process.env.NODE_ENV === "production";

    if (!isSuccess) {
      // Invalidate refresh token if backend rejected it
      cookieStore.delete("uam_refresh_token");

      // Only invalidate access session if access token is also expired
      if (currentAccessToken) {
        const payload = decodeJwtPayload(currentAccessToken);
        const isExpired = payload?.exp && Date.now() >= (payload.exp as number) * 1000;
        if (isExpired) {
          cookieStore.delete("uam_auth_token");
          cookieStore.delete("uam_verified");
        }
      }

      return NextResponse.json(
        {
          success: false,
          message:
            backendData?.detail ||
            backendData?.message ||
            "Session has expired. Please log in again.",
        },
        { status: 401 },
      );
    }

    const newAccessToken =
      backendData?.data?.access_token ||
      backendData?.access_token ||
      backendData?.data?.token ||
      backendData?.data?.accessToken;

    const newRefreshToken =
      backendData?.data?.refresh_token ||
      backendData?.refresh_token ||
      backendData?.data?.refreshToken;

    if (!newAccessToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Backend did not return a valid access token.",
        },
        { status: 502 },
      );
    }

    cookieStore.set("uam_auth_token", String(newAccessToken), {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    if (newRefreshToken) {
      cookieStore.set("uam_refresh_token", String(newRefreshToken), {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    return NextResponse.json({
      success: true,
      message: backendData?.message || "Token refreshed successfully.",
      accessToken: String(newAccessToken),
    });
  } catch (err: unknown) {
    const safeMsg = err instanceof Error ? err.message : "Unexpected error";
    console.error("[Refresh API] Route Error:", safeMsg);
    return NextResponse.json(
      { success: false, message: "Token refresh process failed." },
      { status: 500 },
    );
  }
}
