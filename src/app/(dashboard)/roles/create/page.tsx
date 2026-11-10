import React from "react";
import { getRoles } from "../actions/getRoles";
import CreateEditRoleView from "../components/CreateEditRoleView";
import { checkServerRouteAccess, RouteAction } from "@/lib/auth/server-permissions";
import { ForbiddenState } from "@/components/ui/ForbiddenState";

export const metadata = {
  title: "Create & Edit Role | IntraShip UAM",
  description: "Define a new role or update role details and assigned permissions.",
};

interface CreateRolePageProps {
  searchParams?: Promise<{ id?: string; mode?: string }>;
}

/**
 * Create & Edit Role Page (FG-UAM-13)
 * Provides comprehensive role creation and editing with granular permission management.
 */
export default async function CreateRolePage({ searchParams }: CreateRolePageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const mode = resolvedParams.mode;
  const requiredAction: RouteAction =
    mode === "create"
      ? "create"
      : mode === "edit"
        ? "update"
        : mode === "delete"
          ? "delete"
          : "any_write";

  const { allowed } = await checkServerRouteAccess("roles", requiredAction, "/roles/create");
  if (!allowed) {
    return (
      <div className="p-6">
        <ForbiddenState
          title="Access Denied"
          description="You do not have permission from the backend to create, edit, or delete roles. Please contact an administrator."
          backHref="/roles"
          backLabel="Back to Roles"
        />
      </div>
    );
  }

  const roles = await getRoles().catch(() => []);

  return (
    <CreateEditRoleView
      initialRoles={roles}
      initialSelectedRoleId={resolvedParams.id}
    />
  );
}
