import { z } from "zod";

// Registered email format ka validation schema
export const forgotPasswordSchema = z.object({
  email: z
    .string("Registered email is required.")
    .trim()
    .min(1, "Registered email is required.")
    .email("Check the email address format (e.g. name@example.com)."),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
