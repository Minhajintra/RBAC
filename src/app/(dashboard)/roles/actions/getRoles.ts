"use server";

import { apiClient } from "@/lib/api/api-client";
import { ROLES_ROUTES } from "../constants/role.constants";
import { RoleItem, RolesPageStats } from "../types/role.types";
import {
  BackendPermissionItem,
  NavMap,
  extractBackendPermissions,
  buildMatrixFromBackendPermissions,
  buildPermissionEntries,
} from "../utils/roleMatrix.utils";

/**
 * Fetches sidebar navigation items from backend and builds a UUID → label map.
 * This is used to resolve nav_id UUIDs in permissions to human-readable names.
 */
async function fetchNavMap(): Promise<NavMap> {
  const navMap: NavMap = {};
  try {
    const sidebarResponse = await apiClient.get<Record<string, unknown>>(
      ROLES_ROUTES.SIDEBAR,
      { timeout: 5000 },
    );

    // Extract array of nav items from response envelope
    const items = Array.isArray(sidebarResponse)
      ? sidebarResponse
      : Array.isArray(sidebarResponse?.data)
        ? (sidebarResponse.data as Record<string, unknown>[])
        : Array.isArray((sidebarResponse?.data as Record<string, unknown>)?.items)
          ? ((sidebarResponse?.data as Record<string, unknown>).items as Record<string, unknown>[])
          : [];

    for (const item of items as Record<string, unknown>[]) {
      const id = String(item.id ?? item.key ?? "").trim();
      const label = String(
        item.label ?? item.title ?? item.name ?? "",
      ).trim();
      if (id && label) {
        navMap[id] = label;
      }

      // Also process children if present
      const children = Array.isArray(item.children)
        ? item.children
        : Array.isArray(item.sub_items)
          ? item.sub_items
          : [];
      for (const child of children as Record<string, unknown>[]) {
        const childId = String(child.id ?? child.key ?? "").trim();
        const childLabel = String(
          child.label ?? child.title ?? child.name ?? "",
        ).trim();
        if (childId && childLabel) {
          navMap[childId] = childLabel;
        }
      }
    }
  } catch {
    // Sidebar fetch failed — navMap will be empty, fallback logic kicks in
  }
  return navMap;
}

/**
 * Server Action to fetch all roles dynamically from real backend API: GET /api/v1/roles/all
 * Strictly dynamic - no static mock data.
 */
export async function getRoles(): Promise<RoleItem[]> {
  try {
    const [rolesResponse, usersResponse, navMap] = await Promise.all([
      apiClient.get<Record<string, unknown>>(ROLES_ROUTES.ALL),
      apiClient.get<Record<string, unknown>>(ROLES_ROUTES.USERS_LIST).catch(() => null),
      fetchNavMap(),
    ]);

    // 1. Extract backend roles
    const rawRoles = Array.isArray(rolesResponse)
      ? rolesResponse
      : Array.isArray(rolesResponse?.data)
        ? (rolesResponse.data as Record<string, unknown>[])
        : Array.isArray((rolesResponse?.data as Record<string, unknown>)?.items)
          ? ((rolesResponse?.data as Record<string, unknown>).items as Record<string, unknown>[])
          : Array.isArray((rolesResponse?.data as Record<string, unknown>)?.roles)
            ? ((rolesResponse?.data as Record<string, unknown>).roles as Record<string, unknown>[])
            : [];

    // 2. Extract backend users for dynamic role counts
    const rawUsers = Array.isArray(usersResponse)
      ? usersResponse
      : Array.isArray(usersResponse?.data)
        ? (usersResponse.data as Record<string, unknown>[])
        : Array.isArray((usersResponse?.data as Record<string, unknown>)?.items)
          ? ((usersResponse?.data as Record<string, unknown>).items as Record<string, unknown>[])
          : [];

    // Map user counts per role_id, role code, and role name (from API user response)
    const roleUserCounts: Record<string, number> = {};
    for (const u of rawUsers) {
      if (u.role_id !== undefined && u.role_id !== null) {
        const idKey = `id_${u.role_id}`;
        roleUserCounts[idKey] = (roleUserCounts[idKey] || 0) + 1;
      }
      const rCode = String(u.role || "").toLowerCase().trim();
      const rName = String(u.role_name || "").toLowerCase().trim();
      if (rCode) {
        roleUserCounts[rCode] = (roleUserCounts[rCode] || 0) + 1;
        roleUserCounts[rCode.replace(/[\s_-]+/g, "")] = (roleUserCounts[rCode.replace(/[\s_-]+/g, "")] || 0) + 1;
      }
      if (rName) {
        roleUserCounts[rName] = (roleUserCounts[rName] || 0) + 1;
        roleUserCounts[rName.replace(/[\s_-]+/g, "")] = (roleUserCounts[rName.replace(/[\s_-]+/g, "")] || 0) + 1;
      }
    }

    // 3. Map into strongly-typed dynamic RoleItems with permissions fetched from backend
    const dynamicRoles: RoleItem[] = await Promise.all(
      rawRoles.map(async (item, index) => {
        const id = item.id !== undefined ? item.id : item.role_id !== undefined ? item.role_id : index + 1;
        const name = String(item.role_name || item.name || `Role ${id}`);
        const code = String(item.code || "").toLowerCase().trim();
        const description = String(item.description || `Role configuration for ${name}`);
        const isDefault = Boolean(
          item.is_default ||
          item.is_system ||
          name.toLowerCase() === "admin" ||
          name.toLowerCase() === "administrator" ||
          name.toLowerCase() === "super admin" ||
          name.toLowerCase() === "super_admin" ||
          code === "super_admin",
        );
        const isActive = item.is_active !== undefined ? Boolean(item.is_active) : true;

        // Match user count by role_id, code, or name
        const idKey = `id_${id}`;
        const normCode = code.replace(/[\s_-]+/g, "");
        const normName = name.toLowerCase().replace(/[\s_-]+/g, "");

        const userCount =
          roleUserCounts[idKey] !== undefined
            ? roleUserCounts[idKey]
            : roleUserCounts[code] !== undefined
              ? roleUserCounts[code]
              : roleUserCounts[normCode] !== undefined
                ? roleUserCounts[normCode]
                : roleUserCounts[name.toLowerCase().trim()] !== undefined
                  ? roleUserCounts[name.toLowerCase().trim()]
                  : roleUserCounts[normName] !== undefined
                    ? roleUserCounts[normName]
                    : Number(item.user_count || 0);

        let permsArray: BackendPermissionItem[] = [];
        if (Array.isArray(item.permissions) && item.permissions.length > 0) {
          permsArray = item.permissions;
        } else if (
          Array.isArray((item as Record<string, unknown>).role_permissions) &&
          ((item as Record<string, unknown>).role_permissions as unknown[]).length > 0
        ) {
          permsArray = (item as Record<string, unknown>).role_permissions as BackendPermissionItem[];
        } else {
          try {
            const numId = parseInt(String(id).replace(/\D/g, ""), 10) || id;
            const rolePerms = await apiClient.get<Record<string, unknown>>(
              ROLES_ROUTES.PERMISSIONS(numId),
              { timeout: 4000 },
            );
            permsArray = extractBackendPermissions(rolePerms);
          } catch {
            permsArray = [];
          }
        }

        const matrix = buildMatrixFromBackendPermissions(permsArray, name, isDefault, navMap);
        const permissions = buildPermissionEntries(permsArray, name, navMap);

      const lastUpdated = item.updated_at
        ? new Date(String(item.updated_at)).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : item.created_at
          ? new Date(String(item.created_at)).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "Synchronized with Backend API";

      return {
        id: String(id),
        name,
        description,
        is_default: isDefault,
        is_active: isActive,
        user_count: userCount,
        callout_title: `Manage ${name} access policies`,
        callout_desc:
          description ||
          `Configured permissions and operational scopes for ${name} role.`,
        last_updated: lastUpdated,
        matrix,
        permissions,
        raw_permissions: permsArray as unknown as Record<string, unknown>[],
      };
    }),
  );

    return dynamicRoles;
  } catch (err: unknown) {
    console.warn("[getRoles] Real backend roles fetch error:", err);
    return [];
  }
}

/**
 * Server Action to fetch aggregate statistics directly from Backend API
 */
export async function getRolesStats(roles: RoleItem[]): Promise<RolesPageStats> {
  let totalUsers = 0;
  try {
    const usersResponse = await apiClient
      .get<Record<string, unknown>>(ROLES_ROUTES.USERS_LIST)
      .catch(() => null);

    const rawUsers = Array.isArray(usersResponse)
      ? usersResponse
      : Array.isArray(usersResponse?.data)
        ? (usersResponse.data as Record<string, unknown>[])
        : Array.isArray((usersResponse?.data as Record<string, unknown>)?.items)
          ? ((usersResponse?.data as Record<string, unknown>).items as Record<string, unknown>[])
          : [];

    totalUsers = rawUsers.length > 0
      ? rawUsers.length
      : Number(
          (usersResponse?.data as Record<string, unknown>)?.total ||
          usersResponse?.total ||
          roles.reduce((sum, r) => sum + (r.user_count || 0), 0),
        );
  } catch {
    totalUsers = roles.reduce((sum, r) => sum + (r.user_count || 0), 0);
  }

  const activeRolesCount = roles.filter((r) => r.is_active !== false).length;
  const defaultRolesCount = roles.filter((r) => r.is_default).length;
  const customRolesCount = Math.max(0, roles.length - defaultRolesCount);

  return {
    totalRoles: roles.length,
    activeRolesCount,
    defaultRolesCount,
    customRolesCount,
    totalUsers,
  };
}
