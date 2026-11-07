"use server";

import { getUsers as _getUsers } from "./getUsers";
import { getUserStats as _getUserStats } from "./getUserStats";
import { createUser as _createUser } from "./createUser";
import { updateUser as _updateUser } from "./updateUser";
import { toggleUserStatus as _toggleUserStatus } from "./toggleUserStatus";
import { deleteUser as _deleteUser } from "./deleteUser";
import { assignUserScope as _assignUserScope } from "./assignUserScope";
import {
  UserFilterParams,
  CreateUserInput,
  UpdateUserInput,
} from "../types/user.types";
import { UserScopeAssignmentRequest } from "@/types/scope.types";

export async function getUsersAction(params: UserFilterParams = {}) {
  return _getUsers(params);
}

export async function getUserStatsAction() {
  return _getUserStats();
}

export async function createUserAction(input: CreateUserInput) {
  return _createUser(input);
}

export async function updateUserAction(
  idOrInput: string | number | UpdateUserInput,
  optionalInput?: UpdateUserInput,
) {
  return _updateUser(idOrInput, optionalInput);
}

export async function toggleUserStatusAction(id: string | number) {
  return _toggleUserStatus(id);
}

export async function deleteUserAction(id: string | number) {
  return _deleteUser(id);
}

export async function assignUserScopeAction(
  userId: string | number,
  payload: UserScopeAssignmentRequest,
) {
  return _assignUserScope(userId, payload);
}
