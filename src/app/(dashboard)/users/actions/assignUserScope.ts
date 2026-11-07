"use server";

import { revalidatePath } from "next/cache";
import { scopeService } from "@/services/scope.service";
import {
  UserScopeAssignmentRequest,
  UserScopeAssignmentResponse,
} from "@/types/scope.types";

/**
 * Server Action to assign jurisdictional scope to a user
 */
export async function assignUserScope(
  userId: string | number,
  payload: UserScopeAssignmentRequest,
): Promise<UserScopeAssignmentResponse> {
  const result = await scopeService.assignUserScope(userId, payload);
  revalidatePath("/users");
  return result;
}

