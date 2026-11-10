"use client";

import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/context/permission-context";
import { ForbiddenState } from "./ForbiddenState";

interface RoutePermissionGuardProps {
  children: ReactNode;
}

const ROUTE_MODULE_RULES: Array<{
  prefix: string;
  module: string;
  mode?: "create_or_edit" | "update" | "read";
}> = [
  { prefix: "/roles/create", module: "roles", mode: "create_or_edit" },
  { prefix: "/roles/edit", module: "roles", mode: "update" },
  { prefix: "/roles", module: "roles", mode: "read" },
  { prefix: "/users", module: "users", mode: "read" },
  { prefix: "/audit", module: "audit", mode: "read" },
  { prefix: "/settings", module: "settings", mode: "read" },
  { prefix: "/system-settings", module: "settings", mode: "read" },
  { prefix: "/dashboard", module: "dashboard", mode: "read" },
];

export function RoutePermissionGuard({ children }: RoutePermissionGuardProps) {
  const pathname = usePathname() || "";
  const { isLoading, can, isVisible } = usePermissions();

  if (isLoading) {
    return <>{children}</>;
  }

  const rule = ROUTE_MODULE_RULES.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
  );

  if (!rule) {
    return <>{children}</>;
  }

  const visible = isVisible(rule.module);
  let hasActionAccess = false;

  if (rule.mode === "create_or_edit") {
    hasActionAccess =
      can(rule.module, "create") ||
      can(rule.module, "update") ||
      can(rule.module, "delete");
  } else if (rule.mode === "update") {
    hasActionAccess = can(rule.module, "update");
  } else {
    hasActionAccess = can(rule.module, "read");
  }

  if (!visible || !hasActionAccess) {
    return (
      <div className="p-6">
        <ForbiddenState
          title="Access Denied"
          description="You do not have permission from the backend to view or access this page. Please contact an administrator."
          backHref="/dashboard"
          backLabel="Return to Dashboard"
        />
      </div>
    );
  }

  return <>{children}</>;
}

export default RoutePermissionGuard;
