"use client";

import React, { ReactNode } from "react";
import { usePermissions } from "@/context/permission-context";

interface PermissionGuardProps {
  module: string;
  action?: "create" | "read" | "update" | "delete";
  feature?: "visible" | "enabled";
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({
  module,
  action,
  feature = "visible",
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { can, isVisible, isEnabled } = usePermissions();

  if (action) {
    if (!can(module, action)) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  if (feature === "visible" && !isVisible(module)) {
    return <>{fallback}</>;
  }

  if (feature === "enabled" && !isEnabled(module)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default PermissionGuard;

