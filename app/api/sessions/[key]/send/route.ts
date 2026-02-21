import { sendToSession, type SendResponse } from "@/lib/gateway-adapter";
import { NextRequest, NextResponse } from "next/server";
import {
  getPathParamValidated,
  parseJSONBody,
  validateMessage,
  errorResponse,
  successResponse,
} from "@/lib/api-utils";
import { globalSessionRateLimiter, globalRequestLogger } from "@/lib/rate-limiter";

interface SendRequest {
  message: string;
  timeoutSeconds?: number;
}

interface SendErrorResponse {
  error: string;
  details?: string;
  retryAfterMs?: number;
}

/**
 * POST /api/sessions/[key]/send
 * Send a message to a session
 * 
 * Validation & Protection:
 * - Path param 'key' must be present and <= 256 chars
 * - Body must contain 'message' string (1-10000 chars)
 * - Rate limiting: 20 messages per 60 seconds per session
 * - Returns 429 (Too Many Requests) if rate limited
 * 
 * Rate Limit Headers:
 * - X-RateLimit-Remaining: Messages left in current window
 * - Retry-After: Seconds until rate limit resets
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
): Promise<NextResponse<SendResponse | SendErrorResponse>> {
  const startTime = Date.now();
  let sessionKey: string = "";
  let status = 500;

  try {
    const { key } = await params;
    sessionKey = getPathParamValidated({ key }, "key", { required: true });

    // 1. Rate limit check (before parsing body)
    if (!globalSessionRateLimiter.isAllowed(sessionKey)) {
      const resetTimeMs = globalSessionRateLimiter.getResetTime(sessionKey);
      const resetTimeSec = Math.ceil(resetTimeMs / 1000);

      status = 429;
      const response = NextResponse.json<SendErrorResponse>(
        {
          error: "Rate limit exceeded",
          details: `Too many messages. Max 20 per 60 seconds.`,
          retryAfterMs: resetTimeMs,
        },
        { status: 429 }
      );

      // Set rate limit headers
      response.headers.set("Retry-After", String(resetTimeSec));
      response.headers.set("X-RateLimit-Remaining", "0");

      console.warn(
        `[rate-limit] Session ${sessionKey} hit rate limit. Reset in ${resetTimeSec}s`
      );

      globalRequestLogger.log({
        endpoint: "/api/sessions/[key]/send",
        status: 429,
        durationMs: Date.now() - startTime,
        error: "Rate limit exceeded",
      });

      return response;
    }

    // 2. Parse request body
    const body = await parseJSONBody<SendRequest>(request);
    const { message, timeoutSeconds } = body;

    // 3. Validate message content
    const validatedMessage = validateMessage(message);

    // 4. Validate timeout if provided
    if (timeoutSeconds !== undefined) {
      if (typeof timeoutSeconds !== "number" || timeoutSeconds < 0) {
        status = 400;
        return errorResponse("timeoutSeconds must be a non-negative number", undefined, 400);
      }
      if (timeoutSeconds > 3600) {
        status = 400;
        return errorResponse("timeoutSeconds cannot exceed 3600 seconds", undefined, 400);
      }
    }

    // 5. Consume rate limit token
    try {
      globalSessionRateLimiter.consume(sessionKey);
    } catch (error) {
      // Should not happen (we checked earlier), but be defensive
      status = 429;
      return errorResponse("Rate limit exceeded", undefined, 429);
    }

    // 6. Send message
    const result = await sendToSession(sessionKey, validatedMessage, timeoutSeconds);

    // 7. Success - add rate limit headers
    status = 200;
    const remaining = globalSessionRateLimiter.getRemaining(sessionKey);
    const response = NextResponse.json<SendResponse>(result, { status: 200 });
    response.headers.set("X-RateLimit-Remaining", String(remaining));

    globalRequestLogger.log({
      endpoint: "/api/sessions/[key]/send",
      status: 200,
      durationMs: Date.now() - startTime,
    });

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Determine if this is a validation error
    const isValidationError =
      errorMessage.includes("must be") ||
      errorMessage.includes("cannot be") ||
      errorMessage.includes("exceeds") ||
      errorMessage.includes("empty") ||
      errorMessage.includes("required");

    status = isValidationError ? 400 : 500;

    console.error(
      `[send-error] Session: ${sessionKey}, Error: ${errorMessage}`
    );

    globalRequestLogger.log({
      endpoint: "/api/sessions/[key]/send",
      status,
      durationMs: Date.now() - startTime,
      error: errorMessage,
    });

    return errorResponse("Failed to send message", errorMessage, status);
  }
}
