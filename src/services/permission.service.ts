import { apiClient } from "@/lib/api-client";
import { MePermissionsResponse } from "@/types/permissions.types";
import {
  buildDefaultModuleMap,
  isSuperAdminRole,
  resolvePermissionsFromBackendData,
} from "@/lib/auth/permission-mapper";

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

export const permissionService = {
  /**
   * Fetches user permissions derived dynamically from backend user role, /api/v1/roles/all,
   * /api/v1/roles/{id}/permissions, and /api/v1/navigation/sidebar.
   */
  async getMyPermissions(): Promise<MePermissionsResponse> {
    try {
      // 1. Resolve current user identity and role
      let userRole = "";
      let userId = "current-user";
      let userRoleId: string | number | undefined;
      try {
        const meRes = await apiClient.get<Record<string, unknown>>("/api/auth/me").catch(() => null);
        const meUser = (meRes?.user as Record<string, unknown>) || meRes;
        if (meUser && typeof meUser === "object") {
          userRole = String(meUser.role || meUser.role_name || "").trim();
          userId = String(meUser.id || meUser.email || "current-user");
          userRoleId = (meUser.role_id ?? meUser.roleId) as string | number | undefined;
        }
      } catch {
        // fallback
      }

      if (isSuperAdminRole(userRole)) {
        return {
          user_id: userId,
          role: userRole || "Super Admin",
          permissions: buildDefaultModuleMap(true),
        };
      }

      // 2. Fetch all backend role definitions and sidebar nav map in parallel
      const [rolesRes, sidebarRes] = await Promise.all([
        apiClient.get<Record<string, unknown>>("/api/v1/roles/all").catch(() => null),
        apiClient.get<Record<string, unknown>>("/api/v1/navigation/sidebar").catch(() => null),
      ]);

      const resolved = await resolvePermissionsFromBackendData({
        userId,
        userRole,
        userRoleId,
        rolesRes,
        sidebarRes,
        fetchRolePermissions: (roleId) =>
          apiClient.get<Record<string, unknown>>(PERMISSION_ROUTES.ROLE_PERMISSIONS(roleId)),
      });

      if (resolved) {
        return resolved;
      }

      // 3. Fallback: try GET /api/v1/permissions/all if it returns a pre-shaped MePermissionsResponse
      const response = await apiClient.get<Record<string, unknown>>(
        PERMISSION_ROUTES.ALL,
      ).catch(() => null);

      const raw = (response?.data as Record<string, unknown>) || response;

      if (raw && typeof raw === "object" && "permissions" in raw && raw.permissions) {
        return raw as unknown as MePermissionsResponse;
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
