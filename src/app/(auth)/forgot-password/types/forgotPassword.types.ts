/**
 * Data contracts for Password Recovery
 */

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}
