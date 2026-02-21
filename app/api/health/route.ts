import { NextRequest, NextResponse } from "next/server";
import { healthCheck } from "@/lib/gateway-adapter";

/**
 * GET /api/health
 * Health check endpoint with gateway status
 * 
 * Returns:
 * - 200: Service is healthy (with gateway status)
 * - 503: Service is degraded (gateway down, fallback available)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const startTime = Date.now();

    // Check gateway connectivity (with built-in timeout and retry)
    let gatewayHealthy = false;
    try {
      gatewayHealthy = await healthCheck();
    } catch (error) {
      // Gateway check failed — log but don't fail the health endpoint
      console.warn(
        "Gateway health check failed:",
        error instanceof Error ? error.message : String(error)
      );
    }

    const duration = Date.now() - startTime;

    // Determine overall health status
    const isHealthy = gatewayHealthy;
    const status = isHealthy ? 200 : 503;

    return NextResponse.json(
      {
        status: isHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        checks: {
          gateway: {
            status: gatewayHealthy ? "ok" : "unreachable",
            responseTime: `${duration}ms`,
          },
          fallback: {
            status: "available",
            message: "Mock data will be used if gateway is unavailable",
          },
        },
        uptime: process.uptime(),
        nodeVersion: process.version,
      },
      { status }
    );
  } catch (error) {
    // Catastrophic failure — something went very wrong
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Health check endpoint error:", message);

    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
