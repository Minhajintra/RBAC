"use server";

import { cookies } from "next/headers";
import { securityService } from "@/services/security.service";
import { SecuritySettingsData, PasswordPolicyData } from "../types/security.types";

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

export async function saveSecuritySettingsAction(
  settings: Partial<SecuritySettingsData>,
  passwordPolicy?: Partial<PasswordPolicyData>,
) {
  const token = await getAuthToken();
  const result = await securityService.saveSecuritySettings(settings, token);
  if (passwordPolicy) {
    await securityService.savePasswordPolicy(passwordPolicy, token);
  }
  return result;
}
