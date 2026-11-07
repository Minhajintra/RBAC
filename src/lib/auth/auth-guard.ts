import { getServerSessionToken } from "./session";

/**
 * Server and Client Auth Guard Helpers
 */

export async function verifyServerAuth(): Promise<{
  isAuthenticated: boolean;
  token: string | null;
}> {
  const token = await getServerSessionToken();
  return {
    isAuthenticated: Boolean(token),
    token,
  };
}

