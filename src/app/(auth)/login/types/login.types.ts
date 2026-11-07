/**
 * Data contracts for Authentication & Login
 */

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role: string;
  initials?: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  requiresOtp?: boolean;
  accessToken?: string;
  otpSent?: boolean;
}
