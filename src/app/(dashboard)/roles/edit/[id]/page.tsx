import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRoles } from "../../actions/getRoles";
import CreateEditRoleView from "../../components/CreateEditRoleView";

export const metadata = {
  title: "Edit Role | IntraShip UAM",
  description: "Update role details and permissions.",
};

interface EditRolePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRolePage({ params }: EditRolePageProps) {
  const cookieStore = await cookies();
  const isVerified = cookieStore.get("uam_verified")?.value === "true";
  const token =
    cookieStore.get("uam_auth_token")?.value ||
    cookieStore.get("uam_pending_token")?.value;

  if (!isVerified || !token) {
    redirect("/login?from=/roles");
  }

  const { id } = await params;
  const roles = await getRoles().catch(() => []);

  return <CreateEditRoleView initialRoles={roles} initialSelectedRoleId={id} />;
}

