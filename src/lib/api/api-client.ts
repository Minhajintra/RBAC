import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { onRequest, onRequestError, getBaseUrl } from "./request.interceptor";
import { onResponse, onResponseError, ApiError } from "./response.interceptor";
import { logBackendErrorToTerminal } from "./backend-logger";

export { ApiError, getBaseUrl, logBackendErrorToTerminal };

export const getBackendUrl = (path: string): string => {
  const currentBase = getBaseUrl();
  if (!currentBase) {
    throw new Error("BACKEND_BASE_URL is not configured.");
  }
  const endpoint = path.startsWith("/") ? path : `/${path}`;
  return `${currentBase}${endpoint}`;
};

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Attach interceptors
axiosInstance.interceptors.request.use(onRequest, onRequestError);
axiosInstance.interceptors.response.use(onResponse, onResponseError);

export interface BackendResponseEnvelope {
  success?: boolean;
  message?: string;
  detail?: string | Array<{ msg?: string }>;
  data?: Record<string, unknown> & {
    access_token?: string;
    refresh_token?: string;
    accessToken?: string;
    refreshToken?: string;
    token?: string;
    jwt?: string;
    otp?: string | number;
    otp_code?: string | number;
    code?: string | number;
    email?: string;
    user?: {
      email?: string;
      name?: string;
      role?: string;
    };
  };
  access_token?: string;
  accessToken?: string;
  refresh_token?: string;
  refreshToken?: string;
  token?: string;
  jwt?: string;
  otp?: string | number;
  otp_code?: string | number;
  code?: string | number;
  email?: string;
  user?: {
    email?: string;
    name?: string;
    role?: string;
  };
}

/**
 * Robust helper to query backend across primary and candidate fallback paths
 */
export async function postToBackend(
  endpoints: string[],
  payload: Record<string, unknown>,
  options?: { headers?: Record<string, string>; timeout?: number },
): Promise<AxiosResponse<BackendResponseEnvelope>> {
  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const response = await axiosInstance.post<BackendResponseEnvelope>(
        endpoint,
        payload,
        {
          headers: options?.headers,
          timeout: options?.timeout || 10000,
        },
      );
      if (response && response.status >= 200 && response.status < 300) {
        return response;
      }
    } catch (err: unknown) {
      lastError = err;
      const errWithStatus = err as { status?: number; response?: { status?: number } };
      const status = errWithStatus?.status || errWithStatus?.response?.status;
      // If 400, 401, 403 or 422 with credentials error, do not retry other paths
      if (status === 400 || status === 401 || status === 403 || status === 422) {
        throw err;
      }
    }
  }

  const base = getBaseUrl();
  logBackendErrorToTerminal({
    action: "HTTP POST Request",
    endpoint: endpoints.join(" | "),
    baseUrl: base,
    status: 500,
    message: "Unable to establish connection to backend service.",
    error: lastError,
  });

  throw lastError || new Error("500 Internal Server Error: Failed to communicate with backend service.");
}

/**
 * Standard typed HTTP methods
 */
export const apiClient = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.get<T>(url, config);
    return response.data;
  },

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.post<T>(url, data, config);
    return response.data;
  },

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.put<T>(url, data, config);
    return response.data;
  },

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.patch<T>(url, data, config);
    return response.data;
  },

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.delete<T>(url, config);
    return response.data;
  },
};
