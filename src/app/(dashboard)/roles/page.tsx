import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRoles, getRolesStats } from "./actions/getRoles";
import RolesPermissionsView from "./components/RolesPermissionsView";

export const metadata = {
  title: "Roles & Permissions | IntraShip UAM",
  description: "Define who can do what, with clear and consistent access policies.",
};

/**
 * Roles & Permissions Page (FG-UAM-14)
 * Strictly dynamic - powered directly by the Backend API
 */
export default async function RolesPage() {
  const cookieStore = await cookies();
  const isVerified = cookieStore.get("uam_verified")?.value === "true";
  const token =
    cookieStore.get("uam_auth_token")?.value ||
    cookieStore.get("token")?.value ||
    cookieStore.get("access_token")?.value;

  // Validate server-side session authentication
  if (!isVerified || !token) {
    redirect("/login?from=/roles");
  }

  const roles = await getRoles().catch(() => []);
  const stats = await getRolesStats(roles).catch(() => ({
    totalRoles: roles.length,
    activeRolesCount: roles.filter((r) => r.is_active !== false).length,
    defaultRolesCount: roles.filter((r) => r.is_default).length,
    customRolesCount: Math.max(0, roles.length - roles.filter((r) => r.is_default).length),
    totalUsers: roles.reduce((sum, r) => sum + (r.user_count || 0), 0),
  }));

  return <RolesPermissionsView initialRoles={roles} stats={stats} />;
}
