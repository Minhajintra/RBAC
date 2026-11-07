import { apiClient } from "@/lib/api-client";
import {
  AuditEvent,
  AuditFilters,
  AuditStats,
} from "@/app/(dashboard)/audit/types/audit.types";

const AUDIT_ROUTES = {
  LIST: "/api/v1/audit/audit-logs",
} as const;

export interface RawAuditItem {
  id?: string | number;
  log_id?: string | number;
  audit_id?: string | number;
  _id?: string | number;
  actor?: string | { name?: string; email?: string; username?: string };
  user?: string | { name?: string; email?: string; username?: string };
  actor_name?: string;
  user_name?: string;
  name?: string;
  username?: string;
  actor_email?: string;
  user_email?: string;
  email?: string;
  action?: string;
  event?: string;
  action_type?: string;
  activity?: string;
  operation?: string;
  resource?: string | { primary?: string; category?: string; name?: string; type?: string };
  target?: string;
  entity?: string;
  category?: string;
  module?: string;
  time?: string;
  created_at?: string;
  createdAt?: string;
  timestamp?: string;
  date?: string;
  datetime?: string;
  result?: string | boolean;
  status?: string | number;
  success?: boolean;
  severity?: string;
  level?: string;
}

/**
 * Extracts the array of audit logs from a backend ResponseEnvelope or direct array
 */
export function extractListFromResponse(response: unknown): RawAuditItem[] {
  if (Array.isArray(response)) {
    return response as RawAuditItem[];
  }
  if (!response || typeof response !== "object") {
    return [];
  }

  const res = response as Record<string, unknown>;

  if (Array.isArray(res.data)) {
    return res.data as RawAuditItem[];
  }

  if (res.data && typeof res.data === "object") {
    const dataObj = res.data as Record<string, unknown>;
    if (Array.isArray(dataObj.items)) return dataObj.items as RawAuditItem[];
    if (Array.isArray(dataObj.logs)) return dataObj.logs as RawAuditItem[];
    if (Array.isArray(dataObj.audit_logs)) return dataObj.audit_logs as RawAuditItem[];
    if (Array.isArray(dataObj.records)) return dataObj.records as RawAuditItem[];
    if (Array.isArray(dataObj.data)) return dataObj.data as RawAuditItem[];
  }

  if (Array.isArray(res.items)) return res.items as RawAuditItem[];
  if (Array.isArray(res.logs)) return res.logs as RawAuditItem[];
  if (Array.isArray(res.audit_logs)) return res.audit_logs as RawAuditItem[];
  if (Array.isArray(res.records)) return res.records as RawAuditItem[];

  return [];
}

/**
 * Maps raw backend record to the standardized AuditEvent model
 */
export function mapAuditItem(rawItem: unknown, idx: number): AuditEvent {
  const item = (rawItem || {}) as RawAuditItem;

  // 1. Resolve Actor Name & Email
  let actorName = "System";
  let actorEmail = "";

  if (item.actor && typeof item.actor === "object") {
    actorName = String(item.actor.name || item.actor.username || item.actor.email || "System");
    actorEmail = String(item.actor.email || "");
  } else if (item.user && typeof item.user === "object") {
    actorName = String(item.user.name || item.user.username || item.user.email || "System");
    actorEmail = String(item.user.email || "");
  } else {
    actorName = String(
      item.actor_name ??
      item.user_name ??
      item.name ??
      item.username ??
      item.user ??
      item.actor ??
      "System",
    );
    actorEmail = String(
      item.actor_email ??
      item.user_email ??
      item.email ??
      "",
    );
  }

  if (actorName.includes("@") && !actorEmail) {
    actorEmail = actorName;
    actorName = actorName.split("@")[0];
  }

  const initials = (actorName[0] || actorEmail[0] || "S").toUpperCase();

  // 2. Resolve Action
  const action = String(
    item.action ??
    item.event ??
    item.action_type ??
    item.activity ??
    item.operation ??
    "System Event",
  );

  // 3. Resolve Resource & Category
  let primaryResource = "Workspace";
  let category = "Access Control";

  if (item.resource && typeof item.resource === "object") {
    primaryResource = String(item.resource.primary || item.resource.name || "Workspace");
    category = String(item.resource.category || item.resource.type || "Access Control");
  } else if (item.resource) {
    primaryResource = String(item.resource);
    if (item.category) category = String(item.category);
  } else if (item.target) {
    primaryResource = String(item.target);
    if (item.category) category = String(item.category);
  } else if (item.entity) {
    primaryResource = String(item.entity);
    if (item.category) category = String(item.category);
  } else if (item.category) {
    category = String(item.category);
  }

  // 4. Resolve Timestamp & Formatted Time
  const rawTime =
    item.time ??
    item.timestamp ??
    item.created_at ??
    item.createdAt ??
    item.date ??
    item.datetime ??
    new Date().toISOString();

  const timeStr = String(rawTime);
  let formattedTime = timeStr;

  if (!isNaN(Date.parse(timeStr)) && (timeStr.includes("T") || timeStr.includes("-"))) {
    try {
      const d = new Date(timeStr);
      formattedTime = d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      formattedTime = timeStr;
    }
  }

  // 5. Resolve Result (Success / Failed)
  let result: "Success" | "Failed" = "Success";
  if (typeof item.success === "boolean") {
    result = item.success ? "Success" : "Failed";
  } else {
    const rawRes = String(item.result ?? item.status ?? "Success").toUpperCase();
    const isFailed =
      rawRes.includes("FAIL") ||
      rawRes.includes("ERR") ||
      rawRes.includes("DENIED") ||
      rawRes === "FALSE" ||
      rawRes.startsWith("4") ||
      rawRes.startsWith("5");
    result = isFailed ? "Failed" : "Success";
  }

  // 6. Resolve Severity
  const rawSev = String(item.severity ?? item.level ?? "Informational");
  let severity: "Informational" | "Warning" | "Critical" = "Informational";
  if (/crit|high|danger/i.test(rawSev)) {
    severity = "Critical";
  } else if (/warn|med/i.test(rawSev)) {
    severity = "Warning";
  }

  return {
    id: String(item.id ?? item.log_id ?? item.audit_id ?? `audit-${idx}`),
    actor: {
      name: actorName,
      email: actorEmail,
      initials,
    },
    action,
    resource: {
      primary: primaryResource,
      category,
    },
    time: formattedTime,
    timestamp: timeStr,
    result,
    severity,
  };
}

/**
 * Derives statistical indicators dynamically from actual audit events
 */
export function computeAuditStats(events: AuditEvent[]): AuditStats {
  const total = events.length;
  const successful = events.filter((e) => e.result === "Success").length;
  const failed = events.filter((e) => e.result === "Failed").length;

  const now = new Date();
  const todayCount = events.filter((e) => {
    const d = new Date(e.timestamp || e.time);
    return !isNaN(d.getTime()) && d.toDateString() === now.toDateString();
  }).length;

  const successPercent = total > 0 ? ((successful / total) * 100).toFixed(1) : "100";
  const failPercent = total > 0 ? ((failed / total) * 100).toFixed(1) : "0";

  return {
    totalEvents: {
      value: total.toLocaleString(),
      badge: `${total} logged`,
      subtitle: "total audit events",
    },
    successfulEvents: {
      value: successful.toLocaleString(),
      badge: `${successPercent}%`,
      subtitle: "completed successfully",
    },
    failedEvents: {
      value: failed.toLocaleString(),
      badge: `${failPercent}%`,
      subtitle: "failed or access errors",
    },
    eventsToday: {
      value: todayCount.toLocaleString(),
      badge: "Live",
      subtitle: "recorded today",
    },
  };
}

export const auditService = {
  /**
   * Retrieves and filters audit logs strictly from the real backend API:
   * GET /api/v1/audit/audit-logs
   */
  async getAuditLogs(filters?: AuditFilters): Promise<AuditEvent[]> {
    const params = new URLSearchParams();

    // Map filters to backend query parameters defined in OpenAPI
    if (filters?.user && filters.user !== "All users") {
      params.set("user", filters.user);
    }
    if (filters?.action && filters.action !== "All actions") {
      params.set("action", filters.action);
    }
    if (filters?.severity && filters.severity !== "All severities") {
      params.set("severity", filters.severity);
    }
    if (filters?.date && filters.date !== "All dates") {
      params.set("date", filters.date);
    }

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const rawResponse = await apiClient.get<unknown>(`${AUDIT_ROUTES.LIST}${queryStr}`);

    const rawList = extractListFromResponse(rawResponse);
    let events = rawList.map((item, idx) => mapAuditItem(item, idx));

    // Client/In-memory filtering for search, result status, and date range
    if (filters) {
      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        events = events.filter(
          (evt) =>
            evt.actor.name.toLowerCase().includes(query) ||
            evt.actor.email.toLowerCase().includes(query) ||
            evt.action.toLowerCase().includes(query) ||
            evt.resource.primary.toLowerCase().includes(query) ||
            evt.resource.category.toLowerCase().includes(query),
        );
      }

      if (filters.result && filters.result !== "All results") {
        events = events.filter((evt) => evt.result === filters.result);
      }

      if (filters.dateRange && filters.dateRange !== "All dates") {
        const now = new Date();
        if (filters.dateRange === "Today") {
          events = events.filter((evt) => {
            const d = new Date(evt.timestamp || evt.time);
            return !isNaN(d.getTime()) && d.toDateString() === now.toDateString();
          });
        } else if (filters.dateRange === "Last 7 days") {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          events = events.filter((evt) => {
            const d = new Date(evt.timestamp || evt.time);
            return !isNaN(d.getTime()) && d >= sevenDaysAgo;
          });
        } else if (filters.dateRange === "Last 30 days") {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          events = events.filter((evt) => {
            const d = new Date(evt.timestamp || evt.time);
            return !isNaN(d.getTime()) && d >= thirtyDaysAgo;
          });
        }
      }
    }

    return events;
  },

  /**
   * Retrieves aggregate audit statistics derived directly from backend audit logs
   */
  async getAuditStats(filters?: AuditFilters): Promise<AuditStats> {
    const events = await this.getAuditLogs(filters);
    return computeAuditStats(events);
  },

  /**
   * Generates a downloadable CSV export of audit logs fetched from backend
   */
  async exportAuditLogs(filters?: AuditFilters) {
    const logs = await this.getAuditLogs(filters);
    const headers = [
      "Event ID",
      "Actor Name",
      "Actor Email",
      "Action",
      "Resource",
      "Category",
      "Timestamp",
      "Result",
      "Severity",
    ];

    const rows = logs.map((log) => [
      `"${log.id}"`,
      `"${log.actor.name}"`,
      `"${log.actor.email}"`,
      `"${log.action}"`,
      `"${log.resource.primary}"`,
      `"${log.resource.category}"`,
      `"${log.time || log.timestamp || ""}"`,
      `"${log.result}"`,
      `"${log.severity || "Informational"}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const filename = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;

    return {
      success: true,
      filename,
      csvContent,
      message: `Export completed. Downloaded ${logs.length} audit records.`,
    };
  },
};
