import React from "react";
import { getDashboardKpis } from "./actions/getDashboardKpis";
import { getRoleUsers } from "./actions/getRoleUsers";
import { getLoginAttempts } from "./actions/getLoginAttempts";
import { getInterfaceAccess } from "./actions/getInterfaceAccess";
import { getLoginHistory } from "./actions/getLoginHistory";
import { getSecurityOverview } from "./actions/getSecurityOverview";

import PageHeader from "./components/PageHeader";
import KpiCardsGrid from "./components/cards/KpiCardsGrid";
import LoginAttemptsChart from "./components/charts/LoginAttemptsChart";
import RoleUsersChart from "./components/charts/RoleUsersChart";
import InterfaceAccessChart from "./components/charts/InterfaceAccessChart";
import SecurityWidget from "./components/SecurityWidget";
import LoginHistoryTable from "./components/tables/LoginHistoryTable";

export const metadata = {
  title: "Dashboard | IntraShip UAM",
  description: "User Access Management analytics, security overview, and activity tracking.",
};

/**
 * Dashboard Page Orchestrator (Server Component)
 * Fetches dashboard data concurrently and passes it to presentation components
 */
export default async function DashboardPage() {
  const [
    kpis,
    roleUsers,
    loginAttempts,
    interfaceAccess,
    loginHistory,
    securityOverview,
  ] = await Promise.all([
    getDashboardKpis().catch(() => []),
    getRoleUsers().catch(() => null),
    getLoginAttempts("daily").catch(() => null),
    getInterfaceAccess().catch(() => null),
    getLoginHistory().catch(() => null),
    getSecurityOverview().catch(() => null),
  ]);

  const processedKpis = (kpis || []).filter((item) => item && item.value !== null);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header with Greeting and Date */}
      <PageHeader />

      {/* KPI Cards Summary Grid */}
      <section aria-label="Key Performance Indicators">
        <KpiCardsGrid data={processedKpis} />
      </section>

      {/* Bar and Donut Charts */}
      <section
        aria-label="Login Attempts and Role Distribution"
        className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5"
      >
        <div className="lg:col-span-3">
          <LoginAttemptsChart data={loginAttempts} />
        </div>

        <div className="lg:col-span-2">
          <RoleUsersChart data={roleUsers} />
        </div>
      </section>

      {/* Traffic Breakdown & Security Policy Overview */}
      <section
        aria-label="Interface Access and Security Policy"
        className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5"
      >
        <div className="lg:col-span-3">
          <InterfaceAccessChart data={interfaceAccess} />
        </div>

        <div className="lg:col-span-2">
          <SecurityWidget data={securityOverview} />
        </div>
      </section>

      {/* Login History Audit Table */}
      <section aria-label="Login History Audit Table">
        <LoginHistoryTable data={loginHistory} />
      </section>
    </div>
  );
}
