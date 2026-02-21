/**
 * Client-side fetch wrapper with timeout protection
 * Prevents requests from hanging indefinitely
 * 
 * Features:
 * - Automatic timeout (configurable, default 10s)
 * - Retry support for transient failures
 * - Type-safe response handling
 * - Clear error messages
 */

export interface FetchOptions {
  timeoutMs?: number;
  retries?: number;
  method?: string;
  headers?: Record<string, string>;
  body?: string | FormData;
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
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      const isRetryable =
        lastError.name === "AbortError" || // Timeout
        lastError.message.includes("fetch") || // Network error
        lastError.message.includes("Failed to fetch");

      if (!isRetryable || attempt === retries) {
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
    new Error(`Failed to fetch ${url} after ${retries} attempts`)
  );
}

/**
 * Fetch JSON with timeout protection
 * 
 * @param url - API endpoint to fetch
 * @param options - Fetch options
 * @returns Parsed JSON response
 * @throws Error if request fails, times out, or response is invalid JSON
 * 
 * @example
 * ```typescript
 * const sessions = await fetchJSON<Session[]>("/api/sessions", {
 *   timeoutMs: 5000,
 *   retries: 2,
 * });
 * ```
 */
export async function fetchJSON<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  try {
    const response = await fetchWithTimeout(url, options);
    const text = await response.text();

    if (!text) {
      throw new Error("Empty response body");
    }

    return JSON.parse(text) as T;
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
