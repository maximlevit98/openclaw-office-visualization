import { NextRequest, NextResponse } from "next/server";
import { globalRequestLogger, globalSessionRateLimiter } from "@/lib/rate-limiter";

/**
 * GET /api/debug/stats
 * DEBUG ENDPOINT: Performance and rate limiting statistics
 * 
 * Shows:
 * - Request counts and error rates per endpoint
 * - Average/min/max request latencies
 * - Active rate limited sessions
 * - Memory usage by rate limiter
 * 
 * **NOTE:** This endpoint exposes internal metrics.
 * In production, restrict access or disable this endpoint.
 */
export async function GET(request: NextRequest) {
  try {
    const allStats = globalRequestLogger.getAllStats();
    const rateLimiterStats = globalSessionRateLimiter.getStats();

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        requests: {
          all: allStats,
          endpoints: Object.entries(allStats).map(([endpoint, stats]) => ({
            endpoint,
            count: stats.count,
            errors: stats.errors,
            errorRate: `${(stats.errorRate * 100).toFixed(2)}%`,
            avgDurationMs: `${stats.avgDurationMs.toFixed(2)}ms`,
          })),
        },
        rateLimit: {
          activeSessions: rateLimiterStats.sessionCount,
          averageTokensPerSession: rateLimiterStats.averageTokensPerSession.toFixed(2),
          config: {
            tokensPerWindow: rateLimiterStats.config.tokensPerWindow,
            windowMs: `${rateLimiterStats.config.windowMs}ms (${(rateLimiterStats.config.windowMs / 1000).toFixed(0)}s)`,
            costPerRequest: rateLimiterStats.config.costPerRequest,
            cleanupIntervalMs: `${rateLimiterStats.config.cleanupIntervalMs}ms`,
          },
        },
        performance: {
          totalRequests: Object.values(allStats).reduce((sum, s) => sum + s.count, 0),
          totalErrors: Object.values(allStats).reduce((sum, s) => sum + s.errors, 0),
          avgErrorRate: `${(
            Object.values(allStats).reduce((sum, s) => sum + s.errorRate, 0) /
            Object.values(allStats).length
          ).toFixed(4) || 0}%`,
        },
        links: {
          health: "GET /api/health",
          info: "GET /api/debug/info",
          stats: "GET /api/debug/stats (this endpoint)",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Stats endpoint error:", message);

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to collect stats",
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
