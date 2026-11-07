"use server";

import {
  dashboardService,
  SecurityOverviewData,
} from "@/services/dashboard.service";
import { getDashboardAuthToken } from "./getAuthToken";

/**
 * Server Action / Query to fetch System Security Policy Overview
 */
export async function getSecurityOverview(): Promise<SecurityOverviewData> {
  const token = await getDashboardAuthToken();
  return dashboardService.getSecurityOverview(token);
}

