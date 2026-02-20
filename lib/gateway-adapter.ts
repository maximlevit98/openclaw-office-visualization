/**
 * Server-side gateway adapter for OpenClaw
 * All external calls to the gateway happen here — token stays on server
 */

const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN;
const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:7070";

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
 * Generic gateway API call
 */
async function gatewayFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${GATEWAY_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: buildHeaders(options.headers as Record<string, string>),
  });

  if (!response.ok) {
    throw new Error(
      `Gateway error: ${response.status} ${response.statusText} (${endpoint})`
    );
  }

  return response.json();
}

/**
 * GET /sessions
 */
export async function listSessions(filters?: Record<string, unknown>) {
  const params = filters ? `?${new URLSearchParams(Object.entries(filters).map(([k, v]) => [k, String(v)]))}` : "";
  return gatewayFetch(`/api/sessions${params}`);
}

/**
 * GET /sessions/[key]/history
 */
export async function getSessionHistory(sessionKey: string, limit?: number) {
  const params = limit ? `?limit=${limit}` : "";
  return gatewayFetch(`/api/sessions/${encodeURIComponent(sessionKey)}/history${params}`);
}

/**
 * POST /sessions/[key]/send
 */
export async function sendToSession(
  sessionKey: string,
  message: string,
  timeout?: number
) {
  const body = { message, ...(timeout && { timeoutSeconds: timeout }) };
  return gatewayFetch(
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
export async function listAgents() {
  return gatewayFetch("/api/agents");
}

/**
 * Health check
 */
export async function healthCheck() {
  try {
    const response = await fetch(`${GATEWAY_URL}/status`, {
      headers: buildHeaders(),
    });
    return response.ok;
  } catch {
    return false;
  }
}
