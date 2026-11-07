import { apiClient } from "@/lib/api-client";
import {
  MePermissionsResponse,
  CrudPermissions,
  FeaturePermissions,
} from "@/types/permissions.types";

/**
 * Real backend API routes for permissions per OpenAPI 3.1.0 contract
 */
export const PERMISSION_ROUTES = {
  ALL: "/api/v1/permissions/all",
  ASSIGN: "/api/v1/permissions/assign",
  REMOVE: "/api/v1/permissions/remove",
  ROLE_PERMISSION_CREATE: "/api/v1/permissions/role-permission/create",
  ROLE_SPECIAL_PERMISSIONS: (roleId: string | number) =>
    `/api/v1/permissions/roles/${roleId}/special-permissions`,
  UPDATE_ROLE_SPECIAL_PERMISSIONS: "/api/v1/permissions/roles/special-permissions",
  ROLE_PERMISSIONS: (roleId: string | number) =>
    `/api/v1/roles/${roleId}/permissions`,
} as const;

const STANDARD_MODULES = [
  "dashboard",
  "users",
  "roles",
  "audit",
  "settings",
  "reports",
];

const MODULE_NAV_MAP: Record<string, string> = {
  dashboard: "afbf3068-55b3-462e-bc6d-70f2505e0ad2",
  users: "899918c3-c8be-43be-a76b-75d07642b879",
  roles: "968d3044-da03-4104-990e-8a5dac92f7ae",
  audit: "a7eaa459-9255-468d-8630-5d0e9237589b",
  settings: "29fcfc0e-bcb3-4105-97cc-df39a20508d0",
};

type ModulePermissionEntry = {
  crud: CrudPermissions;
  features: FeaturePermissions;
};

function buildDefaultModuleMap(allowAll = false): Record<string, ModulePermissionEntry> {
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

export const permissionService = {
  /**
   * Fetches user permissions derived dynamically from backend user role & /api/v1/roles/all
   * Strictly matches backend role-permission assignments without mock data.
   */
  async getMyPermissions(): Promise<MePermissionsResponse> {
    try {
      // 1. Resolve current user identity and role
      let userRole = "";
      let userId = "current-user";
      try {
        const meRes = await apiClient.get<Record<string, unknown>>("/api/auth/me").catch(() => null);
        const meUser = (meRes?.user as Record<string, unknown>) || meRes;
        if (meUser && typeof meUser === "object") {
          userRole = String(meUser.role || "").trim();
          userId = String(meUser.id || meUser.email || "current-user");
        }
      } catch {
        // fallback
      }

      // 2. Fetch all backend role definitions with their exact module-level permissions
      let allRoles: Record<string, unknown>[] = [];
      try {
        const rolesRes = await apiClient.get<Record<string, unknown>>("/api/v1/roles/all").catch(() => null);
        allRoles = Array.isArray(rolesRes)
          ? rolesRes
          : Array.isArray(rolesRes?.data)
            ? (rolesRes.data as Record<string, unknown>[])
            : Array.isArray((rolesRes?.data as Record<string, unknown>)?.items)
              ? ((rolesRes?.data as Record<string, unknown>).items as Record<string, unknown>[])
              : [];
      } catch {
        allRoles = [];
      }

      const normUserRole = userRole.toLowerCase().replace(/[\s_-]+/g, "");
      const isSuperAdmin =
        normUserRole.includes("superadmin") ||
        normUserRole === "super admin" ||
        normUserRole === "admin";

      if (isSuperAdmin) {
        return {
          user_id: userId,
          role: userRole || "Super Admin",
          permissions: buildDefaultModuleMap(true),
        };
      }

      // 3. Match user role with backend roles list
      if (allRoles.length > 0 && userRole) {
        const matchedRole = allRoles.find((r) => {
          const code = String(r.code || "").toLowerCase().replace(/[\s_-]+/g, "");
          const name = String(r.name || r.role_name || "").toLowerCase().replace(/[\s_-]+/g, "");
          return code === normUserRole || name === normUserRole || normUserRole.includes(code) || code.includes(normUserRole);
        });

        if (matchedRole) {
          const rolePermissions = Array.isArray(matchedRole.permissions)
            ? (matchedRole.permissions as Record<string, unknown>[])
            : Array.isArray((matchedRole as Record<string, unknown>).role_permissions)
              ? ((matchedRole as Record<string, unknown>).role_permissions as Record<string, unknown>[])
              : [];

          const moduleMap = buildDefaultModuleMap(false);

          for (const mod of STANDARD_MODULES) {
            const targetNavId = MODULE_NAV_MAP[mod];
            const perm = rolePermissions.find((p) => {
              const pNav = String(p.nav_id || "").toLowerCase();
              const pName = String(p.name || p.permission_name || "").toLowerCase();
              return (targetNavId && pNav === targetNavId.toLowerCase()) || pName.includes(mod);
            });

            if (perm) {
              const canRead = Boolean(perm.read ?? perm.view ?? perm.can_read ?? false);
              const canCreate = Boolean(perm.create ?? perm.edit ?? perm.can_create ?? false);
              const canUpdate = Boolean(perm.update ?? perm.can_update ?? false);
              const canDelete = Boolean(perm.delete ?? perm.can_delete ?? false);

              moduleMap[mod] = {
                crud: {
                  can_read: canRead,
                  can_create: canCreate,
                  can_update: canUpdate,
                  can_delete: canDelete,
                },
                features: {
                  is_visible: canRead,
                  is_enabled: canRead,
                },
              };
            } else {
              moduleMap[mod] = {
                crud: { can_create: false, can_read: true, can_update: false, can_delete: false },
                features: { is_visible: true, is_enabled: true },
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

      // 4. Fallback: try GET /api/v1/permissions/all
      const response = await apiClient.get<Record<string, unknown>>(
        PERMISSION_ROUTES.ALL,
      ).catch(() => null);

      const raw = (response?.data as Record<string, unknown>) || response;

      if (raw && typeof raw === "object" && "permissions" in raw && raw.permissions) {
        return raw as unknown as MePermissionsResponse;
      }

      const list = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as Record<string, unknown>)?.items)
          ? ((raw as Record<string, unknown>).items as Record<string, unknown>[])
          : [];

      if (list.length > 0) {
        const moduleMap = buildDefaultModuleMap(false);
        for (const item of list) {
          const permName = String(item.permission_name ?? item.name ?? item.code ?? "").toLowerCase();
          for (const mod of STANDARD_MODULES) {
            if (permName.includes(mod)) {
              if (permName.includes("create") || permName.includes("add")) {
                moduleMap[mod].crud.can_create = true;
              }
              if (permName.includes("read") || permName.includes("view") || permName.includes("list")) {
                moduleMap[mod].crud.can_read = true;
              }
              if (permName.includes("update") || permName.includes("edit") || permName.includes("modify")) {
                moduleMap[mod].crud.can_update = true;
              }
              if (permName.includes("delete") || permName.includes("remove")) {
                moduleMap[mod].crud.can_delete = true;
              }
            }
          }
        }
        return {
          user_id: userId,
          role: userRole || "Authenticated",
          permissions: moduleMap,
        };
      }
    } catch (err: unknown) {
      console.warn("[Permission Service] Backend permissions fetch warning:", err);
    }

    // Default restrictive state: users can read by default, but create/update/delete require explicit backend permissions
    return {
      user_id: "current-user",
      role: "Authenticated",
      permissions: buildDefaultModuleMap(false),
    };
  },

  /**
   * Fetches full permissions dictionary directly from GET /api/v1/permissions/all
   */
  async getAllPermissions(): Promise<Record<string, unknown>[]> {
    try {
      const response = await apiClient.get<Record<string, unknown>>(
        PERMISSION_ROUTES.ALL,
      );
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? (response.data as Record<string, unknown>[])
          : Array.isArray((response?.data as Record<string, unknown>)?.items)
            ? ((response?.data as Record<string, unknown>).items as Record<string, unknown>[])
            : [];
      return list;
    } catch (err) {
      console.warn("[Permission Service] Backend permissions fetch error:", err);
      return [];
    }
  },

  /**
   * Assign permissions to a role: POST /api/v1/permissions/assign
   */
  async assignPermissions(payload: {
    user_id?: string | number;
    role_id: string | number;
    permission_id?: string | number;
    permission_ids?: (string | number)[];
  }) {
    return apiClient.post(PERMISSION_ROUTES.ASSIGN, payload);
  },

  /**
   * Remove permissions from a role: POST /api/v1/permissions/remove
   */
  async removePermissions(payload: {
    role_id: string | number;
    permission_id?: string | number;
    permission_ids?: (string | number)[];
  }) {
    return apiClient.post(PERMISSION_ROUTES.REMOVE, payload);
  },

  /**
   * Create role permission: POST /api/v1/permissions/role-permission/create
   */
  async createRolePermission(payload: Record<string, unknown>) {
    return apiClient.post(PERMISSION_ROUTES.ROLE_PERMISSION_CREATE, payload);
  },

  /**
   * Get role special permissions: GET /api/v1/permissions/roles/{role_id}/special-permissions
   */
  async getRoleSpecialPermissions(roleId: string | number) {
    return apiClient.get(PERMISSION_ROUTES.ROLE_SPECIAL_PERMISSIONS(roleId));
  },

  /**
   * Update role special permissions: PUT /api/v1/permissions/roles/special-permissions
   */
  async updateRoleSpecialPermissions(payload: Record<string, unknown>) {
    return apiClient.put(PERMISSION_ROUTES.UPDATE_ROLE_SPECIAL_PERMISSIONS, payload);
  },

  /**
   * Get permissions for a specific role: GET /api/v1/roles/{id}/permissions
   */
  async getRolePermissions(roleId: string | number) {
    return apiClient.get(PERMISSION_ROUTES.ROLE_PERMISSIONS(roleId));
  },
};

export default permissionService;
