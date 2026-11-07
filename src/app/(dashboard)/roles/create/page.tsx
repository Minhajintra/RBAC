import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRoles } from "../actions/getRoles";
import CreateEditRoleView from "../components/CreateEditRoleView";

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
  const cookieStore = await cookies();
  const isVerified = cookieStore.get("uam_verified")?.value === "true";
  const token =
    cookieStore.get("uam_auth_token")?.value ||
    cookieStore.get("token")?.value ||
    cookieStore.get("access_token")?.value ||
    cookieStore.get("uam_pending_token")?.value;

  if (!isVerified || !token) {
    redirect("/login?from=/roles/create");
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const roles = await getRoles().catch(() => []);

  return (
    <CreateEditRoleView
      initialRoles={roles}
      initialSelectedRoleId={resolvedParams.id}
    />
  );
}
