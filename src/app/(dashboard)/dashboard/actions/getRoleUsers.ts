"use server";

import { dashboardService } from "@/services/dashboard.service";
import { RoleUsersResponse } from "../types/dashboard.types";
import { getDashboardAuthToken } from "./getAuthToken";

/**
 * Server Action / Query to fetch Users by Role Distribution (Donut Chart)
 */
export async function getRoleUsers(): Promise<RoleUsersResponse> {
  const token = await getDashboardAuthToken();
  return dashboardService.getUsersByRole(token);
}

