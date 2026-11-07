"use server";

import { userService } from "@/services/user.service";
import { UserFilterParams, UsersListResponse } from "../types/user.types";

/**
 * Server Action to fetch users with optional search, filters, and pagination
 */
export async function getUsers(
  params: UserFilterParams = {},
): Promise<UsersListResponse> {
  return userService.getUsers(params);
}

