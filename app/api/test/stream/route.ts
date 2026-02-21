import { NextRequest, NextResponse } from "next/server";
import { generateMockAgents, simulateAgentStatusChange } from "@/lib/mock-data";

/**
 * GET /api/test/stream
 * TEST ENDPOINT: Simulates SSE stream with mock agents
 * 
 * Use this for local testing of the usePresence() hook without a real gateway
 * In production, this will fall back gracefully to the real /api/stream endpoint
 * 
 * Features:
 * - Sends initial agent list
 * - Simulates status changes every 5 seconds
 * - Same protocol as /api/stream (agent_status + heartbeat)
 * - Safe to call multiple times (no shared state)
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      try {
        // 1. Get initial mock agents
        const agents = generateMockAgents();
        console.log(`[test/stream] Client connected, sending ${agents.length} mock agents`);

        // 2. Send each agent as agent_status event
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
              `[test/stream] Failed to send agent ${agent.id}:`,
              error instanceof Error ? error.message : String(error)
            );
          }
        });

        // 3. Simulate agent status changes every 5 seconds (for testing)
        let changeInterval: NodeJS.Timeout | null = null;
        let agentStates = [...agents];
        let eventCount = agents.length;

        const startStatusUpdates = () => {
          changeInterval = setInterval(() => {
            try {
              // Randomly pick an agent and change its status
              const randomIdx = Math.floor(Math.random() * agentStates.length);
              const agent = agentStates[randomIdx];
              const updated = simulateAgentStatusChange(agent);
              agentStates[randomIdx] = updated;

              const eventData = {
                type: "agent_status",
                agent: {
                  id: updated.id,
                  name: updated.name || updated.id,
                  status: updated.status || "offline",
                  kind: updated.kind,
                  lastSeen: updated.lastSeen,
                },
              };

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(eventData)}\n\n`)
              );

              eventCount++;
              console.log(
                `[test/stream] Status update #${eventCount}: ${agent.name} → ${updated.status}`
              );
            } catch (error) {
              console.error("[test/stream] Failed to send status update:", error);
              if (changeInterval) {
                clearInterval(changeInterval);
              }
            }
          }, 5000); // Update every 5 seconds for demo purposes
        };

        // 4. Send heartbeat every 30 seconds
        const heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "heartbeat" })}\n\n`)
            );
          } catch (error) {
            console.log("[test/stream] Heartbeat failed (client disconnected)");
            clearInterval(heartbeatInterval);
            if (changeInterval) {
              clearInterval(changeInterval);
            }
          }
        }, 30000);

        // Start status updates after initial send
        startStatusUpdates();

        // 5. Cleanup on client disconnect
        request.signal.addEventListener("abort", () => {
          console.log("[test/stream] Client disconnected, cleaning up...");
          if (changeInterval) {
            clearInterval(changeInterval);
          }
          clearInterval(heartbeatInterval);
          try {
            controller.close();
          } catch (error) {
            // Already closed
          }
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[test/stream] Startup error:", message);

        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: "Failed to initialize test stream",
              })}\n\n`
            )
          );
        } catch {
          // Ignore if already closed
        }

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
      "Content-Encoding": "identity",
    },
  });
}
