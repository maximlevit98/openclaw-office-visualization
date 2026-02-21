import { NextRequest, NextResponse } from "next/server";
import { healthCheck } from "@/lib/gateway-adapter";

/**
 * GET /api/debug/info
 * DEBUG ENDPOINT: Show backend status and configuration
 * 
 * Returns information about:
 * - Gateway connectivity
 * - Environment configuration
 * - API routes available
 * - Build info
 * 
 * **NOTE:** This endpoint exposes some internal details.
 * In production, restrict access or disable this endpoint.
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();

    // Check gateway
    let gatewayHealthy = false;
    let gatewayError: string | null = null;
    try {
      gatewayHealthy = await healthCheck();
    } catch (error) {
      gatewayError = error instanceof Error ? error.message : String(error);
    }

    const duration = Date.now() - startTime;

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        gateway: {
          available: gatewayHealthy,
          url: process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:7070",
          error: gatewayError,
          responseTime: `${duration}ms`,
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          platform: process.platform,
          nodeVersion: process.version,
        },
        api_routes: {
          "/api/agents": "List all agents",
          "/api/health": "Service health check",
          "/api/sessions": "List sessions",
          "/api/sessions/[key]/history": "Get session message history",
          "/api/sessions/[key]/send": "Send message to session",
          "/api/stream": "Real-time agent presence (SSE)",
          "/api/test/stream": "Test stream with mock agents (development only)",
          "/api/debug/info": "This endpoint",
        },
        features: {
          sse_streaming: true,
          mock_data: true,
          error_handling: true,
          request_timeout: "5s",
          retry_logic: "exponential backoff",
        },
        links: {
          health_check: "GET /api/health",
          real_stream: "GET /api/stream (requires GATEWAY_TOKEN)",
          test_stream: "GET /api/test/stream (mock agents)",
          docs: "See handoffs/backend/api-contract.md",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Debug endpoint error:", message);

    return NextResponse.json(
      {
        status: "error",
        message: "Debug info unavailable",
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
