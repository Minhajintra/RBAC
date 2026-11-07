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

export async function GET(request: Request) {
  const cookieStore = await cookies();

  try {
    // 1. Resolve token from Authorization header or secure HTTP-only cookies
    let token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      token =
        cookieStore.get("uam_auth_token")?.value ||
        cookieStore.get("token")?.value ||
        cookieStore.get("access_token")?.value;
    }

    if (!token || token === "null" || token === "undefined") {
      return NextResponse.json(
        { success: false, user: null, message: "Unauthenticated session." },
        { status: 401 },
      );
    }

    // 2. Extract claims from token payload if available
    const jwtPayload = decodeJwtPayload(token);
    if (jwtPayload && typeof jwtPayload.exp === "number") {
      if (Date.now() >= jwtPayload.exp * 1000) {
        return NextResponse.json(
          { success: false, user: null, message: "Session token has expired. Please log in again." },
          { status: 401 },
        );
      }
    }

    const email =
      cookieStore.get("uam_user_email")?.value ||
      (typeof jwtPayload?.email === "string" ? jwtPayload.email : "") ||
      (typeof jwtPayload?.sub === "string" && jwtPayload.sub.includes("@") ? jwtPayload.sub : "") ||
      (typeof jwtPayload?.sub === "string" ? `${jwtPayload.sub}@intraship.com` : "user@intraship.com");

    const storedName = cookieStore.get("uam_user_name")?.value;
    let name =
      storedName ||
      (typeof jwtPayload?.name === "string" ? jwtPayload.name : "") ||
      (typeof jwtPayload?.sub === "string" ? jwtPayload.sub : "") ||
      (email.includes("@") ? email.split("@")[0] : email);

    let role =
      cookieStore.get("uam_user_role")?.value ||
      (typeof jwtPayload?.role === "string" ? jwtPayload.role : "") ||
      (typeof jwtPayload?.user_role === "string" ? jwtPayload.user_role : "") ||
      "Administrator";

    // 3. Optional backend profile enrichment if backend supports it
    const backendBaseUrl = getBaseUrl();
    if (backendBaseUrl && token) {
      try {
        const backendRes = await axios.get(`${backendBaseUrl}/api/v1/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          timeout: 2500,
        });

        if (backendRes.status >= 200 && backendRes.status < 300 && backendRes.data) {
          const bData = (backendRes.data?.data || backendRes.data?.user || backendRes.data) as Record<string, unknown>;
          const bName = String(
            bData.name ||
              bData.full_name ||
              bData.fullName ||
              (bData.first_name ? `${bData.first_name} ${bData.last_name || ""}`.trim() : "") ||
              bData.username ||
              "",
          ).trim();
          const bRole = String(bData.role || bData.role_name || bData.user_role || "").trim();

          if (bName) name = bName;
          if (bRole) role = bRole;
        }
      } catch {
        // Backend /api/v1/auth/me is not in FastAPI contract; smoothly fallback to cookie/JWT state
      }
    }

    const initials =
      name
        .split(" ")
        .filter(Boolean)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || (name[0] || "U").toUpperCase();

    return NextResponse.json({
      success: true,
      user: {
        name,
        email,
        role,
        initials,
      },
      accessToken: token,
      hasActiveToken: true,
    });
  } catch (error: unknown) {
    const safeErrorMsg = error instanceof Error ? error.message : "Session check failed.";
    console.error("[Session Lookup API] Error:", safeErrorMsg);
    return NextResponse.json(
      { success: false, message: "Session check failed." },
      { status: 500 },
    );
  }
}
