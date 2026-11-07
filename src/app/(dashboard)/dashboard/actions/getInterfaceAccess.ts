"use server";

import { dashboardService } from "@/services/dashboard.service";
import { InterfaceAccessResponse } from "../types/dashboard.types";
import { getDashboardAuthToken } from "./getAuthToken";

/**
 * Server Action / Query to fetch Interface Access Breakdown
 */
export async function getInterfaceAccess(): Promise<InterfaceAccessResponse> {
  const token = await getDashboardAuthToken();
  return dashboardService.getInterfaceAccess(token);
}

