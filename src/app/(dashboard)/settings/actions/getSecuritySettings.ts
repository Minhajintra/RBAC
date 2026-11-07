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

export async function getSecuritySettingsAction(): Promise<{
  settings: SecuritySettingsData;
  passwordPolicy: PasswordPolicyData;
}> {
  const token = await getAuthToken();
  const [settings, passwordPolicy] = await Promise.all([
    securityService.getSecuritySettings(token),
    securityService.getPasswordPolicy(),
  ]);

  return { settings, passwordPolicy };
}
