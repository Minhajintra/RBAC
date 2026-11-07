"use server";

import { revalidatePath } from "next/cache";
import { userService } from "@/services/user.service";
import { createUserSchema } from "../schema/userSchema";
import { CreateUserInput, ActionResponse, User } from "../types/user.types";

/**
 * Server Action to validate and create a new user record
 */
export async function createUser(
  input: CreateUserInput,
): Promise<ActionResponse<User>> {
  const validation = createUserSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Validation failed.",
    };
  }

  const result = await userService.createUser(input);
  if (result.success) {
    revalidatePath("/users");
    revalidatePath("/dashboard");
  }
  return result;
}

