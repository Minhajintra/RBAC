"use server";

import { getDashboardKpis as _getDashboardKpis } from "./getDashboardKpis";
import { getRoleUsers as _getRoleUsers } from "./getRoleUsers";
import { getLoginAttempts as _getLoginAttempts } from "./getLoginAttempts";
import { getInterfaceAccess as _getInterfaceAccess } from "./getInterfaceAccess";
import { getLoginHistory as _getLoginHistory } from "./getLoginHistory";
import { getSecurityOverview as _getSecurityOverview } from "./getSecurityOverview";
import { LoginAttemptsPeriod, LoginHistoryFilters } from "../types/dashboard.types";

export async function getDashboardKpis() {
  return _getDashboardKpis();
}

export async function getRoleUsers() {
  return _getRoleUsers();
}

export async function getLoginAttempts(period?: LoginAttemptsPeriod) {
  return _getLoginAttempts(period);
}

export async function getInterfaceAccess() {
  return _getInterfaceAccess();
}

export async function getLoginHistoryAction(
  filters?: LoginHistoryFilters,
  page?: number,
  pageSize?: number,
) {
  return _getLoginHistory(filters, page, pageSize);
}

export async function getSecurityOverviewAction() {
  return _getSecurityOverview();
}
