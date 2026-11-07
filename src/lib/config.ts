/**
 * Centralized Application Configuration
 * Reads the backend base URL strictly from process.env.BACKEND_BASE_URL
 */

export interface AppConfig {
  apiBaseUrl: string;
  isApi: boolean;
  isMock: boolean;
  dataMode: "api" | "mock";
}

export const getConfig = (): AppConfig => {
  const url = (process.env.BACKEND_BASE_URL || "").trim().replace(/\/+$/, "");

  return {
    apiBaseUrl: url,
    isApi: true,
    isMock: false,
    dataMode: "api",
  };
};
