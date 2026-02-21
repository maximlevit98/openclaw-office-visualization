/**
 * Server-side gateway adapter for OpenClaw
 * All external calls to the gateway happen here — token stays on server
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Request timeout (5s default)
 * - Auth token server-side only
 */

const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN;
const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:7070";

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 2000,
  timeoutMs: 5000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

if (!GATEWAY_TOKEN) {
  console.warn(
    "⚠️  GATEWAY_TOKEN not set. Gateway calls will fail. Set it in .env.local"
  );
}

/**
 * Build headers with auth for gateway requests
 */
function buildHeaders(extra: Record<string, string> = {}): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${GATEWAY_TOKEN}`,
    ...extra,
  };
}

/**
 * Sleep for given milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attemptNumber: number): number {
  const delay = RETRY_CONFIG.initialDelayMs * Math.pow(2, attemptNumber - 1);
  const jitter = Math.random() * 0.1 * delay; // 10% jitter
  return Math.min(delay + jitter, RETRY_CONFIG.maxDelayMs);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown, statusCode?: number): boolean {
  if (statusCode) {
    return RETRY_CONFIG.retryableStatusCodes.includes(statusCode);
  }
  
  // Retry on network errors
  if (error instanceof TypeError) {
    const message = String(error.message).toLowerCase();
    return (
      message.includes("fetch") ||
      message.includes("network") ||
      message.includes("timeout")
    );
  }
  
  return false;
}

/**
 * Generic gateway API call with automatic retry
 */
async function gatewayFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${GATEWAY_URL}${endpoint}`;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        RETRY_CONFIG.timeoutMs
      );

      const response = await fetch(url, {
        ...options,
        headers: buildHeaders(options.headers as Record<string, string>),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const shouldRetry = isRetryableError(null, response.status);
        
        if (shouldRetry && attempt < RETRY_CONFIG.maxRetries) {
          const delayMs = getBackoffDelay(attempt);
          await sleep(delayMs);
          continue;
        }

        throw new Error(
          `Gateway error: ${response.status} ${response.statusText} (${endpoint})`
        );
      }

      return response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (!isRetryableError(error) || attempt === RETRY_CONFIG.maxRetries) {
        throw lastError;
      }

      const delayMs = getBackoffDelay(attempt);
      await sleep(delayMs);
    }
  }

  throw (
    lastError ||
    new Error(`Gateway request failed after ${RETRY_CONFIG.maxRetries} retries`)
  );
}

/**
 * Type definitions for gateway responses
 */
export interface Session {
  key: string;
  label?: string;
  kind?: string;
  activeMinutes?: number;
  messages?: Message[];
  status?: "active" | "idle" | "offline";
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  toolName?: string;
}

export interface Agent {
  id: string;
  name?: string;
  status?: "online" | "idle" | "offline" | "busy";
  kind?: string;
  lastSeen?: string;
}

export interface SessionsResponse {
  sessions?: Session[];
  data?: Session[];
}

export interface HistoryResponse {
  messages?: Message[];
  data?: Message[];
}

export interface SendResponse {
  success?: boolean;
  data?: unknown;
  result?: unknown;
}

export interface AgentsResponse {
  agents?: Agent[];
  data?: Agent[];
}

/**
 * GET /sessions
 */
export async function listSessions(
  filters?: Record<string, unknown>
): Promise<Session[]> {
  const params = filters ? `?${new URLSearchParams(Object.entries(filters).map(([k, v]) => [k, String(v)]))}` : "";
  const response = await gatewayFetch<SessionsResponse>(`/api/sessions${params}`);
  
  // Handle both direct array and wrapped response
  if (Array.isArray(response)) {
    return response;
  }
  return response.sessions || response.data || [];
}

/**
 * GET /sessions/[key]/history
 */
export async function getSessionHistory(
  sessionKey: string,
  limit?: number
): Promise<Message[]> {
  const params = limit ? `?limit=${limit}` : "";
  const response = await gatewayFetch<HistoryResponse>(
    `/api/sessions/${encodeURIComponent(sessionKey)}/history${params}`
  );
  
  // Handle both direct array and wrapped response
  if (Array.isArray(response)) {
    return response;
  }
  return response.messages || response.data || [];
}

/**
 * POST /sessions/[key]/send
 */
export async function sendToSession(
  sessionKey: string,
  message: string,
  timeout?: number
): Promise<SendResponse> {
  const body = { message, ...(timeout && { timeoutSeconds: timeout }) };
  return gatewayFetch<SendResponse>(
    `/api/sessions/${encodeURIComponent(sessionKey)}/send`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

/**
 * GET /agents
 */
export async function listAgents(): Promise<Agent[]> {
  const response = await gatewayFetch<AgentsResponse>("/api/agents");
  
  // Handle both direct array and wrapped response
  if (Array.isArray(response)) {
    return response;
  }
  return response.agents || response.data || [];
}

/**
 * Health check with retry (max 2 attempts, shorter timeout)
 */
export async function healthCheck(): Promise<boolean> {
  const maxAttempts = 2;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000); // 2s timeout for health check

      const response = await fetch(`${GATEWAY_URL}/status`, {
        headers: buildHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      
      if (response.ok) {
        return true;
      }
      
      // Retry on 5xx errors
      if (response.status < 500 || attempt === maxAttempts) {
        return false;
      }
      
      await sleep(100);
    } catch {
      if (attempt === maxAttempts) {
        return false;
      }
      await sleep(100);
    }
  }
  
  return false;
}
