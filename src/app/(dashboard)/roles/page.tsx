import React from "react";
import { getRoles, getRolesStats } from "./actions/getRoles";
import RolesPermissionsView from "./components/RolesPermissionsView";
import { checkServerRouteAccess } from "@/lib/auth/server-permissions";
import { ForbiddenState } from "@/components/ui/ForbiddenState";

export const metadata = {
  title: "Roles & Permissions | IntraShip UAM",
  description: "Define who can do what, with clear and consistent access policies.",
};

/**
 * Roles & Permissions Page (FG-UAM-14)
 * Strictly dynamic - powered directly by the Backend API
 */
export default async function RolesPage() {
  const { allowed } = await checkServerRouteAccess("roles", "read", "/roles");
  if (!allowed) {
    return (
      <div className="p-6">
        <ForbiddenState
          title="Access Denied"
          description="You do not have permission from the backend to view Roles & Permissions. Please contact an administrator."
          backHref="/dashboard"
          backLabel="Return to Dashboard"
        />
      </div>
    );
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
