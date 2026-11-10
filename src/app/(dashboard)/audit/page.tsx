import React from "react";
import { getAuditLogs } from "./actions/getAuditLogs";
import { getAuditStatsAction } from "./actions/getAuditStats";
import AuditLogsModule from "./components/AuditLogsModule";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { checkServerRouteAccess } from "@/lib/auth/server-permissions";

export const metadata = {
  title: "Audit Logs | IntraShip UAM",
  description: "A traceable history of account activity and workspace access changes.",
};

/**
 * Audit Logs Page Orchestrator (Server Component)
 * Validates authenticated server session, backend RBAC permission, and pre-fetches initial audit data.
 * Gracefully renders ForbiddenState on HTTP 403 without converting to HTTP 500 or crashing.
 */
export default async function AuditLogsPage() {
  const { allowed } = await checkServerRouteAccess("audit", "read", "/audit");
  if (!allowed) {
    return (
      <div className="p-6">
        <ForbiddenState
          title="Access Denied"
          description="Your current role does not have authorization to view Audit Logs. Please contact an administrator."
          backHref="/dashboard"
          backLabel="Return to Dashboard"
        />
      </div>
    );
  }

  let initialEvents = null;
  let initialStats = null;
  let isForbidden = false;

  try {
    const [events, stats] = await Promise.all([
      getAuditLogs(),
      getAuditStatsAction(),
    ]);
    initialEvents = events;
    initialStats = stats;
  } catch (err: unknown) {
    const errObj = err as { status?: number; message?: string };
    if (
      errObj?.status === 403 ||
      /forbidden|permission|access denied|403/i.test(errObj?.message || "")
    ) {
      isForbidden = true;
    }
  }

  if (isForbidden) {
    return (
      <div className="p-6">
        <ForbiddenState
          title="Access Denied"
          description="Your account does not have authorization to view Audit Logs. Please contact an administrator."
          backHref="/dashboard"
          backLabel="Return to Dashboard"
        />
      </div>
    );
  }

  return (
    <AuditLogsModule
      initialEvents={initialEvents}
      initialStats={initialStats}
    />
  );
}
