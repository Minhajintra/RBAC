import React from "react";
import { getRoles } from "../../actions/getRoles";
import CreateEditRoleView from "../../components/CreateEditRoleView";
import { checkServerRouteAccess } from "@/lib/auth/server-permissions";
import { ForbiddenState } from "@/components/ui/ForbiddenState";

export const metadata = {
  title: "Edit Role | IntraShip UAM",
  description: "Update role details and permissions.",
};

interface EditRolePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRolePage({ params }: EditRolePageProps) {
  const { id } = await params;
  const { allowed } = await checkServerRouteAccess("roles", "update", `/roles/edit/${id}`);
  if (!allowed) {
    return (
      <div className="p-6">
        <ForbiddenState
          title="Access Denied"
          description="You do not have permission from the backend to edit roles. Please contact an administrator."
          backHref="/roles"
          backLabel="Back to Roles"
        />
      </div>
    );
  }

  const roles = await getRoles().catch(() => []);

  return <CreateEditRoleView initialRoles={roles} initialSelectedRoleId={id} />;
}

