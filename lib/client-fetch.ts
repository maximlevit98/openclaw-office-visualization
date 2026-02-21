/**
 * Client-side fetch wrapper with timeout protection and response caching
 * Prevents requests from hanging indefinitely and reduces redundant network calls
 * 
 * Features:
 * - Automatic timeout (configurable, default 10s)
 * - Retry support for transient failures
 * - Response caching with configurable TTL
 * - Request deduplication for concurrent calls
 * - Type-safe response handling
 * - Clear error messages
 */

export interface FetchOptions {
  timeoutMs?: number;
  retries?: number;
  method?: string;
  headers?: Record<string, string>;
  body?: string | FormData;
  skipDedup?: boolean;
  cacheTtlMs?: number | null;
  skipCache?: boolean;
}

/**
 * Cached response entry with expiration
 */
interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttlMs: number;
}

/**
 * Response cache to avoid redundant network calls
 * Key: `${method} ${url}${body ? `:${body}` : ""}`
 * Value: CacheEntry with data + expiration timestamp
 * 
 * This reduces server load by reusing recent responses
 * Default TTL: null (no caching unless specified)
 */
const responseCache = new Map<string, CacheEntry>();

/**
 * In-flight request cache to prevent duplicate concurrent requests
 * Key: `${method} ${url}${body ? `:${body}` : ""}`
 * Value: Promise of the pending request
 * 
 * This prevents race conditions when the same endpoint is called
 * multiple times concurrently (e.g., double-clicks, rapid refreshes)
 */
const inflightRequests = new Map<
  string,
  Promise<unknown>
>();

/**
 * Build cache key for a request
 */
function buildCacheKey(
  url: string,
  method: string = "GET",
  body?: string | FormData
): string {
  const bodyStr =
    body instanceof FormData
      ? "[FormData]"
      : body
        ? `:${body.substring(0, 50)}` // Use first 50 chars of body
        : "";
  return `${method} ${url}${bodyStr}`;
}

/**
 * Get cached response if still valid (not expired)
 * Returns undefined if not cached or expired
 */
function getCachedResponse(
  url: string,
  method: string = "GET",
  body?: string | FormData
): unknown | undefined {
  const cacheKey = buildCacheKey(url, method, body);
  const entry = responseCache.get(cacheKey);

  if (!entry) {
    return undefined;
  }

  // Check if cache is expired
  const now = Date.now();
  if (now - entry.timestamp > entry.ttlMs) {
    // Expired, remove from cache
    responseCache.delete(cacheKey);
    return undefined;
  }

  return entry.data;
}

/**
 * Store response in cache with TTL
 */
function setCachedResponse(
  url: string,
  data: unknown,
  ttlMs: number,
  method: string = "GET",
  body?: string | FormData
): void {
  const cacheKey = buildCacheKey(url, method, body);
  responseCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttlMs,
  });
}

/**
 * Sleep for given milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout protection
 * 
 * @param url - Resource to fetch
 * @param options - Fetch options with timeout support
 * @returns Response if successful
 * @throws Error if timeout, network failure, or non-200 response
 * 
 * @example
 * ```typescript
 * try {
 *   const response = await fetchWithTimeout("/api/sessions", {
 *     timeoutMs: 5000,
 *     retries: 2,
 *   });
 *   const data = await response.json();
 * } catch (error) {
 *   console.error("Failed to fetch sessions:", error);
 *   // Use fallback data
 * }
 * ```
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeoutMs = 10000,
    retries = 1,
    method = "GET",
    headers,
    body,
    skipDedup = false,
  } = options;
  const maxAttempts = Math.max(1, retries + 1);

  // Check for in-flight request (deduplication)
  if (!skipDedup && method === "GET") {
    const cacheKey = buildCacheKey(url, method, body);
    const inflightPromise = inflightRequests.get(cacheKey);

    if (inflightPromise) {
      // Return cached promise (wait for in-flight request)
      try {
        return (await inflightPromise) as Response;
      } catch (error) {
        // If cached request failed, allow retry
        throw error;
      }
    }
  }

  // Create request promise
  const requestPromise = (async () => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        let didTimeout = false;
        const timeoutId = setTimeout(() => {
          didTimeout = true;
          controller.abort();
        }, timeoutMs);

        try {
          const response = await fetch(url, {
            method,
            headers,
            body,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            // Non-2xx responses are not retryable
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return response;
        } catch (error) {
          const rawError = error instanceof Error ? error : new Error(String(error));
          const message = rawError.message.toLowerCase();
          const isAbort = rawError.name === "AbortError" || message.includes("aborted");
          const normalizedError = didTimeout
            ? new Error(`Request timed out after ${timeoutMs}ms`)
            : isAbort
              ? new Error("Request was aborted")
              : rawError;
          throw normalizedError;
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const message = lastError.message.toLowerCase();

        // Check if error is retryable
        const isRetryable =
          lastError.name === "AbortError" || // Abort / timeout
          message.includes("aborted") ||
          message.includes("timeout") ||
          message.includes("timed out") ||
          message.includes("fetch") ||
          message.includes("network");

        if (!isRetryable || attempt === maxAttempts) {
          // Final attempt or non-retryable error
          throw new Error(
            `Failed to fetch ${url}: ${lastError.message}`
          );
        }

        // Wait before retrying (exponential backoff)
        const delayMs = 100 * Math.pow(2, attempt - 1);
        await sleep(delayMs);
      }
    }

    throw (
      lastError ||
      new Error(`Failed to fetch ${url} after ${maxAttempts} attempts`)
    );
  })();

  // Cache the promise for GET requests
  if (!skipDedup && method === "GET") {
    const cacheKey = buildCacheKey(url, method, body);
    inflightRequests.set(cacheKey, requestPromise);

    // Clean up cache after request completes
    requestPromise
      .then(() => {
        inflightRequests.delete(cacheKey);
      })
      .catch(() => {
        inflightRequests.delete(cacheKey);
      });
  }

  return requestPromise;
}

/**
 * Fetch JSON with timeout protection and optional response caching
 * 
 * @param url - API endpoint to fetch
 * @param options - Fetch options (including cacheTtlMs for caching)
 * @returns Parsed JSON response
 * @throws Error if request fails, times out, or response is invalid JSON
 * 
 * @example
 * ```typescript
 * // Fetch without caching
 * const sessions = await fetchJSON<Session[]>("/api/sessions", {
 *   timeoutMs: 5000,
 *   retries: 2,
 * });
 * 
 * // Fetch with 30s caching
 * const sessions = await fetchJSON<Session[]>("/api/sessions", {
 *   timeoutMs: 5000,
 *   cacheTtlMs: 30000,  // Cache for 30 seconds
 * });
 * 
 * // Skip cache for fresh data
 * const sessions = await fetchJSON<Session[]>("/api/sessions", {
 *   skipCache: true,  // Ignore cached data
 * });
 * ```
 */
export async function fetchJSON<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipCache = false, cacheTtlMs = null } = options;

  // Check cache first (if caching enabled and not skipped)
  if (!skipCache && cacheTtlMs !== null && cacheTtlMs > 0) {
    const cached = getCachedResponse(url, options.method || "GET", options.body);
    if (cached !== undefined) {
      return cached as T;
    }
  }

  try {
    const response = await fetchWithTimeout(url, options);
    const text = await response.text();

    if (!text) {
      throw new Error("Empty response body");
    }

    const data = JSON.parse(text) as T;

    // Cache the response if TTL is specified
    if (cacheTtlMs !== null && cacheTtlMs > 0) {
      setCachedResponse(url, data, cacheTtlMs, options.method || "GET", options.body);
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        `Invalid JSON from ${url}: ${error.message}`
      );
    }
    throw error;
  }
}

/**
 * Type-safe POST request with JSON body
 * 
 * @param url - API endpoint
 * @param body - Request body (will be JSON-stringified)
 * @param options - Fetch options
 * @returns Parsed JSON response
 * 
 * @example
 * ```typescript
 * const result = await postJSON<SendResponse>(
 *   `/api/sessions/${key}/send`,
 *   { message: "Hello" },
 *   { timeoutMs: 5000 }
 * );
 * ```
 */
export async function postJSON<T = unknown>(
  url: string,
  body: unknown,
  options: FetchOptions = {}
): Promise<T> {
  return fetchJSON<T>(url, {
    ...options,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Health check helper
 * Returns true if service is healthy, false otherwise
 * Never throws; used for precondition checks
 * 
 * @example
 * ```typescript
 * const healthy = await isServiceHealthy();
 * if (!healthy) {
 *   // Use mock fallback data
 * }
 * ```
 */
export async function isServiceHealthy(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout("/api/health", {
      timeoutMs: 3000,
      retries: 1,
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { status?: string };
    return data.status === "healthy";
  } catch (error) {
    // Service unreachable or health check failed
    return false;
  }
}

/**
 * Fetch with automatic fallback
 * Returns provided fallback if fetch fails, never throws
 * 
 * @param url - API endpoint to fetch
 * @param fallback - Default data if fetch fails
 * @param options - Fetch options
 * @returns Data from API or fallback
 * 
 * @example
 * ```typescript
 * const sessions = await fetchWithFallback(
 *   "/api/sessions",
 *   [] as Session[],
 *   { timeoutMs: 5000 }
 * );
 * // If fetch fails, returns empty array instead of throwing
 * ```
 */
export async function fetchWithFallback<T>(
  url: string,
  fallback: T,
  options: FetchOptions = {}
): Promise<T> {
  try {
    return await fetchJSON<T>(url, options);
  } catch (error) {
    console.warn(
      `Failed to fetch from ${url}, using fallback:`,
      error instanceof Error ? error.message : String(error)
    );
    return fallback;
  }
}

/**
 * Clear request deduplication cache
 * Useful when data may have changed and you want fresh requests
 * 
 * @param url - Optional: only clear cache for this URL
 * 
 * @example
 * ```typescript
 * // Clear all cached requests
 * clearFetchCache();
 * 
 * // Clear cache for specific endpoint
 * clearFetchCache("/api/sessions");
 * ```
 */
export function clearFetchCache(url?: string): void {
  if (url) {
    // Clear specific URL (all methods/bodies)
    const keysToDelete: string[] = [];
    for (const key of inflightRequests.keys()) {
      if (key.includes(url)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => inflightRequests.delete(key));
  } else {
    // Clear all
    inflightRequests.clear();
  }
}

/**
 * Get current request deduplication cache size
 * Useful for debugging
 * 
 * @returns Number of in-flight requests being deduplicated
 */
export function getFetchCacheSize(): number {
  return inflightRequests.size;
}

/**
 * Clear response cache
 * Useful when data may have changed and you want fresh responses
 * 
 * @param url - Optional: only clear cache for this URL
 * 
 * @example
 * ```typescript
 * // Clear all cached responses
 * clearResponseCache();
 * 
 * // Clear cache for specific endpoint
 * clearResponseCache("/api/sessions");
 * ```
 */
export function clearResponseCache(url?: string): void {
  if (url) {
    // Clear specific URL (all methods/bodies)
    const keysToDelete: string[] = [];
    for (const key of responseCache.keys()) {
      if (key.includes(url)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => responseCache.delete(key));
  } else {
    // Clear all
    responseCache.clear();
  }
}

/**
 * Get current response cache size and stats
 * Useful for debugging
 * 
 * @returns Object with cache stats
 * 
 * @example
 * ```typescript
 * const stats = getResponseCacheStats();
 * console.log(`Cached responses: ${stats.size}`);
 * console.log(`Total memory estimate: ${stats.estimatedBytes} bytes`);
 * ```
 */
export function getResponseCacheStats(): {
  size: number;
  estimatedBytes: number;
} {
  let estimatedBytes = 0;

  for (const entry of responseCache.values()) {
    // Rough estimate: JSON.stringify size + object overhead
    const dataStr = JSON.stringify(entry.data);
    estimatedBytes += dataStr.length + 100; // +100 for object overhead
  }

  return {
    size: responseCache.size,
    estimatedBytes,
  };
}
