import {
  AuthUser,
  LoginRequest,
  LoginResponse,
} from "@/app/(auth)/login/types/login.types";

import {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from "@/app/(auth)/verify-otp/types/verifyOtp.types";

import {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
} from "@/app/(auth)/forgot-password/types/forgotPassword.types";

import {
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "@/app/(auth)/reset-password/types/resetPassword.types";

import { apiClient } from "@/lib/api-client";
import { authStorage } from "@/lib/auth-storage";

// Refresh token response
export interface RefreshResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  user?: AuthUser;
}

// Current user response
export interface CurrentUserResponse {
  success: boolean;
  user: AuthUser | null;
  message?: string;
}

export const authService = {
  // Login
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      "/api/auth/login",
      payload,
    );

    if (!response.success) {
      throw new Error(response.message || "Invalid email or password.");
    }

    return response;
  },

  // Verify OTP
  async verifyOtp(payload: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const response = await apiClient.post<VerifyOtpResponse>(
      "/api/auth/verify-otp",
      payload,
    );

    if (!response.success) {
      throw new Error(response.message || "Invalid verification code.");
    }

    if (response.accessToken) {
      authStorage.setAccessToken(response.accessToken);
    }

    return response;
  },

  // Refresh access token
  async refreshToken(): Promise<string> {
    try {
      const response = await apiClient.post<RefreshResponse>(
        "/api/auth/refresh",
        {},
      );

      if (!response.success || !response.accessToken) {
        throw new Error(response.message || "Session refresh failed.");
      }

      authStorage.setAccessToken(response.accessToken);

      return response.accessToken;
    } catch (error) {
      authStorage.clear();
      throw error;
    }
  },

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const response = await apiClient.get<CurrentUserResponse & { accessToken?: string }>("/api/auth/me");

      if (response.success && response.user) {
        if (response.accessToken) {
          authStorage.setAccessToken(response.accessToken);
        }
        return response.user;
      }

      return null;
    } catch {
      return null;
    }
  },

  // Logout
  async logout(): Promise<void> {
    try {
      const token = authStorage.getAccessToken();
      const headers: Record<string, string> = {};
      if (token && token !== "null" && token !== "undefined") {
        headers.Authorization = `Bearer ${token.replace(/^Bearer\s+/i, "").trim()}`;
      }
      await apiClient.post("/api/auth/logout", {}, { headers });
    } catch (error) {
      console.warn("Logout request failed:", error);
    }

    authStorage.clear();

    if (typeof window !== "undefined") {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }
  },

  // Send OTP
  async sendOtp(payload: SendOtpRequest = {}): Promise<SendOtpResponse> {
    const response = await apiClient.post<SendOtpResponse>(
      "/api/auth/send-otp",
      payload,
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to send OTP.");
    }

    return response;
  },

  // Forgot password
  async forgotPassword(
    payload: ForgotPasswordRequest,
  ): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post<ForgotPasswordResponse>(
      "/api/auth/forgot-password",
      payload,
    );

    if (!response.success) {
      throw new Error(response.message || "Password recovery failed.");
    }

    return response;
  },

  // Reset password
  async resetPassword(
    payload: ResetPasswordRequest,
  ): Promise<ResetPasswordResponse> {
    const response = await apiClient.post<ResetPasswordResponse>(
      "/api/auth/reset-password",
      payload,
    );

    if (!response.success) {
      throw new Error(response.message || "Password update failed.");
    }

    return response;
  },
};

export default authService;
