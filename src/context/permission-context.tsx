"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  MePermissionsResponse,
  CrudPermissions,
} from "@/types/permissions.types";
import { permissionService } from "@/services/permission.service";

interface PermissionContextType {
  permissions: MePermissionsResponse | null;
  isLoading: boolean;
  can: (module: string, action: keyof CrudPermissions | "create" | "read" | "update" | "delete") => boolean;
  isVisible: (module: string) => boolean;
  isEnabled: (module: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(
  undefined,
);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<MePermissionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    try {
      const data = await permissionService.getMyPermissions();
      setPermissions(data);
    } catch (err) {
      console.error("[PermissionProvider] Failed to load permissions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const can = useCallback(
    (
      module: string,
      action: keyof CrudPermissions | "create" | "read" | "update" | "delete",
    ): boolean => {
      // Super admin has unrestricted access across all modules
      const roleNorm = (permissions?.role || "").toLowerCase();
      if (roleNorm.includes("superadmin") || roleNorm === "super admin") {
        return true;
      }

      if (!permissions?.permissions) {
        // Safe default: only read is permitted until backend permissions load
        return action === "read" || action === "can_read";
      }

      const modKey = module.toLowerCase().trim();
      let mod = permissions.permissions[modKey];
      if (!mod) {
        for (const k of Object.keys(permissions.permissions)) {
          if (modKey.includes(k) || k.includes(modKey)) {
            mod = permissions.permissions[k];
            break;
          }
        }
      }

      if (!mod || !mod.crud) return false;

      const key: keyof CrudPermissions = action.startsWith("can_")
        ? (action as keyof CrudPermissions)
        : (`can_${action}` as keyof CrudPermissions);

      return Boolean(mod.crud[key]);
    },
    [permissions],
  );

  const isVisible = useCallback(
    (module: string): boolean => {
      if (!permissions?.permissions) return true;
      const mod = permissions.permissions[module.toLowerCase()];
      if (!mod || !mod.features) return true;
      return mod.features.is_visible !== false;
    },
    [permissions],
  );

  const isEnabled = useCallback(
    (module: string): boolean => {
      if (!permissions?.permissions) return true;
      const mod = permissions.permissions[module.toLowerCase()];
      if (!mod || !mod.features) return true;
      return mod.features.is_enabled !== false;
    },
    [permissions],
  );

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        isLoading,
        can,
        isVisible,
        isEnabled,
        refreshPermissions: fetchPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions(): PermissionContextType {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
}

