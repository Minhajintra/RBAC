"use server";

import { auditService } from "@/services/audit.service";
import { AuditFilters } from "../types/audit.types";

export interface ExportResult {
  success: boolean;
  message: string;
  filename: string;
  csvContent?: string;
}

/**
 * Server Action to format and export backend audit logs as CSV data
 */
export async function exportAuditLogs(
  filters?: AuditFilters,
): Promise<ExportResult> {
  return await auditService.exportAuditLogs(filters);
}
