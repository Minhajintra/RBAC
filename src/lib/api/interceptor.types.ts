import { AxiosRequestConfig } from "axios";

/**
 * Types for API Interceptors and Errors
 */

export interface CustomInternalAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

export interface ApiErrorResponseData {
  detail?: string | Array<{ msg?: string }>;
  message?: string;
  success?: boolean;
  status_code?: number;
}
