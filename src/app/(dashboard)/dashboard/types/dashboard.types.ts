/**
 * Data contracts for UAM Dashboard
 * Shared between Mock Service and Backend API Client
 */

export interface DashboardKpiItem {
  id: string;
  title: string;
  value: string;
  badge: string;
  badgeType: "success" | "warning" | "danger" | "neutral";
  comparison: string;
  iconType: "user" | "role" | "request" | "audit";
  graphicType: "sparkline" | "bars" | "progressDonut";
  progressValue?: number;
  progressLabel?: string;
  iconBg: string;
  iconColor: string;
}

export interface RoleUserItem {
  name: string;
  count: number;
  percent: number;
  color: string;
}

export interface RoleUsersResponse {
  title: string;
  subtitle: string;
  totalUsers: string;
  roles: RoleUserItem[];
}

export type LoginAttemptsPeriod = "daily" | "monthly";

export interface LoginAttemptDataPoint {
  period: string; // e.g. "Mon", "Tue" or "May", "Jun"
  successful: number;
  failed: number;
  total: number;
}

export interface LoginAttemptsResponse {
  title: string;
  subtitle: string;
  period: LoginAttemptsPeriod;
  categories: string[];
  successful: number[];
  failed: number[];
  chartData: LoginAttemptDataPoint[];
  totalSuccessful: number;
  totalFailed: number;
  successRate: string;
  peakPeriod: string;
}

export interface InterfaceAccessItem {
  id: string;
  name: string;
  count: number;
  percent: number;
  color: string;
  trend: string;
  description: string;
}

export interface InterfaceAccessResponse {
  title: string;
  subtitle: string;
  totalRequests: string;
  timeframe: string;
  interfaces: InterfaceAccessItem[];
}

export interface LoginHistoryRecord {
  id: string;
  userName: string;
  userEmail: string;
  userInitials: string;
  userRole: string;
  interface: "Web Portal" | "Mobile App" | "Admin CLI" | "API Gateway";
  ipAddress: string;
  location: string;
  device: string;
  timestamp: string;
  status: "Success" | "Failed" | "MFA Required" | "Blocked";
  failureReason: string | null;
}

export interface LoginHistoryFilters {
  status?: string;
  interface?: string;
  search?: string;
  dateRange?: string;
}

export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface LoginHistoryResponse {
  title: string;
  subtitle: string;
  records: LoginHistoryRecord[];
  pagination: PaginationMeta;
  filterOptions: {
    statusOptions: string[];
    interfaceOptions: string[];
    dateRangeOptions: string[];
  };
}
