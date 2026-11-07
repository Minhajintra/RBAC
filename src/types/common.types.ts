/**
 * Shared Common Types for IntraShip UAM
 */

export interface StepItem {
  id: string;
  text: string;
}

export interface CurrentUser {
  name: string;
  role: string;
  initials: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

// Re-export modular types for convenience
export * from "@/app/(auth)/login/types/login.types";
export * from "@/app/(auth)/forgot-password/types/forgotPassword.types";
export * from "@/app/(auth)/verify-otp/types/verifyOtp.types";
export * from "@/app/(auth)/reset-password/types/resetPassword.types";
export * from "@/app/(dashboard)/dashboard/types/dashboard.types";
