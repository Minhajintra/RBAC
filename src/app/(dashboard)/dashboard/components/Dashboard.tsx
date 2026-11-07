"use client";

import React from "react";
import PageHeader from "./PageHeader";
import KpiCardsGrid from "./cards/KpiCardsGrid";
import LoginAttemptsChart from "./charts/LoginAttemptsChart";
import RoleUsersChart from "./charts/RoleUsersChart";
import InterfaceAccessChart from "./charts/InterfaceAccessChart";
import SecurityWidget from "./SecurityWidget";
import LoginHistoryTable from "./tables/LoginHistoryTable";

/**
 * Dashboard Client Shell
 * Preserved for component composition and backward compatibility
 */
export default function Dashboard() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader />

      <section aria-label="Key Performance Indicators">
        <KpiCardsGrid />
      </section>

      <section
        aria-label="Login Attempts and Role Distribution"
        className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5"
      >
        <div className="lg:col-span-3">
          <LoginAttemptsChart />
        </div>

        <div className="lg:col-span-2">
          <RoleUsersChart />
        </div>
      </section>

      <section
        aria-label="Interface Access and Security Policy"
        className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5"
      >
        <div className="lg:col-span-3">
          <InterfaceAccessChart />
        </div>

        <div className="lg:col-span-2">
          <SecurityWidget />
        </div>
      </section>

      <section aria-label="Login History Audit Table">
        <LoginHistoryTable />
      </section>
    </div>
  );
}
