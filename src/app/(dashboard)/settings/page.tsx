import React from "react";
import { getSecuritySettingsAction } from "./actions/getSecuritySettings";
import SecuritySettingsModule from "./components/SecuritySettingsModule";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { checkServerRouteAccess } from "@/lib/auth/server-permissions";

export const metadata = {
  title: "Security Settings | IntraShip UAM",
  description: "System-wide session and password policy. MFA and device binding are user-level settings.",
};

/**
 * Security Settings Page Orchestrator (Server Component)
 * Validates server session cookies, checks backend RBAC authorization, and pre-fetches settings data
 */
export default async function SecuritySettingsPage() {
  const { allowed } = await checkServerRouteAccess("settings", "read", "/settings");

  if (!allowed) {
    return (
      <div className="p-6">
        <ForbiddenState
          title="Access Denied"
          description="Your current role does not have authorization to view or configure Security Settings. Please contact an IntraShip administrator."
          backHref="/dashboard"
          backLabel="Return to Dashboard"
        />
      </div>
    );
  }

  const { settings, passwordPolicy } = await getSecuritySettingsAction();

  return (
    <SecuritySettingsModule
      initialSettings={settings}
      initialPasswordPolicy={passwordPolicy}
    />
  );
}

