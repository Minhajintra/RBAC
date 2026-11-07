/**
 * TypeScript types for Security Settings module (FG-UAM-16)
 */

export interface SecuritySettingsData {
  webSessionTimeout: string;
  webSessionTimeoutOptions: string[];
  mobileSessionTimeout: string;
  mobileSessionTimeoutOptions: string[];
  passwordComplexity: boolean;
  configuredPolicyText: string;
  activeSessions: number;
  lastGlobalLogout: string | null;
}

export interface PasswordPolicyData {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  maxAgeDays: number;
  historyLimit: number;
  lockoutAttempts: number;
  lockoutDurationMinutes: number;
  summary: string;
}

export interface SecuritySettingsState {
  settings: SecuritySettingsData;
  passwordPolicy: PasswordPolicyData;
  activeTab: "settings" | "password-config";
  showLogoutModal: boolean;
  isSaving: boolean;
  isLoggingOut: boolean;
  feedbackMessage: {
    type: "success" | "error" | "info";
    text: string;
  } | null;
}

