/**
 * TypeScript definitions for Audit Logs module
 */

export type AuditEventResult = "Success" | "Failed";

export interface AuditEvent {
  id: string;
  actor: {
    name: string;
    email: string;
    initials: string;
  };
  action: string;
  resource: {
    primary: string;
    category: string;
  };
  time: string;
  timestamp?: string;
  result: AuditEventResult;
  severity?: "Informational" | "Warning" | "Critical";
}

export interface AuditStats {
  totalEvents: {
    value: string;
    badge: string;
    subtitle: string;
  };
  successfulEvents: {
    value: string;
    badge: string;
    subtitle: string;
  };
  failedEvents: {
    value: string;
    badge: string;
    subtitle: string;
  };
  eventsToday: {
    value: string;
    badge: string;
    subtitle: string;
  };
}

export interface AuditFilters {
  search?: string;
  action?: string;
  result?: string;
  dateRange?: string;
  user?: string;
  severity?: string;
  date?: string;
}
