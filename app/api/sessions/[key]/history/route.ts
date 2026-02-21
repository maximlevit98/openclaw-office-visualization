import { getSessionHistory, type Message } from "@/lib/gateway-adapter";
import { NextRequest, NextResponse } from "next/server";
import { getQueryParam, getPathParam, errorResponse, successResponse } from "@/lib/api-utils";

/**
 * GET /api/sessions/[key]/history
 * Fetch message history for a session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
): Promise<NextResponse<Message[] | { error: string; details?: string }>> {
  try {
    const { key } = await params;
    getPathParam({ key }, "key", true);

    const limit = getQueryParam(request, "limit", false);
    const history = await getSessionHistory(
      key,
      limit ? parseInt(limit, 10) : undefined
    );

    return successResponse(history);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to fetch session history:", message);
    return errorResponse("Failed to fetch session history", message, 500);
  }
}
