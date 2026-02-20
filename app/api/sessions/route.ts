import { listSessions } from "@/lib/gateway-adapter";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/sessions
 * List all active sessions with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const filters: Record<string, unknown> = {};

    // Extract query params if present
    const activeMinutes = request.nextUrl.searchParams.get("activeMinutes");
    if (activeMinutes) {
      filters.activeMinutes = parseInt(activeMinutes, 10);
    }

    const limit = request.nextUrl.searchParams.get("limit");
    if (limit) {
      filters.limit = parseInt(limit, 10);
    }

    const sessions = await listSessions(filters);
    return NextResponse.json(sessions);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to list sessions:", message);
    return NextResponse.json(
      { error: "Failed to list sessions", details: message },
      { status: 500 }
    );
  }
}
