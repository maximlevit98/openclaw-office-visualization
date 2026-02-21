import { sendToSession, type SendResponse } from "@/lib/gateway-adapter";
import { NextRequest, NextResponse } from "next/server";
import { getPathParam, parseJSONBody, errorResponse, successResponse } from "@/lib/api-utils";

interface SendRequest {
  message: string;
  timeoutSeconds?: number;
}

/**
 * POST /api/sessions/[key]/send
 * Send a message to a session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
): Promise<NextResponse<SendResponse | { error: string; details?: string }>> {
  try {
    const { key } = await params;
    getPathParam({ key }, "key", true);

    const body = await parseJSONBody<SendRequest>(request);
    const { message, timeoutSeconds } = body;

    if (!message) {
      return errorResponse("Message is required", undefined, 400);
    }

    const result = await sendToSession(key, message, timeoutSeconds);
    return successResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to send message to session:", message);
    return errorResponse("Failed to send message", message, 500);
  }
}
