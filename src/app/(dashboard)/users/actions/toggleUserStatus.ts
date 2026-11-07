"use server";

import { revalidatePath } from "next/cache";
import { userService } from "@/services/user.service";
import { ActionResponse, User } from "../types/user.types";

/**
 * Server Action to toggle user active / inactive status
 */
export async function toggleUserStatus(
  id: string | number,
): Promise<ActionResponse<User>> {
  const result = await userService.toggleStatus(id);
  if (result.success) {
    revalidatePath("/users");
    revalidatePath("/dashboard");
  }
  return result;
}

