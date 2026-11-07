"use server";

import { cookies } from "next/headers";
import { securityService } from "@/services/security.service";

async function getAuthToken(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return (
      cookieStore.get("uam_auth_token")?.value ||
      cookieStore.get("token")?.value ||
      cookieStore.get("access_token")?.value
    );
  } catch {
    return undefined;
  }
}

export async function triggerGlobalLogoutAction() {
  const token = await getAuthToken();
  return await securityService.triggerGlobalLogout(token);
}
