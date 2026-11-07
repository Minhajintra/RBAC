"use server";

import { dashboardService } from "@/services/dashboard.service";
import {
  LoginAttemptsResponse,
  LoginAttemptsPeriod,
} from "../types/dashboard.types";
import { getDashboardAuthToken } from "./getAuthToken";

/**
 * Server Action / Query to fetch Login Attempts Breakdown (Bar Chart)
 */
export async function getLoginAttempts(
  period: LoginAttemptsPeriod = "daily",
): Promise<LoginAttemptsResponse> {
  const token = await getDashboardAuthToken();
  return dashboardService.getLoginAttempts(period, token);
}

