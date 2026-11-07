import { SYSTEM_RESOURCES } from "../constants/role.constants";
import {
  ResourcePermissionMatrixRow,
  RolePermissionEntry,
} from "../types/role.types";

export interface BackendPermissionItem {
  id?: string | number;
  permission_id?: string;
  nav_id?: string;
  name?: string;
  permission_name?: string;
  permission_type?: string;
  type?: string;
  description?: string;
  read?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
  view?: boolean;
  edit?: boolean;
  can_read?: boolean;
  can_create?: boolean;
  can_update?: boolean;
  can_delete?: boolean;
}

/**
 * NavMap: maps nav_id UUIDs to human-readable sidebar labels.
 * e.g. { "afbf3068-55b3-462e-bc6d-70f2505e0ad2": "Dashboard" }
 */
export type NavMap = Record<string, string>;

/**
 * Known standard navigation UUIDs mapped to display names.
 * Ensures that even if sidebar API is slow or offline, raw UUIDs never appear in the UI.
 */
export const DEFAULT_NAV_MAP: Record<string, string> = {
  "afbf3068-55b3-462e-bc6d-70f2505e0ad2": "Dashboard",
  "899918c3-c8be-43be-a76b-75d07642b879": "Users",
  "968d3044-da03-4104-990e-8a5dac92f7ae": "Roles & Permissions",
  "a7eaa459-9255-468d-8630-5d0e9237589b": "Audit Logs",
  "29fcfc0e-bcb3-4105-97cc-df39a20508d0": "Security Settings",
};

/**
 * Reverse mapping for saving back to backend API with required nav_id UUIDs.
 */
export const DEFAULT_REVERSE_NAV_MAP: Record<string, string> = {
  "dashboard": "afbf3068-55b3-462e-bc6d-70f2505e0ad2",
  "users": "899918c3-c8be-43be-a76b-75d07642b879",
  "roles": "968d3044-da03-4104-990e-8a5dac92f7ae",
  "roles & permissions": "968d3044-da03-4104-990e-8a5dac92f7ae",
  "roles and permissions": "968d3044-da03-4104-990e-8a5dac92f7ae",
  "audit": "a7eaa459-9255-468d-8630-5d0e9237589b",
  "audit logs": "a7eaa459-9255-468d-8630-5d0e9237589b",
  "settings": "29fcfc0e-bcb3-4105-97cc-df39a20508d0",
  "security": "29fcfc0e-bcb3-4105-97cc-df39a20508d0",
  "security settings": "29fcfc0e-bcb3-4105-97cc-df39a20508d0",
  "workspace settings": "29fcfc0e-bcb3-4105-97cc-df39a20508d0",
};

const STANDARD_FALLBACK_LABELS = [
  "Dashboard",
  "Users",
  "Roles & Permissions",
  "Audit Logs",
  "Security Settings",
  "Access Requests",
];

/**
 * Checks whether a string looks like a UUID (v4-style hex groups).
 */
export function isUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

export function matchesResource(key: string, sysId: string): boolean {
  const k = key.toLowerCase().replace(/[-_.]+/g, " ").trim();
  const s = sysId.toLowerCase();
  if (k === s || k.startsWith(s) || k.includes(s)) return true;
  if (s === "requests" && (k.includes("request") || k.includes("access"))) return true;
  if (s === "settings" && (k.includes("setting") || k.includes("workspace") || k.includes("pref"))) return true;
  if (s === "security" && (k.includes("security") || k.includes("mfa") || k.includes("auth"))) return true;
  if (s === "audit" && (k.includes("audit") || k.includes("log") || k.includes("event"))) return true;
  if (s === "roles" && (k.includes("role") || k.includes("permission"))) return true;
  if (s === "users" && (k.includes("user") || k.includes("account") || k.includes("member"))) return true;
  return false;
}

export function extractBackendPermissions(res: unknown): BackendPermissionItem[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as BackendPermissionItem[];

  const obj = res as Record<string, unknown>;
  const candidate = obj.data ?? obj.permissions ?? obj.items ?? obj.role_permissions ?? obj;

  if (Array.isArray(candidate)) {
    return candidate as BackendPermissionItem[];
  }

  if (candidate && typeof candidate === "object") {
    const candObj = candidate as Record<string, unknown>;
    if (Array.isArray(candObj.permissions)) return candObj.permissions as BackendPermissionItem[];
    if (Array.isArray(candObj.items)) return candObj.items as BackendPermissionItem[];
    if (Array.isArray(candObj.role_permissions)) return candObj.role_permissions as BackendPermissionItem[];

    // If candidate is a map/dictionary of resourceName -> permissionObject
    const result: BackendPermissionItem[] = [];
    for (const [key, val] of Object.entries(candObj)) {
      if (val && typeof val === "object") {
        const v = val as Record<string, unknown>;
        const crud = (v.crud && typeof v.crud === "object" ? v.crud : v) as Record<string, unknown>;
        result.push({
          nav_id: key,
          name: key,
          permission_name: key,
          read: Boolean(crud.can_read ?? crud.read ?? crud.view),
          create: Boolean(crud.can_create ?? crud.create ?? crud.edit),
          update: Boolean(crud.can_update ?? crud.update),
          delete: Boolean(crud.can_delete ?? crud.delete),
        });
      }
    }
    if (result.length > 0) return result;
  }

  return [];
}

/**
 * Resolves a permission item's nav_id to a clean, human-readable label.
 * Under NO circumstances does this function return a raw UUID.
 */
export function resolvePermissionLabel(
  p: BackendPermissionItem,
  navMap?: NavMap,
  fallbackIndex = 0,
): string {
  const navId = String(p.nav_id || "").trim();

  // 1. Look up in dynamic navMap (from sidebar API)
  if (navMap && navId && navMap[navId]) {
    return navMap[navId];
  }

  // 2. Look up in default known UUID map
  if (navId && DEFAULT_NAV_MAP[navId]) {
    return DEFAULT_NAV_MAP[navId];
  }

  // 3. Use permission_name or name if they are not UUIDs
  const permName = String(p.permission_name || "").trim();
  if (permName && !isUuid(permName)) {
    // Strip trailing .view, .create if already present
    return permName.replace(/\.(view|create|update|edit|delete)$/i, "");
  }

  const name = String(p.name || "").trim();
  if (name && !isUuid(name)) {
    return name.replace(/\.(view|create|update|edit|delete)$/i, "");
  }

  // 4. Use nav_id only if it's not a UUID
  if (navId && !isUuid(navId)) {
    return navId;
  }

  // 5. Index-based standard fallback (guarantees no raw UUID appears)
  return STANDARD_FALLBACK_LABELS[fallbackIndex % STANDARD_FALLBACK_LABELS.length] || `Resource ${fallbackIndex + 1}`;
}

/**
 * Builds resource matrix dynamically from backend permission items.
 */
export function buildMatrixFromBackendPermissions(
  permissions: BackendPermissionItem[] = [],
  roleName = "",
  isDefault = false,
  navMap?: NavMap,
): ResourcePermissionMatrixRow[] {
  const mergedNavMap: NavMap = {
    ...DEFAULT_NAV_MAP,
    ...(navMap || {}),
  };

  // If backend returned explicit permissions, build directly from them
  if (permissions.length > 0) {
    const rows: ResourcePermissionMatrixRow[] = [];

    for (let idx = 0; idx < permissions.length; idx++) {
      const p = permissions[idx];
      const label = resolvePermissionLabel(p, mergedNavMap, idx);

      const sysMatch = SYSTEM_RESOURCES.find((sys) =>
        matchesResource(label, sys.id),
      );

      const canRead = Boolean(p.read ?? p.view ?? p.can_read);
      const canCreate = Boolean(p.create ?? p.can_create);
      const canUpdate = Boolean(p.update ?? p.edit ?? p.can_update);
      const canDelete = Boolean(p.delete ?? p.can_delete);

      rows.push({
        resource: sysMatch?.name || label,
        description: sysMatch?.description || `Manage ${label.toLowerCase()} access`,
        view: canRead,
        create: canCreate,
        edit: canUpdate,
        update: canUpdate,
        delete: canDelete,
      });
    }

    return rows;
  }

  // Fallback if role has 0 permissions
  const normName = roleName.toLowerCase().replace(/[\s_-]+/g, "");
  const isSuperAdmin =
    normName.includes("superadmin") ||
    normName === "super admin" ||
    normName === "admin" ||
    normName === "administrator";

  return SYSTEM_RESOURCES.map((sys) => ({
    resource: sys.name,
    description: sys.description,
    view: true,
    create: isSuperAdmin,
    edit: isSuperAdmin,
    update: isSuperAdmin,
    delete: isSuperAdmin,
  }));
}

/**
 * Converts backend permission items into granular permission rows
 * for the Create/Edit role form.
 */
export function buildPermissionEntries(
  permissions: BackendPermissionItem[] = [],
  roleName: string,
  navMap?: NavMap,
): RolePermissionEntry[] {
  const mergedNavMap: NavMap = {
    ...DEFAULT_NAV_MAP,
    ...(navMap || {}),
  };

  if (permissions.length === 0) {
    const norm = roleName.toLowerCase();
    const isSuper = norm.includes("super admin") || norm.includes("superadmin") || norm.includes("admin");
    return [
      {
        id: "perm-1",
        name: "users.view",
        type: "View",
        description: "View users and directory",
      },
      {
        id: "perm-2",
        name: isSuper ? "users.delete" : "users.edit",
        type: isSuper ? "Delete" : "Edit",
        description: isSuper ? "Full administrative control" : "Update user details",
      },
    ];
  }

  const entries: RolePermissionEntry[] = [];
  permissions.forEach((p, idx) => {
    const label = resolvePermissionLabel(p, mergedNavMap, idx);
    const permId = String(p.permission_id || p.id || idx);

    if (p.permission_type || p.type) {
      entries.push({
        id: `p-${permId}`,
        name: label,
        type: (p.permission_type || p.type || "View") as RolePermissionEntry["type"],
        description: p.description || `Access to ${label}`,
      });
    } else {
      if (p.read || p.view || p.can_read) {
        entries.push({
          id: `p-${permId}-read`,
          name: `${label}.view`,
          type: "View",
          description: `View ${label}`,
        });
      }
      if (p.create || p.edit || p.can_create) {
        entries.push({
          id: `p-${permId}-create`,
          name: `${label}.create`,
          type: "Create",
          description: `Create ${label}`,
        });
      }
      if (p.update || p.can_update) {
        entries.push({
          id: `p-${permId}-update`,
          name: `${label}.update`,
          type: "Update",
          description: `Update ${label}`,
        });
      }
      if (p.delete || p.can_delete) {
        entries.push({
          id: `p-${permId}-del`,
          name: `${label}.delete`,
          type: "Delete",
          description: `Delete ${label}`,
        });
      }
    }
  });

  return entries;
}
