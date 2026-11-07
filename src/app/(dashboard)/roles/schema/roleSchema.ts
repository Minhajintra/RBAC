import { z } from "zod";

/**
 * Zod validation schema for Role Creation and Modification
 */
export const roleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters.")
    .max(50, "Role name cannot exceed 50 characters."),
  description: z
    .string()
    .max(250, "Description cannot exceed 250 characters.")
    .optional(),
  program: z.string().optional(),
  status: z.string().optional(),
});

export type RoleSchemaType = z.infer<typeof roleSchema>;

