import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api-client";

/**
 * Health check endpoint for verifying backend configuration
 */
export async function GET() {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    return NextResponse.json(
      { alive: false, message: "BACKEND_BASE_URL is not configured in environment variables." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    alive: true,
    message: "Backend configuration is active.",
  });
}
