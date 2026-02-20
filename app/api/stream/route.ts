import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/stream
 * Server-sent events stream (stub)
 * Full implementation depends on gateway SSE availability
 */
export async function GET(request: NextRequest) {
  try {
    // Stub implementation: return a test event stream
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        controller.enqueue(
          encoder.encode('data: {"status":"connected"}\n\n')
        );

        // Send a heartbeat every 30 seconds
        const interval = setInterval(() => {
          controller.enqueue(encoder.encode('data: {"type":"heartbeat"}\n\n'));
        }, 30000);

        // Cleanup on close
        request.signal.addEventListener("abort", () => {
          clearInterval(interval);
          controller.close();
        });
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Stream error:", message);
    return NextResponse.json(
      { error: "Stream initialization failed" },
      { status: 500 }
    );
  }
}
