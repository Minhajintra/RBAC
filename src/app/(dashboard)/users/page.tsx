import React from "react";
import { getUsers } from "./actions/getUsers";
import { getUserStats } from "./actions/getUserStats";
import UsersModule from "./components/UsersModule";

export const metadata = {
  title: "Users Management | IntraShip UAM",
  description: "Manage users, access scopes, and account roles.",
};

/**
 * Users Page Orchestrator (Server Component)
 * Pre-fetches initial user list and statistics before rendering the interactive UsersModule
 */
export default async function UsersPage() {
  const [initialData, initialStats] = await Promise.all([
    getUsers({ page: 1, pageSize: 6 }).catch(() => null),
    getUserStats().catch(() => null),
  ]);

  return <UsersModule initialData={initialData} initialStats={initialStats} />;
}
