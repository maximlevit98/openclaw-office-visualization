/**
 * API Documentation Endpoint
 * 
 * GET /api — Lists all available API endpoints with usage examples
 */

import { NextRequest, NextResponse } from "next/server";

interface ApiEndpoint {
  path: string;
  method: string;
  description: string;
  example?: string;
  requiresAuth?: boolean;
}

const API_DOCS: ApiEndpoint[] = [
  {
    path: "/api/agents",
    method: "GET",
    description: "List all connected agents from the gateway",
    example: 'curl http://localhost:3000/api/agents',
    requiresAuth: true,
  },
  {
    path: "/api/sessions",
    method: "GET",
    description: "List all active sessions (supports filters)",
    example: 'curl "http://localhost:3000/api/sessions?limit=10"',
    requiresAuth: true,
  },
  {
    path: "/api/sessions/[key]/history",
    method: "GET",
    description: "Get message history for a session",
    example: 'curl "http://localhost:3000/api/sessions/my-session/history?limit=20"',
    requiresAuth: true,
  },
  {
    path: "/api/sessions/[key]/send",
    method: "POST",
    description: "Send a message to a session (rate limited: 20 msg/60s)",
    example:
      'curl -X POST http://localhost:3000/api/sessions/my-session/send \\' +
      '\n  -H "Content-Type: application/json" \\' +
      '\n  -d \'{"message": "Hello", "timeoutSeconds": 30}\'',
    requiresAuth: true,
  },
  {
    path: "/api/stream",
    method: "GET",
    description: "Real-time agent presence updates (Server-Sent Events)",
    example:
      'curl -N http://localhost:3000/api/stream\n' +
      '# Returns agent_status events + 30s heartbeat. Use EventSource for auto-reconnect.',
    requiresAuth: true,
  },
  {
    path: "/api/health",
    method: "GET",
    description: "Service health check",
    example: 'curl http://localhost:3000/api/health',
    requiresAuth: false,
  },
  {
    path: "/api/debug/info",
    method: "GET",
    description:
      "Debug: Show backend status, available routes, and gateway connectivity",
    example: 'curl http://localhost:3000/api/debug/info | jq .',
    requiresAuth: false,
  },
  {
    path: "/api/debug/stats",
    method: "GET",
    description:
      "Debug: Rate limiting and request statistics (per-endpoint metrics)",
    example: 'curl http://localhost:3000/api/debug/stats | jq .',
    requiresAuth: false,
  },
  {
    path: "/api/test/stream",
    method: "GET",
    description:
      "Development: Mock SSE stream with simulated agent status changes (no GATEWAY_TOKEN needed)",
    example:
      'curl -N http://localhost:3000/api/test/stream | head -20\n' +
      '# Use for testing usePresence() hook locally',
    requiresAuth: false,
  },
];

export async function GET(request: NextRequest) {
  // Pretty-print JSON if Accept header includes application/json
  const acceptJson = request.headers.get("accept")?.includes("application/json");

  if (acceptJson) {
    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        endpoints: API_DOCS,
        auth: {
          required: "Set GATEWAY_TOKEN in .env.local (server-side only)",
          note: "Token is never exposed to frontend. All gateway calls are server-to-server.",
        },
        rateLimiting: {
          sendMessage: "20 messages per 60 seconds per session",
          headers: "Retry-After + X-RateLimit-Remaining on 429 responses",
        },
        examples: {
          session_key_encoding: "Use encodeURIComponent(key) for special chars",
          streaming: "Use EventSource API for /api/stream and /api/test/stream",
        },
      },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // HTML version for browser
  const html = generateHtmlDocs(API_DOCS);
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function generateHtmlDocs(endpoints: ApiEndpoint[]): string {
  const endpointHtml = endpoints
    .map((ep) => {
      const authBadge = ep.requiresAuth
        ? '<span style="background: #fee; color: #c33; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-left: 8px;">auth</span>'
        : '<span style="background: #efe; color: #3c3; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-left: 8px;">public</span>';

      const methodColor = ep.method === "GET" ? "#3b82f6" : "#f59e0b";

      return `
        <div style="margin-bottom: 24px; border-left: 4px solid ${methodColor}; padding-left: 16px;">
          <div style="margin-bottom: 8px;">
            <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-weight: bold; color: ${methodColor};">
              ${ep.method}
            </code>
            <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px; margin-left: 8px;">
              ${ep.path}
            </code>
            ${authBadge}
          </div>
          <p style="margin: 8px 0; color: #666; font-size: 14px;">${ep.description}</p>
          ${
            ep.example
              ? `<pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px; color: #333;">$ ${ep.example}</pre>`
              : ""
          }
        </div>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenClaw Office BFF — API Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #f5f3f0 0%, #faf8f5 100%);
      color: #1a1816;
      line-height: 1.6;
      padding: 40px 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
      padding: 48px;
    }
    h1 {
      font-size: 32px;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .subtitle {
      color: #666;
      margin-bottom: 32px;
      font-size: 16px;
    }
    .section {
      margin-bottom: 48px;
    }
    .section h2 {
      font-size: 20px;
      margin-bottom: 16px;
      color: #333;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 12px;
    }
    .info-box {
      background: #f0f4ff;
      border-left: 4px solid #3b82f6;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 24px;
      font-size: 14px;
      color: #333;
    }
    .info-box strong { color: #1e40af; }
    .link { color: #3b82f6; text-decoration: none; }
    .link:hover { text-decoration: underline; }
    code {
      font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
    }
    pre { white-space: pre-wrap; word-wrap: break-word; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏢 OpenClaw Office BFF</h1>
    <p class="subtitle">Backend-for-Frontend API Documentation</p>

    <div class="section">
      <h2>📡 Available Endpoints</h2>
      <div class="info-box">
        <strong>Authentication:</strong> All endpoints requiring GATEWAY_TOKEN use server-side authentication only.
        The token is never exposed to the frontend. Set <code>GATEWAY_TOKEN</code> in <code>.env.local</code>.
      </div>
      ${endpointHtml}
    </div>

    <div class="section">
      <h2>🔧 Configuration</h2>
      <div class="info-box">
        <strong>Rate Limiting:</strong> Message sending is limited to 20 messages per 60 seconds per session.
        When exceeded, endpoints return <code>429 Too Many Requests</code> with <code>Retry-After</code> header.
      </div>
      <div class="info-box">
        <strong>SSE Streams:</strong> Use the <a href="https://developer.mozilla.org/en-US/docs/Web/API/EventSource" class="link">EventSource API</a>
        for server-sent events. The stream sends a heartbeat every 30 seconds to keep connections alive.
      </div>
    </div>

    <div class="section">
      <h2>💡 Quick Tips</h2>
      <ul style="margin-left: 20px;">
        <li><strong>Session Key Encoding:</strong> Use <code>encodeURIComponent(key)</code> for session keys with special chars</li>
        <li><strong>Timeout Protection:</strong> All requests have built-in timeouts (5s default). Set <code>timeoutSeconds</code> in POST body.</li>
        <li><strong>Fallback Mode:</strong> If gateway is down, API falls back to mock data (status: "degraded")</li>
        <li><strong>Testing:</strong> Use <code>/api/test/stream</code> for local development without GATEWAY_TOKEN</li>
        <li><strong>Debugging:</strong> Check <code>/api/debug/info</code> and <code>/api/debug/stats</code> for service status</li>
      </ul>
    </div>

    <div class="section">
      <h2>🔗 Links</h2>
      <ul style="margin-left: 20px;">
        <li><a href="/api/health" class="link">Health Check</a></li>
        <li><a href="/api/debug/info" class="link">Debug Info</a></li>
        <li><a href="/api/debug/stats" class="link">Rate Limit Stats</a></li>
        <li><a href="/?json" class="link">JSON Version</a> (add ?json param for raw API)</li>
      </ul>
    </div>

    <footer style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #f0f0f0; color: #999; font-size: 12px; text-align: center;">
      <p>OpenClaw Office Visualization | Backend v1.0.0</p>
    </footer>
  </div>
</body>
</html>`;
}
