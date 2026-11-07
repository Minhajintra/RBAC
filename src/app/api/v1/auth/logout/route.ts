import { POST as handleLogout } from "@/app/api/auth/logout/route";

export const dynamic = "force-dynamic";

/**
 * Route Handler for POST /api/v1/auth/logout
 * Direct OpenAPI compliant endpoint for revoking user session against backend
 */
export async function POST(request: Request) {
  return handleLogout(request);
}

