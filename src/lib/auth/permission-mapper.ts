import {
  CrudPermissions,
  FeaturePermissions,
  MePermissionsResponse,
} from "@/types/permissions.types";

export const STANDARD_MODULES = [
  "dashboard",
  "users",
  "roles",
  "audit",
  "settings",
  "reports",
] as const;

export const MODULE_NAV_MAP: Record<string, string> = {
  dashboard: "afbf3068-55b3-462e-bc6d-70f2505e0ad2",
  users: "899918c3-c8be-43be-a76b-75d07642b879",
  roles: "968d3044-da03-4104-990e-8a5dac92f7ae",
  audit: "a7eaa459-9255-468d-8630-5d0e9237589b",
  settings: "29fcfc0e-bcb3-4105-97cc-df39a20508d0",
};

export const DEFAULT_NAV_MAP: Record<string, string> = {
  "afbf3068-55b3-462e-bc6d-70f2505e0ad2": "Dashboard",
  "899918c3-c8be-43be-a76b-75d07642b879": "Users",
  "968d3044-da03-4104-990e-8a5dac92f7ae": "Roles & Permissions",
  "a7eaa459-9255-468d-8630-5d0e9237589b": "Audit Logs",
  "29fcfc0e-bcb3-4105-97cc-df39a20508d0": "Security Settings",
};

export type ModulePermissionEntry = {
  crud: CrudPermissions;
  features: FeaturePermissions;
};

export function normalizeRoleKey(val: unknown): string {
  return String(val || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "")
    .trim();
}

export function isSuperAdminRole(role: string): boolean {
  const norm = normalizeRoleKey(role);
  return norm.includes("superadmin") || norm === "admin";
}

export function extractRolesArray(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (!raw || typeof raw !== "object") return [];

  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
  if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[];
  if (Array.isArray(obj.roles)) return obj.roles as Record<string, unknown>[];

  if (obj.data && typeof obj.data === "object") {
    const dataObj = obj.data as Record<string, unknown>;
    if (Array.isArray(dataObj.items)) return dataObj.items as Record<string, unknown>[];
    if (Array.isArray(dataObj.roles)) return dataObj.roles as Record<string, unknown>[];
  }

  return [];
}

export function extractPermissionsList(raw: unknown): Record<string, unknown>[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (typeof raw !== "object") return [];

  const obj = raw as Record<string, unknown>;
  const candidate = obj.data ?? obj.permissions ?? obj.items ?? obj.role_permissions ?? obj;

  if (Array.isArray(candidate)) {
    return candidate as Record<string, unknown>[];
  }

  if (candidate && typeof candidate === "object") {
    const candObj = candidate as Record<string, unknown>;
    if (Array.isArray(candObj.permissions)) return candObj.permissions as Record<string, unknown>[];
    if (Array.isArray(candObj.items)) return candObj.items as Record<string, unknown>[];
    if (Array.isArray(candObj.role_permissions)) return candObj.role_permissions as Record<string, unknown>[];

    const result: Record<string, unknown>[] = [];
    for (const [key, val] of Object.entries(candObj)) {
      if (val && typeof val === "object" && !Array.isArray(val)) {
        const v = val as Record<string, unknown>;
        const crud = (v.crud && typeof v.crud === "object" ? v.crud : v) as Record<string, unknown>;
        result.push({
          nav_id: key,
          name: key,
          permission_name: key,
          read: Boolean(crud.can_read ?? crud.read ?? crud.view),
          create: Boolean(crud.can_create ?? crud.create),
          update: Boolean(crud.can_update ?? crud.update ?? crud.edit),
          delete: Boolean(crud.can_delete ?? crud.delete),
        });
      }
    }
    if (result.length > 0) return result;
  }

  return [];
}

function extractRawSidebarList(sidebarRaw: unknown): {
  hasSidebarData: boolean;
  items: Record<string, unknown>[];
} {
  if (!sidebarRaw || typeof sidebarRaw !== "object") {
    if (Array.isArray(sidebarRaw)) {
      return { hasSidebarData: true, items: sidebarRaw as Record<string, unknown>[] };
    }
    return { hasSidebarData: false, items: [] };
  }

  const obj = sidebarRaw as Record<string, unknown>;
  if (obj.success === false) {
    return { hasSidebarData: false, items: [] };
  }

  const dataObj =
    obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)
      ? (obj.data as Record<string, unknown>)
      : null;

  const list = Array.isArray(obj.data)
    ? obj.data
    : Array.isArray(dataObj?.items)
      ? dataObj.items
      : Array.isArray(dataObj?.navigation)
        ? dataObj.navigation
        : Array.isArray(dataObj?.sidebar)
          ? dataObj.sidebar
          : Array.isArray(dataObj?.menus)
            ? dataObj.menus
            : Array.isArray(dataObj?.links)
              ? dataObj.links
              : Array.isArray(obj.items)
                ? obj.items
                : Array.isArray(obj.navigation)
                  ? obj.navigation
                  : Array.isArray(obj.sidebar)
                    ? obj.sidebar
                    : null;

  if (!list) {
    return { hasSidebarData: false, items: [] };
  }

  return { hasSidebarData: true, items: list as Record<string, unknown>[] };
}

export function buildNavMapFromSidebar(sidebarRaw: unknown): Record<string, string> {
  const navMap: Record<string, string> = {};
  const { items } = extractRawSidebarList(sidebarRaw);

  const collect = (list: Record<string, unknown>[]) => {
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      const id = String(item.id ?? item.nav_id ?? item.key ?? "").trim();
      const label = String(item.label ?? item.title ?? item.name ?? "").trim();
      if (id && label) navMap[id.toLowerCase()] = label;

      const children = Array.isArray(item.children)
        ? item.children
        : Array.isArray(item.sub_items)
          ? item.sub_items
          : Array.isArray(item.subItems)
            ? item.subItems
            : [];
      if (children.length > 0) {
        collect(children as Record<string, unknown>[]);
      }
    }
  };

  collect(items);
  return navMap;
}

export function matchesModuleName(text: string, mod: string): boolean {
  const k = text.toLowerCase().replace(/[-_./]+/g, " ").trim();
  if (!k) return false;
  if (k === mod || k.startsWith(mod) || k.includes(mod)) return true;
  if (mod === "users" && (k.includes("user") || k.includes("account") || k.includes("member"))) return true;
  if (mod === "roles" && (k.includes("role") || k.includes("permission"))) return true;
  if (mod === "audit" && (k.includes("audit") || k.includes("log") || k.includes("event"))) return true;
  if (mod === "settings" && (k.includes("setting") || k.includes("security") || k.includes("workspace") || k.includes("pref"))) return true;
  if (mod === "dashboard" && k.includes("dashboard")) return true;
  if (mod === "reports" && k.includes("report")) return true;
  return false;
}

export function extractVisibleSidebarModules(sidebarRaw: unknown): {
  hasSidebarData: boolean;
  visibleModules: Set<string>;
} {
  const { hasSidebarData, items } = extractRawSidebarList(sidebarRaw);
  const visibleModules = new Set<string>();

  if (!hasSidebarData) {
    return { hasSidebarData: false, visibleModules };
  }

  const visit = (list: Record<string, unknown>[]) => {
    for (const item of list) {
      if (!item || typeof item !== "object") continue;

      const isVisible = item.is_visible !== false && item.visible !== false;
      const isEnabled = item.is_enabled !== false && item.enabled !== false;

      if (isVisible && isEnabled) {
        const id = String(item.id ?? item.nav_id ?? item.key ?? "").trim().toLowerCase();
        const label = String(item.label ?? item.title ?? item.name ?? "").trim();
        const href = String(item.href ?? item.path ?? item.route ?? item.url ?? "").trim();

        for (const mod of STANDARD_MODULES) {
          const targetNavId = MODULE_NAV_MAP[mod]?.toLowerCase();
          if (
            (targetNavId && id === targetNavId) ||
            matchesModuleName(label, mod) ||
            matchesModuleName(id, mod) ||
            matchesModuleName(href, mod)
          ) {
            visibleModules.add(mod);
          }
        }
      }

      const children = Array.isArray(item.children)
        ? item.children
        : Array.isArray(item.sub_items)
          ? item.sub_items
          : Array.isArray(item.subItems)
            ? item.subItems
            : [];
      if (children.length > 0) {
        visit(children as Record<string, unknown>[]);
      }
    }
  };

  visit(items);
  return { hasSidebarData, visibleModules };
}

export function extractCrudFlags(perm: Record<string, unknown>): {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
} {
  const src =
    perm.crud && typeof perm.crud === "object"
      ? (perm.crud as Record<string, unknown>)
      : perm;

  let canRead = Boolean(src.read ?? src.view ?? src.can_read ?? false);
  let canCreate = Boolean(src.create ?? src.can_create ?? false);
  let canUpdate = Boolean(src.update ?? src.edit ?? src.can_update ?? false);
  let canDelete = Boolean(src.delete ?? src.can_delete ?? false);

  const pType = String(perm.permission_type ?? perm.type ?? "").toLowerCase().trim();
  const pName = String(perm.permission_name ?? perm.name ?? "").toLowerCase().trim();

  if (pType === "view" || pType === "read" || pName.endsWith(".view") || pName.endsWith(".read")) {
    canRead = true;
  }
  if (pType === "create" || pName.endsWith(".create")) {
    canCreate = true;
  }
  if (pType === "update" || pType === "edit" || pName.endsWith(".update") || pName.endsWith(".edit")) {
    canUpdate = true;
  }
  if (pType === "delete" || pName.endsWith(".delete")) {
    canDelete = true;
  }

  return { canRead, canCreate, canUpdate, canDelete };
}

export function findMatchingRole(
  allRoles: Record<string, unknown>[],
  normUserRole: string,
  userRoleId?: string | number,
): Record<string, unknown> | undefined {
  if (userRoleId !== undefined && userRoleId !== null && String(userRoleId).trim() !== "") {
    const byId = allRoles.find(
      (r) => String(r.id ?? r.role_id ?? "").trim() === String(userRoleId).trim(),
    );
    if (byId) return byId;
  }

  if (!normUserRole) return undefined;

  const exactMatch = allRoles.find((r) => {
    const code = normalizeRoleKey(r.code);
    const name = normalizeRoleKey(r.name ?? r.role_name);
    return (code.length > 0 && code === normUserRole) || (name.length > 0 && name === normUserRole);
  });
  if (exactMatch) return exactMatch;

  return allRoles.find((r) => {
    const code = normalizeRoleKey(r.code);
    const name = normalizeRoleKey(r.name ?? r.role_name);
    const matchesCode =
      code.length > 0 && (normUserRole.includes(code) || code.includes(normUserRole));
    const matchesName =
      name.length > 0 && (normUserRole.includes(name) || name.includes(normUserRole));
    return matchesCode || matchesName;
  });
}

export function buildDefaultModuleMap(allowAll = false): Record<string, ModulePermissionEntry> {
  const map: Record<string, ModulePermissionEntry> = {};
  for (const mod of STANDARD_MODULES) {
    map[mod] = {
      crud: {
        can_create: allowAll,
        can_read: true,
        can_update: allowAll,
        can_delete: allowAll,
      },
      features: {
        is_visible: true,
        is_enabled: true,
      },
    };
  }
  return map;
}

export async function resolvePermissionsFromBackendData(params: {
  userId: string;
  userRole: string;
  userRoleId?: string | number;
  rolesRes: unknown;
  sidebarRes: unknown;
  fetchRolePermissions: (roleId: string | number) => Promise<unknown>;
}): Promise<MePermissionsResponse | null> {
  const { userId, userRole, userRoleId, rolesRes, sidebarRes, fetchRolePermissions } = params;

  if (isSuperAdminRole(userRole)) {
    return {
      user_id: userId,
      role: userRole || "Super Admin",
      permissions: buildDefaultModuleMap(true),
    };
  }

  const allRoles = extractRolesArray(rolesRes);
  const normUserRole = normalizeRoleKey(userRole);

  const navMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(DEFAULT_NAV_MAP)) {
    navMap[k.toLowerCase()] = v;
  }
  Object.assign(navMap, buildNavMapFromSidebar(sidebarRes));

  const sidebarInfo = extractVisibleSidebarModules(sidebarRes);

  if (allRoles.length > 0 && (userRole || userRoleId !== undefined)) {
    const matchedRole = findMatchingRole(allRoles, normUserRole, userRoleId);

    if (matchedRole) {
      let rolePermissions =
        Array.isArray(matchedRole.permissions) && matchedRole.permissions.length > 0
          ? (matchedRole.permissions as Record<string, unknown>[])
          : Array.isArray(matchedRole.role_permissions) && matchedRole.role_permissions.length > 0
            ? (matchedRole.role_permissions as Record<string, unknown>[])
            : [];

      if (rolePermissions.length === 0) {
        const matchedId = matchedRole.id ?? matchedRole.role_id;
        if (matchedId !== undefined && matchedId !== null && String(matchedId).trim() !== "") {
          const idStr = String(matchedId).trim();
          const numId: string | number = parseInt(idStr.replace(/\D/g, ""), 10) || idStr;
          const rolePermsRes = await fetchRolePermissions(numId).catch(() => null);
          rolePermissions = extractPermissionsList(rolePermsRes);
        }
      }

      if (rolePermissions.length > 0) {
        const moduleMap: Record<string, ModulePermissionEntry> = {};

        for (const mod of STANDARD_MODULES) {
          const targetNavId = MODULE_NAV_MAP[mod]?.toLowerCase();
          const matchingPerms = rolePermissions.filter((p) => {
            const pNav = String(p.nav_id || "").trim().toLowerCase();
            const resolvedNavLabel = pNav ? navMap[pNav] || "" : "";
            const pName = String(
              p.permission_name || p.name || p.module || p.resource || p.key || "",
            ).trim();

            if (targetNavId && pNav === targetNavId) return true;
            if (resolvedNavLabel && matchesModuleName(resolvedNavLabel, mod)) return true;
            if (pName && matchesModuleName(pName, mod)) return true;
            return false;
          });

          if (matchingPerms.length > 0) {
            let canRead = false;
            let canCreate = false;
            let canUpdate = false;
            let canDelete = false;

            for (const perm of matchingPerms) {
              const flags = extractCrudFlags(perm);
              canRead = canRead || flags.canRead;
              canCreate = canCreate || flags.canCreate;
              canUpdate = canUpdate || flags.canUpdate;
              canDelete = canDelete || flags.canDelete;
            }

            const allowedInSidebar =
              !sidebarInfo.hasSidebarData || sidebarInfo.visibleModules.has(mod);

            moduleMap[mod] = {
              crud: {
                can_read: canRead && allowedInSidebar,
                can_create: canCreate && allowedInSidebar,
                can_update: canUpdate && allowedInSidebar,
                can_delete: canDelete && allowedInSidebar,
              },
              features: {
                is_visible: canRead && allowedInSidebar,
                is_enabled: canRead && allowedInSidebar,
              },
            };
          } else {
            moduleMap[mod] = {
              crud: { can_create: false, can_read: false, can_update: false, can_delete: false },
              features: { is_visible: false, is_enabled: false },
            };
          }
        }

        return {
          user_id: userId,
          role: userRole,
          permissions: moduleMap,
        };
      }
    }
  }

  // Fallback: if sidebar returned visible items (e.g. /api/v1/roles/all is forbidden for restricted role)
  if (sidebarInfo.hasSidebarData) {
    const moduleMap: Record<string, ModulePermissionEntry> = {};
    for (const mod of STANDARD_MODULES) {
      const visible = sidebarInfo.visibleModules.has(mod);
      moduleMap[mod] = {
        crud: {
          can_create: false,
          can_read: visible,
          can_update: false,
          can_delete: false,
        },
        features: {
          is_visible: visible,
          is_enabled: visible,
        },
      };
    }

    return {
      user_id: userId,
      role: userRole || "Authenticated",
      permissions: moduleMap,
    };
  }

  return null;
}
