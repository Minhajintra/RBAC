import { z } from "zod";

// 6-digit numeric OTP code validation schema
export const otpSchema = z.object({
  otp: z
    .string("Please enter your 6-digit verification code.")
    .trim()
    .min(1, "Please enter your 6-digit verification code.")
    .regex(/^\d{6}$/, "Verification code must be exactly 6 numeric digits."),
});

export type OtpInput = z.infer<typeof otpSchema>;
