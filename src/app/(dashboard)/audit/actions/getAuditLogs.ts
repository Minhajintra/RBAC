"use server";

import { auditService } from "@/services/audit.service";
import { AuditFilters, AuditEvent } from "../types/audit.types";

/**
 * Server Action to fetch system audit logs directly from the backend API
 */
export async function getAuditLogs(
  filters?: AuditFilters,
): Promise<AuditEvent[]> {
  return await auditService.getAuditLogs(filters);
}
