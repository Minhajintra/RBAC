"use server";

import { getAuditLogs as _getAuditLogs } from "./getAuditLogs";
import { exportAuditLogs as _exportAuditLogs } from "./exportAuditLogs";
import { AuditFilters } from "../types/audit.types";

export async function getAuditLogsAction(filters?: AuditFilters) {
  return _getAuditLogs(filters);
}

export async function exportAuditLogsAction(filters?: AuditFilters) {
  return _exportAuditLogs(filters);
}
