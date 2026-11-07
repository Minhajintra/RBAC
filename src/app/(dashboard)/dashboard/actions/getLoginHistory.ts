"use server";

import { dashboardService } from "@/services/dashboard.service";
import {
  LoginHistoryResponse,
  LoginHistoryFilters,
} from "../types/dashboard.types";
import { getDashboardAuthToken } from "./getAuthToken";

/**
 * Server Action / Query to fetch Login History Audit Records
 */
export async function getLoginHistory(
  filters?: LoginHistoryFilters,
  page = 1,
  pageSize = 6,
): Promise<LoginHistoryResponse> {
  const token = await getDashboardAuthToken();
  return dashboardService.getLoginHistory(
    filters,
    { currentPage: page, pageSize },
    token,
  );
}
