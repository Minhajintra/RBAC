import { AxiosError, AxiosResponse } from "axios";
import { CustomInternalAxiosRequestConfig } from "./interceptor.types";
import { refreshAccessToken } from "@/lib/auth/token-refresh";
import { logBackendErrorToTerminal } from "./backend-logger";

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status = 500, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function onResponse(response: AxiosResponse): AxiosResponse {
  return response;
}

/**
 * Handles responses and standardizes HTTP 401, 403, 404, 502 errors.
 * Preserves exact status codes rather than collapsing authorization errors into 500.
 */
export async function onResponseError(error: AxiosError) {
  const originalRequest = error.config as CustomInternalAxiosRequestConfig | undefined;
  const status = error.response?.status;
  const data = error.response?.data as Record<string, unknown> | undefined;

  // Coordinate token refresh on 401 Unauthorized (exclude auth endpoints to prevent recursion)
  const isAuthUrl =
    originalRequest?.url?.includes("/api/auth/login") ||
    originalRequest?.url?.includes("/api/auth/refresh") ||
    originalRequest?.url?.includes("/api/v1/auth/login") ||
    originalRequest?.url?.includes("/api/v1/auth/token/refresh");

  if (status === 401 && originalRequest && !originalRequest._retry && !isAuthUrl) {
    originalRequest._retry = true;
    try {
      const newToken = await refreshAccessToken();
      if (newToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        const { axiosInstance } = await import("./api-client");
        return axiosInstance(originalRequest);
      }
    } catch {
      // Refresh token failed, proceed to handle 401
    }
  }

  // Network connection failures (offline server, timeout, DNS resolution failure)
  const isNetworkFailure =
    !error.response ||
    error.code === "ECONNABORTED" ||
    error.code === "ECONNREFUSED" ||
    error.code === "ENOTFOUND" ||
    error.code === "ERR_NETWORK" ||
    error.message?.includes("Network Error") ||
    error.message?.includes("timeout");

  let resolvedStatus = status || (isNetworkFailure ? 502 : 500);

  // Extract backend detail message if present
  let customDetail = "";
  if (typeof data?.detail === "string") {
    customDetail = data.detail;
  } else if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
    customDetail = String(data.detail[0].msg);
  } else if (typeof data?.message === "string") {
    customDetail = data.message;
  }

  let message = "";

  if (isNetworkFailure || resolvedStatus === 502 || resolvedStatus === 503) {
    resolvedStatus = 502;
    message = customDetail || "Backend service is currently unavailable. Please verify that the backend server is running.";
    if (typeof window === "undefined") {
      logBackendErrorToTerminal({
        action: `${originalRequest?.method?.toUpperCase() || "REQUEST"} ${originalRequest?.url || ""}`,
        endpoint: originalRequest?.url,
        baseUrl: String(originalRequest?.baseURL || ""),
        status: 502,
        message,
      });
    }
  } else if (resolvedStatus === 401) {
    message = customDetail || "Session expired or unauthorized. Please log in again.";
  } else if (resolvedStatus === 403) {
    message = customDetail || "You do not have permission to perform this action.";
  } else if (resolvedStatus === 404) {
    message = customDetail || "The requested resource was not found on the backend service.";
  } else if (resolvedStatus === 400) {
    message = customDetail || "Invalid request payload. Please verify your inputs.";
  } else if (resolvedStatus === 409) {
    message = customDetail || "A conflict occurred with an existing resource.";
  } else if (resolvedStatus === 422) {
    message = customDetail || "Unprocessable entity. Please verify request parameters.";
  } else if (resolvedStatus === 429) {
    message = customDetail || "Too many requests. Please slow down and try again.";
  } else if (resolvedStatus >= 500) {
    resolvedStatus = 500;
    message = customDetail || "Internal server error occurred on backend service.";
  } else {
    message = customDetail || error.message || "An unexpected error occurred.";
  }

  return Promise.reject(new ApiError(message, resolvedStatus, data));
}
