import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge Authentication Guard Middleware
 * Protects administrative routes and manages redirects.
 * Validates backend server availability: jab tak backend chal raha hai redirect hojay,
 * jasay hi server band ho wasay hi login page per ajay.
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isVerifiedCookie = request.cookies.get("uam_verified")?.value === "true";
  const authToken = request.cookies.get("uam_auth_token")?.value;
  const isVerified = isVerifiedCookie && Boolean(authToken);

  const hasPendingAuth = Boolean(
    request.cookies.get("uam_pending_email")?.value ||
    request.cookies.get("uam_reset_email")?.value
  );

  const isProtectedRoute =
    path.startsWith("/dashboard") ||
    path.startsWith("/users") ||
    path.startsWith("/roles") ||
    path.startsWith("/audit") ||
    path.startsWith("/settings") ||
    path.startsWith("/system-settings");

  // If not logged in and accessing protected route, redirect to login
  if (isProtectedRoute && !isVerified) {
    return NextResponse.redirect(new URL(`/login?from=${encodeURIComponent(path)}`, request.url));
  }

  // Edge RBAC Route Guards for authenticated users
  if (isVerified) {
    const userRole = request.cookies.get("uam_user_role")?.value?.toLowerCase();
    const normRole = (userRole || "").replace(/[\s_-]+/g, "");

    // Prevent restricted roles from accessing Audit Logs
    if (path.startsWith("/audit") && (normRole === "teacher" || normRole === "guest")) {
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized", request.url));
    }

    // Only block roles that explicitly lack access to Settings (e.g. viewer, guest)
    if (
      (path.startsWith("/settings") || path.startsWith("/system-settings")) &&
      userRole &&
      (normRole === "viewer" || normRole === "guest")
    ) {
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized", request.url));
    }
  }

  // If already logged in and visiting auth pages, redirect to dashboard
  if ((path === "/login" || path === "/verify-otp" || path === "/forgot-password" || path === "/reset-password") && isVerified) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // OTP page must NEVER open unless real backend authentication or password reset has initiated a pending verification session
  if (path.startsWith("/verify-otp") && !hasPendingAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Reset password page must NEVER open unless OTP was verified
  if (path.startsWith("/reset-password") && !request.cookies.get("uam_reset_otp")?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/users",
    "/users/:path*",
    "/roles",
    "/roles/:path*",
    "/audit",
    "/audit/:path*",
    "/settings",
    "/settings/:path*",
    "/login",
    "/verify-otp",
    "/forgot-password",
    "/reset-password",
  ],
};
