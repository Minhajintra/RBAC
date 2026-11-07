"use server";

import { revalidatePath } from "next/cache";
import { userService } from "@/services/user.service";
import { ActionResponse } from "../types/user.types";

/**
 * Server Action to delete a user record
 */
export async function deleteUser(
  id: string | number,
): Promise<ActionResponse<{ id: string | number }>> {
  const result = await userService.deleteUser(id);
  if (result.success) {
    revalidatePath("/users");
    revalidatePath("/dashboard");
  }
  return result;
}

