import { NextRequest, NextResponse } from "next/server";
import { listAgents } from "@/lib/gateway-adapter";

/**
 * GET /api/stream
 * Server-sent events stream for real-time agent presence updates
 * 
 * Protocol:
 * - Event type "agent_status": Agent presence update (on connect + on changes)
 * - Event type "heartbeat": Keep-alive ping every 30 seconds
 * - Cleans up properly on client disconnect
 * 
 * Security: Server-side calls to gateway use GATEWAY_TOKEN
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 1. Fetch initial agent list on client connect
        console.log("[stream] Client connected, fetching initial agent list...");
        const agents = await listAgents();
        console.log(`[stream] Got ${agents.length} agents, broadcasting...`);

        // 2. Send each agent as a separate agent_status event
        agents.forEach((agent) => {
          try {
            const eventData = {
              type: "agent_status",
              agent: {
                id: agent.id,
                name: agent.name || agent.id,
                status: agent.status || "offline",
                kind: agent.kind,
                lastSeen: agent.lastSeen,
              },
            };

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(eventData)}\n\n`)
            );
          } catch (error) {
            console.error(
              `[stream] Failed to send agent ${agent.id}:`,
              error instanceof Error ? error.message : String(error)
            );
          }
        });

        // 3. Keep-alive: send heartbeat every 30 seconds
        // This prevents proxies/load balancers from closing idle connections
        const heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "heartbeat" })}\n\n`)
            );
          } catch (error) {
            // Connection closed by client
            console.log("[stream] Heartbeat failed (client disconnected)");
            clearInterval(heartbeatInterval);
          }
        }, 30000);

        // 4. Cleanup on client disconnect
        request.signal.addEventListener("abort", () => {
          console.log("[stream] Client disconnected, cleaning up...");
          clearInterval(heartbeatInterval);
          try {
            controller.close();
          } catch (error) {
            // Already closed
          }
        });
      } catch (error) {
        // Failed to fetch agents on startup
        const message = error instanceof Error ? error.message : String(error);
        console.error("[stream] Startup error:", message);

        // Send error event to client
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: "Failed to fetch initial agent list",
              })}\n\n`
            )
          );
        } catch {
          // Ignore if already closed
        }

        // After sending error, wait a bit and close
        setTimeout(() => {
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }, 1000);
      }
    },
  });

  // Return SSE stream response
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      // Disable gzip compression for SSE (interferes with streaming)
      "Content-Encoding": "identity",
    },
  });
}
