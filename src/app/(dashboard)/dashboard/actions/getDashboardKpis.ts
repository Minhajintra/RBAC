"use server";

import { dashboardService } from "@/services/dashboard.service";
import { DashboardKpiItem } from "../types/dashboard.types";
import { getDashboardAuthToken } from "./getAuthToken";

/**
 * Server Action / Query to fetch Dashboard KPI Summary Cards
 */
export async function getDashboardKpis(): Promise<DashboardKpiItem[]> {
  const token = await getDashboardAuthToken();
  return dashboardService.getSummary(token);
}


