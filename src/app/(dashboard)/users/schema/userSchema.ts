import { z } from "zod";

export const userStatusEnum = z.enum(["Active", "Pending", "Inactive"], {
  message: "Please select a valid user status.",
});

export const userFormSchema = z.object({
  name: z
    .string()
    .min(2, "Full name must be at least 2 characters long.")
    .max(100, "Full name cannot exceed 100 characters.")
    .trim(),
  email: z
    .string()
    .min(1, "Email address is required.")
    .email("Please enter a valid email address.")
    .toLowerCase()
    .trim(),
  status: userStatusEnum,
  role: z.string().min(1, "Please select a configured user type/role."),
  notificationAlerts: z.boolean().optional(),
  emailMfa: z.boolean().optional(),
  smsMfa: z.boolean().optional(),
  deviceBinding: z.boolean().optional(),
  deviceId: z.string().optional(),
  accessEnvironment: z.string().optional(),
  assignedRoles: z.array(z.string()).optional(),
});

export const createUserSchema = userFormSchema;

export const updateUserSchema = userFormSchema.extend({
  id: z.string().min(1, "User ID is required for update."),
});

export type UserFormData = z.infer<typeof userFormSchema>;
export type CreateUserSchemaType = z.infer<typeof createUserSchema>;
export type UpdateUserSchemaType = z.infer<typeof updateUserSchema>;

export function getZodFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path[0];
    if (path && typeof path === "string" && !errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}
