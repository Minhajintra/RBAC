import React from "react";
import { getUsers } from "./actions/getUsers";
import { getUserStats } from "./actions/getUserStats";
import UsersModule from "./components/UsersModule";
import { checkServerRouteAccess } from "@/lib/auth/server-permissions";
import { ForbiddenState } from "@/components/ui/ForbiddenState";

export const metadata = {
  title: "Users Management | IntraShip UAM",
  description: "Manage users, access scopes, and account roles.",
};

/**
 * Users Page Orchestrator (Server Component)
 * Pre-fetches initial user list and statistics before rendering the interactive UsersModule
 */
export default async function UsersPage() {
  const { allowed } = await checkServerRouteAccess("users", "read", "/users");
  if (!allowed) {
    return (
      <div className="p-6">
        <ForbiddenState
          title="Access Denied"
          description="You do not have permission from the backend to view Users Management. Please contact an administrator."
          backHref="/dashboard"
          backLabel="Return to Dashboard"
        />
      </div>
    );
  }

  const [initialData, initialStats] = await Promise.all([
    getUsers({ page: 1, pageSize: 6 }).catch(() => null),
    getUserStats().catch(() => null),
  ]);

  return <UsersModule initialData={initialData} initialStats={initialStats} />;
}
