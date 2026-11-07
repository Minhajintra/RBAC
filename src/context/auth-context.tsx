"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import {
  AuthUser,
  LoginRequest,
  LoginResponse,
} from "@/app/(auth)/login/types/login.types";

import {
  VerifyOtpRequest,
  VerifyOtpResponse,
} from "@/app/(auth)/verify-otp/types/verifyOtp.types";

import { authService } from "@/services/auth.service";
import { authStorage } from "@/lib/auth-storage";

// Auth data
export interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (data: LoginRequest) => Promise<LoginResponse>;
  verifyOtp: (data: VerifyOtpRequest) => Promise<VerifyOtpResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  setAuthSession: (user: AuthUser, token?: string) => void;
  clearAuthSession: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Share auth data
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const [accessToken, setAccessToken] = useState<string | null>(() =>
    authStorage.getAccessToken(),
  );

  const [isLoading, setIsLoading] = useState(true);

  // Check user when app starts
  useEffect(() => {
    let active = true;

    async function checkUser() {
      try {
        const userData = await authService.getCurrentUser();

        if (!active) return;

        if (userData) {
          setUser(userData);
          const restored = authStorage.getAccessToken();
          if (restored) {
            setAccessToken(restored);
          }

          // Safely attempt session token refresh without breaking existing valid user state
          try {
            const token = await authService.refreshToken();
            if (active && token) {
              setAccessToken(token);
            }
          } catch {
            // Background refresh is optional; do not invalidate authenticated user session
          }
        } else {
          setUser(null);
          setAccessToken(null);
          authStorage.clear();
          if (typeof window !== "undefined") {
            const currentPath = window.location.pathname;
            const isProtected =
              currentPath.startsWith("/dashboard") ||
              currentPath.startsWith("/users") ||
              currentPath.startsWith("/roles") ||
              currentPath.startsWith("/audit") ||
              currentPath.startsWith("/settings");
            if (isProtected) {
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.href = "/login?error=server_offline";
              return;
            }
          }
        }
      } catch {
        if (active) {
          setUser(null);
          setAccessToken(null);
          authStorage.clear();
          if (typeof window !== "undefined") {
            const currentPath = window.location.pathname;
            const isProtected =
              currentPath.startsWith("/dashboard") ||
              currentPath.startsWith("/users") ||
              currentPath.startsWith("/roles") ||
              currentPath.startsWith("/audit") ||
              currentPath.startsWith("/settings");
            if (isProtected) {
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.href = "/login?error=server_offline";
              return;
            }
          }
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    checkUser();

    return () => {
      active = false;
    };
  }, []);

  // Update token when storage changes
  useEffect(() => {
    const stop = authStorage.subscribe((token) => {
      setAccessToken(token);
    });

    return () => stop();
  }, []);

  // Login
  const login = (data: LoginRequest) => {
    return authService.login(data);
  };

  // Check OTP
  const verifyOtp = async (data: VerifyOtpRequest) => {
    const result = await authService.verifyOtp(data);

    if (result.success && result.user) {
      setUser(result.user);

      if (result.accessToken) {
        setAccessToken(result.accessToken);
        authStorage.setAccessToken(result.accessToken);
      }
    }

    return result;
  };

  // Get new token
  const refreshSession = async () => {
    try {
      const token = await authService.refreshToken();
      setAccessToken(token);
      return token;
    } catch {
      setUser(null);
      setAccessToken(null);
      return null;
    }
  };

  // Save login data
  const setAuthSession = (newUser: AuthUser, token?: string) => {
    setUser(newUser);

    if (token) {
      setAccessToken(token);
      authStorage.setAccessToken(token);
    }
  };

  // Clear login data
  const clearAuthSession = () => {
    setUser(null);
    setAccessToken(null);
    authStorage.clear();
  };

  // Logout
  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      clearAuthSession();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        verifyOtp,
        logout,
        refreshSession,
        setAuthSession,
        clearAuthSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Get auth data anywhere with SSR resilience
export function useAuth(): AuthContextType {
  const auth = useContext(AuthContext);

  if (!auth) {
    return {
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => ({ success: false, requiresOtp: false, message: "AuthProvider not mounted" }),
      verifyOtp: async () => ({ success: false, message: "AuthProvider not mounted" }),
      logout: async () => {},
      refreshSession: async () => null,
      setAuthSession: () => {},
      clearAuthSession: () => {},
    };
  }

  return auth;
}

export default AuthContext;
