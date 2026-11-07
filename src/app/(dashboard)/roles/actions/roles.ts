"use server";

import { getRoles as _getRoles, getRolesStats as _getRolesStats } from "./getRoles";
import { getPermissions as _getPermissions } from "./getPermissions";
import { saveRole as _saveRole, getRolePermissions as _getRolePermissions, deleteRole as _deleteRole } from "./saveRole";
import { RoleFormData, RoleItem } from "../types/role.types";

export async function getRolesAction() {
  return _getRoles();
}

export async function getRolesStatsAction(roles: RoleItem[]) {
  return _getRolesStats(roles);
}

export async function getPermissionsAction() {
  return _getPermissions();
}

export async function saveRoleAction(
  roleData: RoleFormData,
  roleId?: string | number,
) {
  return _saveRole(roleData, roleId);
}

export async function getRolePermissionsAction(roleId: string | number) {
  return _getRolePermissions(roleId);
}

export async function deleteRoleAction(roleId: string | number) {
  return _deleteRole(roleId);
}
