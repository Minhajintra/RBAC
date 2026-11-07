"use server";

import { revalidatePath } from "next/cache";
import { userService } from "@/services/user.service";
import { updateUserSchema } from "../schema/userSchema";
import { UpdateUserInput, ActionResponse, User } from "../types/user.types";

/**
 * Server Action to validate and update an existing user record
 */
export async function updateUser(
  idOrInput: string | number | UpdateUserInput,
  optionalInput?: UpdateUserInput,
): Promise<ActionResponse<User>> {
  const payload: UpdateUserInput =
    typeof idOrInput === "object" ? idOrInput : { id: String(idOrInput), ...(optionalInput || {}) };

  const validation = updateUserSchema.safeParse(payload);
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Validation failed.",
    };
  }

  const result = await userService.updateUser(payload.id, payload);
  if (result.success) {
    revalidatePath("/users");
    revalidatePath("/dashboard");
  }
  return result;
}
