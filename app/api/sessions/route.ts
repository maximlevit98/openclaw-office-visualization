import { listSessions, type Session } from "@/lib/gateway-adapter";
import { NextRequest, NextResponse } from "next/server";
import { getQueryParam, errorResponse, successResponse } from "@/lib/api-utils";

/**
 * GET /api/sessions
 * List all active sessions with optional filters
 */
export async function GET(request: NextRequest): Promise<NextResponse<Session[] | { error: string; details?: string }>> {
  try {
    const filters: Record<string, unknown> = {};

    // Extract query params if present
    const activeMinutes = getQueryParam(request, "activeMinutes", false);
    if (activeMinutes) {
      filters.activeMinutes = parseInt(activeMinutes, 10);
    }

    const limit = getQueryParam(request, "limit", false);
    if (limit) {
      filters.limit = parseInt(limit, 10);
    }

    const sessions = await listSessions(filters);
    return successResponse(sessions);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to list sessions:", message);
    return errorResponse("Failed to list sessions", message, 500);
  }
}
