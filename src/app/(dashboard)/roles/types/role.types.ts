/**
 * Type definitions for Roles & Permissions module
 * Strictly dynamic - powered directly by the Backend API
 */

export type PermissionActionType = "View" | "Create" | "Edit" | "Update" | "Delete";

export interface RolePermissionEntry {
  id?: string;
  name: string;
  type: PermissionActionType;
  description: string;
}

export interface ResourcePermissionMatrixRow {
  resource: string;
  description: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  update: boolean;
  delete: boolean;
}

export interface BackendPermissionPayloadItem {
  permission_id?: string;
  nav_id: string;
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  view?: boolean;
  edit?: boolean;
  name?: string;
}

export interface RoleItem {
  id: string | number;
  name: string;
  description: string;
  is_default?: boolean;
  is_active?: boolean;
  user_count?: number;
  callout_title?: string;
  callout_desc?: string;
  last_updated?: string;
  matrix: ResourcePermissionMatrixRow[];
  permissions: RolePermissionEntry[];
  raw_permissions?: Record<string, unknown>[];
}

export interface RoleFormData {
  name: string;
  description: string;
  permissions?: RolePermissionEntry[];
  interface_permissions?: BackendPermissionPayloadItem[];
}

export interface SaveRoleResult {
  success: boolean;
  message: string;
  roleId?: string;
}

export interface RolesPageStats {
  totalRoles: number;
  activeRolesCount: number;
  defaultRolesCount: number;
  customRolesCount: number;
  totalUsers: number;
}
