"use server";

import { userService } from "@/services/user.service";
import { UserStats } from "../types/user.types";

/**
 * Server Action to fetch aggregate user statistics
 */
export async function getUserStats(): Promise<UserStats> {
  return userService.getUserStats();
}

