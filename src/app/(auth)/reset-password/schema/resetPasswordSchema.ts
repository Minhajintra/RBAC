import { z } from "zod";

// Password complexity aur matching confirmation ka validation schema
export const resetPasswordSchema = z
  .object({
    password: z
      .string("Please enter a new password.")
      .min(6, "Password must be at least 6 characters long."),
    confirmPassword: z
      .string("Please re-enter your password to confirm.")
      .min(1, "Please re-enter your password to confirm."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match. Please re-enter.",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
