/**
 * Role management and permission module routes matching FastAPI backend API contract (Swagger)
 */
export const ROLES_ROUTES = {
  ALL: "/api/v1/roles/all",
  CREATE: "/api/v1/roles/create",
  UPDATE: (id: string | number) => `/api/v1/roles/update/${id}`,
  DELETE: (id: string | number) => `/api/v1/roles/delete/${id}`,
  PERMISSIONS: (id: string | number) => `/api/v1/roles/${id}/permissions`,
  PERMISSION_ALL: "/api/v1/permissions/all",
  PERMISSION_ROLE_CREATE: "/api/v1/permissions/role-permission/create",
  PERMISSION_ASSIGN: "/api/v1/permissions/assign",
  PERMISSION_REMOVE: "/api/v1/permissions/remove",
  PERMISSION_SPECIAL: (roleId: string | number) =>
    `/api/v1/permissions/roles/${roleId}/special-permissions`,
  PERMISSION_SPECIAL_UPDATE: "/api/v1/permissions/roles/special-permissions",
  USERS_LIST: "/api/v1/users/user-list",
  SIDEBAR: "/api/v1/navigation/sidebar",
} as const;

/**
 * Standard system resources for matrix mapping
 */
export const SYSTEM_RESOURCES = [
  { id: "users", name: "Users", description: "View, invite and manage users" },
  { id: "roles", name: "Roles & permissions", description: "Configure workspace access" },
  { id: "requests", name: "Access requests", description: "Review and resolve requests" },
  { id: "audit", name: "Audit logs", description: "Inspect and export events" },
  { id: "settings", name: "Workspace settings", description: "Manage workspace preferences" },
  { id: "security", name: "Security settings", description: "Manage MFA and access policies" },
] as const;
