import { listSessions, type Session } from "@/lib/gateway-adapter";
import { NextRequest, NextResponse } from "next/server";
import { getQueryParam, errorResponse, successResponse } from "@/lib/api-utils";

/**
 * GET /api/sessions
 * List all active sessions with optional filters
 * 
 * Query parameters (optional):
 * - limit: Maximum number of sessions to return (default: no limit)
 * - activeMinutes: Only return sessions active in last N minutes
 * - kinds: Comma-separated session kinds to filter by (e.g., "agent,user")
 * 
 * Examples:
 * - GET /api/sessions → all sessions
 * - GET /api/sessions?limit=10 → first 10 sessions
 * - GET /api/sessions?activeMinutes=30 → active in last 30 min
 * - GET /api/sessions?kinds=agent,user → filter by kind
 */
export async function GET(request: NextRequest): Promise<NextResponse<Session[] | { error: string; details?: string }>> {
  try {
    const filters: Record<string, unknown> = {};

    // Extract query params if present
    const activeMinutes = getQueryParam(request, "activeMinutes", false);
    if (activeMinutes) {
      const minutes = parseInt(activeMinutes, 10);
      if (!isNaN(minutes) && minutes > 0) {
        filters.activeMinutes = minutes;
      }
    }

    const limit = getQueryParam(request, "limit", false);
    if (limit) {
      const count = parseInt(limit, 10);
      if (!isNaN(count) && count > 0) {
        filters.limit = count;
      }
    }

    const kinds = getQueryParam(request, "kinds", false);
    if (kinds) {
      filters.kinds = kinds.split(",").map((k) => k.trim());
    }

    const sessions = await listSessions(filters);
    return successResponse(sessions);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to list sessions:", message);
    return errorResponse("Failed to list sessions", message, 500);
  }
}
