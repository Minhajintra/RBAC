"use server";

import { auditService } from "@/services/audit.service";
import { AuditStats } from "../types/audit.types";

export async function getAuditStatsAction(): Promise<AuditStats> {
  return await auditService.getAuditStats();
}

