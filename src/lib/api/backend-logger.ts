/**
 * Terminal Logger for Backend Service Failures
 * Outputs clean diagnostics when the backend service is offline
 * Strictly redacts all passwords, access tokens, and sensitive credentials
 */
export function logBackendErrorToTerminal(params: {
  action: string;
  endpoint?: string;
  baseUrl?: string;
  status?: number;
  message?: string;
  error?: unknown;
}) {
  const timestamp = new Date().toISOString();
  const divider = "=".repeat(78);
  const status = params.status || 500;
  const endpoint = params.endpoint || "Unknown Endpoint";
  const baseUrl = params.baseUrl || "BACKEND_BASE_URL (Not connected)";

  // Sanitize message to never leak tokens, passwords, or verification codes
  const sanitize = (text?: string): string => {
    if (!text) return "";
    return text
      .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [REDACTED]")
      .replace(/"password"\s*:\s*"[^"]*"/gi, '"password":"[REDACTED]"')
      .replace(/"token"\s*:\s*"[^"]*"/gi, '"token":"[REDACTED]"')
      .replace(/"access_token"\s*:\s*"[^"]*"/gi, '"access_token":"[REDACTED]"')
      .replace(/"refresh_token"\s*:\s*"[^"]*"/gi, '"refresh_token":"[REDACTED]"')
      .replace(/"otp(?:_code)?"\s*:\s*"[^"]*"/gi, '"otp":"[REDACTED]"')
      .replace(/"otp(?:_code)?"\s*:\s*\d+/gi, '"otp":"[REDACTED]"');
  };

  console.error(`\n${divider}`);
  console.error(`  [INTRASHIP UAM - BACKEND SERVICE DIAGNOSTIC]`);
  console.error(`  HTTP Status : ${status}`);
  console.error(divider);
  console.error(`  Timestamp   : ${timestamp}`);
  console.error(`  Operation   : ${params.action}`);
  console.error(`  Endpoint    : ${endpoint}`);
  console.error(`  Target Host : ${baseUrl}`);
  if (params.message) {
    console.error(`  Server Msg  : ${sanitize(params.message)}`);
  }
  if (params.error instanceof Error) {
    console.error(`  Exception   : ${params.error.name} - ${sanitize(params.error.message)}`);
  }
  console.error(`${divider}\n`);
}
