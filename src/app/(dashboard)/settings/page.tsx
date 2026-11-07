import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSecuritySettingsAction } from "./actions/getSecuritySettings";
import SecuritySettingsModule from "./components/SecuritySettingsModule";
import { ForbiddenState } from "@/components/ui/ForbiddenState";

export const metadata = {
  title: "Security Settings | IntraShip UAM",
  description: "System-wide session and password policy. MFA and device binding are user-level settings.",
};

/**
 * Security Settings Page Orchestrator (Server Component)
 * Validates server session cookies, checks RBAC authorization, and pre-fetches initial mock data
 */
export default async function SecuritySettingsPage() {
  const cookieStore = await cookies();
  const isVerified = cookieStore.get("uam_verified")?.value === "true";
  const token = cookieStore.get("uam_auth_token")?.value;
  const userRole = cookieStore.get("uam_user_role")?.value;

  // Server-side authentication validation
  if (!isVerified || !token) {
    redirect("/login?from=/settings");
  }

  // Server-side role authorization: allow administrators, editors, and managers (client-side RBAC checks isVisible)
  const normRole = (userRole || "").toLowerCase().replace(/[\s_-]+/g, "");
  const isExplicitlyDenied = userRole && (normRole === "viewer" || normRole === "guest");

  if (isExplicitlyDenied) {
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

