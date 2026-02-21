/**
 * Rate limiting utilities for API endpoints
 * 
 * Features:
 * - Token bucket algorithm (flexible, allows bursts)
 * - Per-session and per-IP tracking
 * - Automatic cleanup of old entries
 * - Type-safe configuration
 * - Low memory footprint (in-memory only, suitable for MVP)
 * 
 * Production notes:
 * - For distributed systems, use Redis or similar
 * - For high-traffic, consider sliding window counters
 * - Current implementation is single-process only
 */

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Requests allowed per window */
  tokensPerWindow: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Request cost (default 1 token per request) */
  costPerRequest?: number;
  /** Cleanup old entries every N milliseconds */
  cleanupIntervalMs?: number;
}

/**
 * Token bucket entry
 */
interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

/**
 * Rate limiter for sessions (messages sent)
 * 
 * Tracks tokens per session key using token bucket algorithm
 * Suitable for: message sending, tool invocations, etc.
 * 
 * Example:
 * ```typescript
 * const limiter = new SessionRateLimiter({
 *   tokensPerWindow: 10,    // 10 messages per window
 *   windowMs: 60000,         // per 60 seconds
 *   costPerRequest: 1,       // each message costs 1 token
 * });
 * 
 * // Check before sending
 * if (!limiter.isAllowed("session-123")) {
 *   return 429; // Too many requests
 * }
 * 
 * // Use the tokens
 * limiter.consume("session-123");
 * ```
 */
export class SessionRateLimiter {
  private buckets = new Map<string, TokenBucket>();
  private config: Required<RateLimitConfig>;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    this.config = {
      tokensPerWindow: config.tokensPerWindow,
      windowMs: config.windowMs,
      costPerRequest: config.costPerRequest ?? 1,
      cleanupIntervalMs: config.cleanupIntervalMs ?? 60000, // Default: 1 minute
    };

    // Start cleanup timer
    this.startCleanup();
  }

  /**
   * Check if a session is allowed to make a request
   * Does NOT consume tokens
   * @returns true if allowed, false if rate limited
   */
  isAllowed(sessionKey: string, costPerRequest?: number): boolean {
    const cost = costPerRequest ?? this.config.costPerRequest;
    const bucket = this.refill(sessionKey);
    return bucket.tokens >= cost;
  }

  /**
   * Consume tokens for a request
   * @returns remaining tokens after consumption
   * @throws Error if not enough tokens
   */
  consume(sessionKey: string, costPerRequest?: number): number {
    const cost = costPerRequest ?? this.config.costPerRequest;
    const bucket = this.refill(sessionKey);

    if (bucket.tokens < cost) {
      throw new Error(
        `Rate limit exceeded for session ${sessionKey}. ` +
        `Available: ${bucket.tokens}, Required: ${cost}`
      );
    }

    bucket.tokens -= cost;
    return bucket.tokens;
  }

  /**
   * Get remaining tokens for a session
   */
  getRemaining(sessionKey: string): number {
    const bucket = this.refill(sessionKey);
    return Math.floor(bucket.tokens);
  }

  /**
   * Get reset time (when new tokens are available) in milliseconds
   */
  getResetTime(sessionKey: string): number {
    const bucket = this.buckets.get(sessionKey);
    if (!bucket) {
      return 0;
    }
    const nextRefillTime = bucket.lastRefill + this.config.windowMs;
    const now = Date.now();
    return Math.max(0, nextRefillTime - now);
  }

  /**
   * Reset a session (remove from limiter)
   */
  reset(sessionKey: string): void {
    this.buckets.delete(sessionKey);
  }

  /**
   * Clear all buckets
   */
  clear(): void {
    this.buckets.clear();
  }

  /**
   * Stop the cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Refill tokens based on elapsed time (token bucket algorithm)
   */
  private refill(sessionKey: string): TokenBucket {
    const now = Date.now();
    let bucket = this.buckets.get(sessionKey);

    if (!bucket) {
      bucket = {
        tokens: this.config.tokensPerWindow,
        lastRefill: now,
      };
      this.buckets.set(sessionKey, bucket);
      return bucket;
    }

    const timePassed = now - bucket.lastRefill;
    const bucketsToAdd =
      (timePassed / this.config.windowMs) * this.config.tokensPerWindow;
    bucket.tokens = Math.min(
      this.config.tokensPerWindow,
      bucket.tokens + bucketsToAdd
    );
    bucket.lastRefill = now;

    return bucket;
  }

  /**
   * Start periodic cleanup of old buckets
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      const maxAge = this.config.windowMs * 10; // Keep for 10 windows

      for (const [key, bucket] of this.buckets.entries()) {
        if (now - bucket.lastRefill > maxAge) {
          this.buckets.delete(key);
        }
      }
    }, this.config.cleanupIntervalMs);

    // Don't keep process alive just for cleanup
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Get limiter stats (for debugging)
   */
  getStats(): {
    sessionCount: number;
    averageTokensPerSession: number;
    config: Required<RateLimitConfig>;
  } {
    let totalTokens = 0;
    for (const bucket of this.buckets.values()) {
      totalTokens += bucket.tokens;
    }

    return {
      sessionCount: this.buckets.size,
      averageTokensPerSession:
        this.buckets.size > 0 ? totalTokens / this.buckets.size : 0,
      config: this.config,
    };
  }
}

/**
 * Request logging utility
 * 
 * Tracks request counts, latencies, and error rates
 * Suitable for: observability, debugging, metrics
 * 
 * Example:
 * ```typescript
 * const logger = new RequestLogger();
 * 
 * // At start of request
 * const startTime = Date.now();
 * 
 * // ...do work...
 * 
 * // At end of request
 * logger.log({
 *   endpoint: "/api/sessions/key/send",
 *   status: 200,
 *   durationMs: Date.now() - startTime,
 *   error: null,
 * });
 * 
 * // Get stats
 * console.log(logger.getStats("/api/sessions/key/send"));
 * ```
 */
export class RequestLogger {
  private logs = new Map<
    string,
    {
      count: number;
      errors: number;
      totalDurationMs: number;
      minDurationMs: number;
      maxDurationMs: number;
      lastError: string | null;
    }
  >();

  /**
   * Log a request
   */
  log(entry: {
    endpoint: string;
    status: number;
    durationMs: number;
    error?: string | null;
  }): void {
    const key = entry.endpoint;
    const isError = entry.status >= 400;
    const isNewError = entry.error !== undefined && entry.error !== null;

    let stats = this.logs.get(key);
    if (!stats) {
      stats = {
        count: 0,
        errors: 0,
        totalDurationMs: 0,
        minDurationMs: Infinity,
        maxDurationMs: 0,
        lastError: null,
      };
      this.logs.set(key, stats);
    }

    stats.count++;
    stats.totalDurationMs += entry.durationMs;
    stats.minDurationMs = Math.min(stats.minDurationMs, entry.durationMs);
    stats.maxDurationMs = Math.max(stats.maxDurationMs, entry.durationMs);

    if (isError) {
      stats.errors++;
    }

    if (isNewError) {
      stats.lastError = entry.error ?? null;
    }
  }

  /**
   * Get stats for an endpoint
   */
  getStats(endpoint: string): {
    count: number;
    errors: number;
    errorRate: number;
    avgDurationMs: number;
    minDurationMs: number;
    maxDurationMs: number;
    lastError: string | null;
  } | null {
    const stats = this.logs.get(endpoint);
    if (!stats) {
      return null;
    }

    return {
      count: stats.count,
      errors: stats.errors,
      errorRate: stats.count > 0 ? stats.errors / stats.count : 0,
      avgDurationMs:
        stats.count > 0 ? stats.totalDurationMs / stats.count : 0,
      minDurationMs: stats.minDurationMs,
      maxDurationMs: stats.maxDurationMs,
      lastError: stats.lastError,
    };
  }

  /**
   * Get all stats
   */
  getAllStats(): Record<
    string,
    {
      count: number;
      errors: number;
      errorRate: number;
      avgDurationMs: number;
    }
  > {
    const result: Record<string, any> = {};

    for (const [endpoint, stats] of this.logs.entries()) {
      result[endpoint] = {
        count: stats.count,
        errors: stats.errors,
        errorRate: stats.count > 0 ? stats.errors / stats.count : 0,
        avgDurationMs:
          stats.count > 0 ? stats.totalDurationMs / stats.count : 0,
      };
    }

    return result;
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs.clear();
  }
}

/**
 * Global singleton instances
 * 
 * Use these for the entire application to track rates across all requests
 */
export const globalSessionRateLimiter = new SessionRateLimiter({
  tokensPerWindow: 20, // 20 messages per window
  windowMs: 60000, // per 60 seconds
  costPerRequest: 1,
  cleanupIntervalMs: 300000, // cleanup every 5 minutes
});

export const globalRequestLogger = new RequestLogger();
