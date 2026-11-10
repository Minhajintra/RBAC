import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api/api-client";
import { CrudPermissions } from "@/types/permissions.types";
import {
  isSuperAdminRole,
  resolvePermissionsFromBackendData,
} from "@/lib/auth/permission-mapper";

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

export type RouteAction = "read" | "create" | "update" | "delete" | "any_write";

/**
 * Server-side route permission check backed directly by backend API roles,
 * role permissions, and sidebar navigation.
 * Redirects to /login if session is unauthenticated.
 */
export async function checkServerRouteAccess(
  moduleName: string,
  action: RouteAction = "read",
  fromPath?: string,
): Promise<{ allowed: boolean; role: string }> {
  const cookieStore = await cookies();
  const isVerified = cookieStore.get("uam_verified")?.value === "true";
  const token =
    cookieStore.get("uam_auth_token")?.value ||
    cookieStore.get("token")?.value ||
    cookieStore.get("access_token")?.value;

  if (!isVerified || !token || token === "null" || token === "undefined") {
    const target = fromPath ? `/login?from=${encodeURIComponent(fromPath)}` : "/login";
    redirect(target);
  }

  const jwtPayload = decodeJwtPayload(token);
  let userRole =
    cookieStore.get("uam_user_role")?.value ||
    (typeof jwtPayload?.role === "string" ? jwtPayload.role : "") ||
    (typeof jwtPayload?.user_role === "string" ? jwtPayload.user_role : "");
  let userRoleId = (jwtPayload?.role_id ?? jwtPayload?.roleId) as string | number | undefined;
  const userId = String(
    cookieStore.get("uam_user_email")?.value ||
      (typeof jwtPayload?.email === "string" ? jwtPayload.email : "") ||
      (typeof jwtPayload?.sub === "string" ? jwtPayload.sub : "") ||
      "current-user",
  );

  // Enrich role from backend /api/v1/auth/me if missing
  if (!userRole) {
    try {
      const meRes = await apiClient
        .get<Record<string, unknown>>("/api/v1/auth/me", { timeout: 2500 })
        .catch(() => null);
      const bData = (meRes?.data || meRes?.user || meRes) as Record<string, unknown> | null;
      if (bData && typeof bData === "object") {
        userRole = String(bData.role || bData.role_name || bData.user_role || "").trim();
        userRoleId = (bData.role_id ?? bData.roleId ?? userRoleId) as string | number | undefined;
      }
    } catch {
      // ignore if backend /api/v1/auth/me not implemented
    }
  }

  if (isSuperAdminRole(userRole)) {
    return { allowed: true, role: userRole || "Super Admin" };
  }

  const [rolesRes, sidebarRes] = await Promise.all([
    apiClient.get<Record<string, unknown>>("/api/v1/roles/all", { timeout: 5000 }).catch(() => null),
    apiClient.get<Record<string, unknown>>("/api/v1/navigation/sidebar", { timeout: 5000 }).catch(() => null),
  ]);

  const resolved = await resolvePermissionsFromBackendData({
    userId,
    userRole,
    userRoleId,
    rolesRes,
    sidebarRes,
    fetchRolePermissions: (roleId) =>
      apiClient.get<Record<string, unknown>>(`/api/v1/roles/${roleId}/permissions`, { timeout: 5000 }),
  });

  if (!resolved?.permissions) {
    // If backend permissions couldn't be resolved at all, keep non-write read routes conservative
    return { allowed: false, role: userRole };
  }

  const modKey = moduleName.toLowerCase().trim();
  const mod = resolved.permissions[modKey];
  if (!mod) {
    return { allowed: false, role: userRole };
  }

  if (mod.features?.is_visible === false) {
    return { allowed: false, role: userRole };
  }

  if (action === "any_write") {
    const allowed = Boolean(mod.crud?.can_create || mod.crud?.can_update || mod.crud?.can_delete);
    return { allowed, role: userRole };
  }

  const crudKey = `can_${action}` as keyof CrudPermissions;
  return { allowed: Boolean(mod.crud?.[crudKey]), role: userRole };
}
