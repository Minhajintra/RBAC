/**
 * Data contracts for Password Reset
 */

export interface ResetPasswordRequest {
  password: string;
  confirmPassword?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}
