import { apiClient } from "@/lib/api-client";
import {
  UserScopeAssignmentRequest,
  UserScopeAssignmentResponse,
  ScopeProvince,
  ScopeWorkspace,
} from "@/types/scope.types";

export const SCOPE_ROUTES = {
  ASSIGN: (userId: string | number) => `/api/v1/users/${userId}/scope`,
  BOUNDARIES: "/api/v1/gis/boundaries",
} as const;

export const scopeService = {
  /**
   * Assigns user jurisdictional scope via backend API:
   * PUT /api/v1/users/{userId}/scope
   */
  async assignUserScope(
    userId: string | number,
    payload: UserScopeAssignmentRequest,
  ): Promise<UserScopeAssignmentResponse> {
    const response = await apiClient.put<UserScopeAssignmentResponse>(
      SCOPE_ROUTES.ASSIGN(userId),
      payload,
    );
    return response;
  },

  /**
   * Retrieves real administrative boundaries from backend API:
   * GET /api/v1/gis/boundaries
   */
  async getBoundaries(level?: string): Promise<ScopeProvince[]> {
    try {
      const q = level ? `?level=${encodeURIComponent(level)}` : "";
      const res = await apiClient.get<Record<string, unknown>>(
        `${SCOPE_ROUTES.BOUNDARIES}${q}`,
      );
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? (res.data as Record<string, unknown>[])
          : Array.isArray((res?.data as Record<string, unknown>)?.items)
            ? ((res?.data as Record<string, unknown>).items as Record<string, unknown>[])
            : [];
      return list as unknown as ScopeProvince[];
    } catch (err: unknown) {
      console.error("[Scope Service] Error fetching boundaries from backend:", err);
      return [];
    }
  },

  getWorkspaces(): ScopeWorkspace[] {
    return [];
  },

  getProvinces(): ScopeProvince[] {
    return [];
  },
};
