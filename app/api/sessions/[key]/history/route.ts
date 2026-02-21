import { getSessionHistory, type Message } from "@/lib/gateway-adapter";
import { NextRequest, NextResponse } from "next/server";
import {
  getPathParamValidated,
  getQueryParamAsPositiveInt,
  VALIDATION_LIMITS,
  errorResponse,
  successResponse,
} from "@/lib/api-utils";

/**
 * GET /api/sessions/[key]/history
 * Fetch message history for a session
 * 
 * Validation:
 * - Path param 'key' must be present and <= 256 chars
 * - Query param 'limit' must be a positive integer between 1-1000 (optional)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
): Promise<NextResponse<Message[] | { error: string; details?: string }>> {
  try {
    const { key } = await params;
    const sessionKey = getPathParamValidated({ key }, "key", { required: true });

    // Validate limit if provided
    const limit = getQueryParamAsPositiveInt(request, "limit", {
      required: false,
      min: VALIDATION_LIMITS.MIN_LIMIT,
      max: VALIDATION_LIMITS.MAX_LIMIT,
    });

    const history = await getSessionHistory(sessionKey, limit || undefined);

    return successResponse(history);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Return 400 for validation errors, 500 for other errors
    const isValidationError = errorMessage.includes("must be") || 
                              errorMessage.includes("exceeds") ||
                              errorMessage.includes("between");
    
    const status = isValidationError ? 400 : 500;
    
    console.error("Failed to fetch session history:", errorMessage);
    return errorResponse("Failed to fetch session history", errorMessage, status);
  }
}
