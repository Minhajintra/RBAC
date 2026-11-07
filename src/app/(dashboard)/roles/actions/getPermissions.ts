"use server";

import { permissionService } from "@/services/permission.service";
import { MePermissionsResponse } from "@/types/permissions.types";

/**
 * Server Action to fetch available system permissions
 */
export async function getPermissions(): Promise<MePermissionsResponse> {
  return permissionService.getMyPermissions();
}

