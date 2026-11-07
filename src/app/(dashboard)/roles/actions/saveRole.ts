"use server";

import { revalidatePath } from "next/cache";
import { apiClient } from "@/lib/api/api-client";
import { RoleFormData, SaveRoleResult, RolePermissionEntry } from "../types/role.types";
import { roleSchema } from "../schema/roleSchema";
import { ROLES_ROUTES, SYSTEM_RESOURCES } from "../constants/role.constants";
import {
  BackendPermissionItem,
  NavMap,
  DEFAULT_NAV_MAP,
  DEFAULT_REVERSE_NAV_MAP,
  buildPermissionEntries,
} from "../utils/roleMatrix.utils";

/**
 * Aggregates granular permission entries into unique backend PermissionItem items by module nav_id.
 * Resolves screen names (e.g. "Dashboard", "Users") to real backend nav_id UUIDs.
 * Prevents duplicate nav_id entries that violate relational database uniqueness constraints.
 */
function normalizePermissionsPayload(permissions: RolePermissionEntry[]) {
  const resourceMap = new Map<
    string,
    { nav_id: string; read: boolean; create: boolean; update: boolean; delete: boolean }
  >();

  // Initialize base entries for standard resources using their backend UUIDs
  for (const [uuid] of Object.entries(DEFAULT_NAV_MAP)) {
    resourceMap.set(uuid, {
      nav_id: uuid,
      read: false,
      create: false,
      update: false,
      delete: false,
    });
  }

  for (const p of permissions || []) {
    if (!p.name?.trim()) continue;
    // Map "Users.view" -> "Users", "Dashboard.create" -> "Dashboard"
    const rawNav = p.name.includes(".") ? p.name.split(".")[0] : p.name;
    const cleanKey = rawNav.toLowerCase().trim();

    // Resolve to UUID if available in reverse map, else keep cleanKey
    const targetNavId = DEFAULT_REVERSE_NAV_MAP[cleanKey] || cleanKey;

    if (!resourceMap.has(targetNavId)) {
      resourceMap.set(targetNavId, {
        nav_id: targetNavId,
        read: false,
        create: false,
        update: false,
        delete: false,
      });
    }

    const item = resourceMap.get(targetNavId)!;
    const t = p.type?.toLowerCase();
    if (t === "view" || t === "read") item.read = true;
    if (t === "create") item.create = true;
    if (t === "edit" || t === "update") item.update = true;
    if (t === "delete") item.delete = true;
  }

  return Array.from(resourceMap.values());
}

/**
 * Normalizes interface permissions into strictly compliant PermissionItem[] matching OpenAPI contract.
 * Excludes extra UI fields like permission_id or name which cause 422 Unprocessable Entity.
 */
function cleanInterfacePermissions(
  interfacePerms?: Array<{
    nav_id?: string;
    id?: string;
    read?: boolean;
    view?: boolean;
    create?: boolean;
    edit?: boolean;
    update?: boolean;
    delete?: boolean;
    name?: string;
    key?: string;
  }>,
  fallbackEntries?: RolePermissionEntry[],
) {
  const map = new Map<
    string,
    { nav_id: string; read: boolean; create: boolean; update: boolean; delete: boolean }
  >();

  // Initialize base entries for standard resources using their backend UUIDs
  for (const [uuid] of Object.entries(DEFAULT_NAV_MAP)) {
    map.set(uuid, {
      nav_id: uuid,
      read: false,
      create: false,
      update: false,
      delete: false,
    });
  }

  if (interfacePerms && interfacePerms.length > 0) {
    for (const p of interfacePerms) {
      const rawId = p.nav_id || p.id || p.key || p.name || "";
      const cleanKey = rawId.toLowerCase().trim();
      const resolvedNavId = DEFAULT_REVERSE_NAV_MAP[cleanKey] || rawId;

      if (!resolvedNavId) continue;

      map.set(resolvedNavId, {
        nav_id: resolvedNavId,
        read: Boolean(p.read ?? p.view),
        create: Boolean(p.create ?? p.edit),
        update: Boolean(p.update),
        delete: Boolean(p.delete),
      });
    }
    return Array.from(map.values());
  }

  return normalizePermissionsPayload(fallbackEntries || []);
}

/**
 * Server Action to create or update a role via FastAPI Backend API
 */
export async function saveRole(
  roleData: RoleFormData,
  roleId?: string | number,
): Promise<SaveRoleResult> {
  const validation = roleSchema.safeParse({
    name: roleData.name,
    description: roleData.description,
  });

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Please enter a valid role name.",
    };
  }

  const roleName = roleData.name.trim();
  const description = roleData.description?.trim() || "";
  const cleanPermissions = cleanInterfacePermissions(
    roleData.interface_permissions,
    roleData.permissions,
  );

  try {
    let targetRoleId = roleId ? String(roleId) : "";

    if (roleId) {
      // 1. Resolve numerical ID for path parameter in PUT /api/v1/roles/update/{id}
      let numId = parseInt(String(roleId).replace(/\D/g, ""), 10);

      // If ID is a string name (e.g. "asad" or "Programme Admin"), look up real integer role_id from backend
      if (isNaN(numId) || !numId) {
        try {
          const allRoles = await apiClient.get<Record<string, unknown>>(ROLES_ROUTES.ALL);
          const rawList = Array.isArray(allRoles)
            ? allRoles
            : Array.isArray(allRoles?.data)
              ? allRoles.data
              : Array.isArray((allRoles?.data as Record<string, unknown>)?.items)
                ? (allRoles?.data as Record<string, unknown>).items
                : [];

          const match = (rawList as Record<string, unknown>[]).find(
            (r) =>
              String(r.role_name || r.name || "").toLowerCase() === String(roleId).toLowerCase(),
          );
          if (match) {
            numId = Number(match.id ?? match.role_id);
          }
        } catch {
          // fallback
        }
      }

      const finalId = !isNaN(numId) && numId > 0 ? numId : Number(roleId) || roleId;

      // 1. Update basic role metadata (name, description) via PUT /api/v1/roles/update/{id}
      // Schema: RoleUpdateRequest { role_name: string, description?: string }
      await apiClient.put<Record<string, unknown>>(ROLES_ROUTES.UPDATE(finalId), {
        role_name: roleName,
        description: description || null,
      });

      // 2. Overwrite role permissions via PUT /api/v1/roles/{id}/permissions
      // Backend OpenAPI: PUT /api/v1/roles/{id}/permissions - "over write Existing roles ."
      // Schema: RoleCreateRequest { role_id: int, role_name: str, description?: str, permissions: PermissionItem[] }
      if (cleanPermissions && cleanPermissions.length > 0) {
        await apiClient.put<Record<string, unknown>>(ROLES_ROUTES.PERMISSIONS(finalId), {
          role_id: Number(finalId),
          role_name: roleName,
          description: description || `${roleName} role configuration`,
          permissions: cleanPermissions,
        });
      }

      targetRoleId = String(finalId);
    } else {
      // 2. Compute sequential integer role_id from existing roles
      let nextRoleId = 10;
      try {
        const allRoles = await apiClient.get<Record<string, unknown>>(ROLES_ROUTES.ALL);
        const rawList = Array.isArray(allRoles)
          ? allRoles
          : Array.isArray(allRoles?.data)
            ? allRoles.data
            : Array.isArray((allRoles?.data as Record<string, unknown>)?.items)
              ? (allRoles?.data as Record<string, unknown>).items
              : [];

        if (Array.isArray(rawList) && rawList.length > 0) {
          let maxId = 0;
          for (const item of rawList as Record<string, unknown>[]) {
            const idVal = Number(item.id ?? item.role_id ?? 0);
            if (!isNaN(idVal) && idVal > maxId) {
              maxId = idVal;
            }
          }
          nextRoleId = maxId + 1;
        }
      } catch {
        nextRoleId = Math.floor(Date.now() / 1000) % 90000 + 1000;
      }

      // POST /api/v1/roles/create requires: role_id (int), role_name (str), description (str), permissions (array)
      const response = await apiClient.post<Record<string, unknown>>(ROLES_ROUTES.CREATE, {
        role_id: nextRoleId,
        role_name: roleName,
        description: description || `${roleName} workspace role.`,
        permissions: cleanPermissions,
      });

      targetRoleId = String(
        (response?.data as Record<string, unknown>)?.id ||
          (response?.data as Record<string, unknown>)?.role_id ||
          response?.id ||
          response?.role_id ||
          nextRoleId,
      );
    }

    revalidatePath("/roles");
    revalidatePath("/roles/create");
    revalidatePath("/users");

    return {
      success: true,
      message: `Role "${roleName}" ${roleId ? "updated" : "created"} successfully.`,
      roleId: targetRoleId,
    };
  } catch (err: unknown) {
    console.error("[saveRole] Real Backend API error:", err);
    const errObj = err as {
      status?: number;
      message?: string;
      data?: { detail?: string | Array<{ msg?: string; loc?: string[] }> };
      response?: { data?: { detail?: string | Array<{ msg?: string; loc?: string[] }> } };
    };

    let errorDetail = "";
    const detail = errObj?.data?.detail || errObj?.response?.data?.detail;
    if (detail) {
      errorDetail = Array.isArray(detail)
        ? detail
            .map((item) => item.msg || "")
            .filter(Boolean)
            .join(", ")
        : String(detail);
    }

    const errorMsg =
      errorDetail ||
      errObj?.message ||
      `Failed to ${roleId ? "update" : "create"} role on backend server.`;

    return {
      success: false,
      message: errorMsg,
    };
  }
}

/**
 * Server Action to fetch permissions for a specific role.
 * Resolves nav_id UUIDs to human-readable names via sidebar navigation.
 */
export async function getRolePermissions(roleId: string | number): Promise<RolePermissionEntry[]> {
  try {
    const numId = parseInt(String(roleId).replace(/\D/g, ""), 10) || roleId;

    // Fetch role permissions and sidebar nav items in parallel
    const [response, sidebarResponse] = await Promise.all([
      apiClient.get<Record<string, unknown>>(ROLES_ROUTES.PERMISSIONS(numId)),
      apiClient.get<Record<string, unknown>>(ROLES_ROUTES.SIDEBAR, { timeout: 5000 }).catch(() => null),
    ]);

    // Build navMap from sidebar items
    const navMap: NavMap = {};
    if (sidebarResponse) {
      const navItems = Array.isArray(sidebarResponse)
        ? sidebarResponse
        : Array.isArray(sidebarResponse?.data)
          ? (sidebarResponse.data as Record<string, unknown>[])
          : [];
      for (const item of navItems as Record<string, unknown>[]) {
        const id = String(item.id ?? item.key ?? "").trim();
        const label = String(item.label ?? item.title ?? item.name ?? "").trim();
        if (id && label) navMap[id] = label;
        const children = Array.isArray(item.children) ? item.children : [];
        for (const child of children as Record<string, unknown>[]) {
          const cId = String(child.id ?? child.key ?? "").trim();
          const cLabel = String(child.label ?? child.title ?? child.name ?? "").trim();
          if (cId && cLabel) navMap[cId] = cLabel;
        }
      }
    }

    // Extract permissions list from response
    const list = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? (response.data as Record<string, unknown>[])
        : Array.isArray((response?.data as Record<string, unknown>)?.items)
          ? ((response?.data as Record<string, unknown>).items as Record<string, unknown>[])
          : Array.isArray((response?.data as Record<string, unknown>)?.permissions)
            ? ((response?.data as Record<string, unknown>).permissions as Record<string, unknown>[])
            : [];

    // Use buildPermissionEntries to get properly resolved names
    const permsArray: BackendPermissionItem[] = list.map((item) => ({
      permission_id: String(item.permission_id || item.id || ""),
      nav_id: String(item.nav_id || ""),
      permission_name: String(item.permission_name || ""),
      name: String(item.name || ""),
      read: Boolean(item.read),
      create: Boolean(item.create),
      update: Boolean(item.update),
      delete: Boolean(item.delete),
      permission_type: item.permission_type as string | undefined,
      type: item.type as string | undefined,
      description: item.description ? String(item.description) : undefined,
    }));

    return buildPermissionEntries(permsArray, `Role ${roleId}`, navMap);
  } catch {
    return [];
  }
}

/**
 * Server Action to fetch raw backend permissions (with nav_id & permission_id) for a role.
 */
export async function getRoleRawPermissions(roleId: string | number): Promise<BackendPermissionItem[]> {
  try {
    const numId = parseInt(String(roleId).replace(/\D/g, ""), 10) || roleId;
    const response = await apiClient.get<Record<string, unknown>>(ROLES_ROUTES.PERMISSIONS(numId));
    const list = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? (response.data as Record<string, unknown>[])
        : Array.isArray((response?.data as Record<string, unknown>)?.items)
          ? ((response?.data as Record<string, unknown>).items as Record<string, unknown>[])
          : Array.isArray((response?.data as Record<string, unknown>)?.permissions)
            ? ((response?.data as Record<string, unknown>).permissions as Record<string, unknown>[])
            : [];

    return list.map((item) => ({
      permission_id: String(item.permission_id || item.id || ""),
      nav_id: String(item.nav_id || ""),
      permission_name: String(item.permission_name || ""),
      name: String(item.name || ""),
      read: Boolean(item.read),
      create: Boolean(item.create),
      update: Boolean(item.update),
      delete: Boolean(item.delete),
      description: item.description ? String(item.description) : undefined,
    }));
  } catch {
    return [];
  }
}

export interface DeleteRoleResult {
  success: boolean;
  message: string;
}

/**
 * Server Action to delete a role from FastAPI backend
 */
export async function deleteRole(roleId: string | number): Promise<DeleteRoleResult> {
  if (!roleId) {
    return {
      success: false,
      message: "Invalid role ID provided for deletion.",
    };
  }

  const numId = parseInt(String(roleId).replace(/\D/g, ""), 10) || roleId;

  try {
    // Attempt deletion across standard endpoints
    const endpointsToTry = [
      ROLES_ROUTES.DELETE(numId),
      `/api/v1/roles/${numId}`,
      `/api/v1/roles/delete/${numId}`,
      `/api/v1/roles/delete-role/${numId}`,
    ];

    let deletionSuccessful = false;
    let lastErrorMsg = "";

    for (const ep of endpointsToTry) {
      try {
        const delRes = await apiClient.delete<Record<string, unknown>>(ep);
        if (delRes && (delRes as Record<string, unknown>).success !== false) {
          deletionSuccessful = true;
          break;
        }
      } catch (err: unknown) {
        const apiErr = err as {
          status?: number;
          message?: string;
          data?: { detail?: string };
          response?: { status?: number; data?: { detail?: string } };
        };
        const status = apiErr.status || apiErr.response?.status;
        if (status === 200 || status === 204) {
          deletionSuccessful = true;
          break;
        }
        lastErrorMsg = apiErr.data?.detail || apiErr.response?.data?.detail || apiErr.message || "";
      }
    }

    if (!deletionSuccessful) {
      return {
        success: false,
        message:
          lastErrorMsg ||
          "Backend API does not support role deletion (no DELETE endpoint exists in backend specification). Roles cannot be removed until a DELETE route is added to the backend.",
      };
    }

    revalidatePath("/roles");
    revalidatePath("/roles/create");
    revalidatePath("/users");

    return {
      success: true,
      message: "Role deleted successfully.",
    };
  } catch (err: unknown) {
    console.error("[deleteRole] Error deleting role:", err);
    const errObj = err as { message?: string };
    return {
      success: false,
      message: errObj?.message || "Failed to delete role on backend server.",
    };
  }
}
