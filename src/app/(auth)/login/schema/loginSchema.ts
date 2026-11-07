import { z } from "zod";

// Zod error issues ko field errors map mein convert karna
export function getFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const fieldName = issue.path[0]?.toString() || "general";
    if (!errors[fieldName]) {
      errors[fieldName] = issue.message;
    }
  }
  return errors;
}

// Login form inputs ka validation schema
export const loginSchema = z.object({
  identifier: z
    .string("Enter your email or username to continue.")
    .trim()
    .min(1, "Enter your email or username to continue."),
  password: z
    .string("Enter your password to continue.")
    .min(1, "Enter your password to continue."),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
