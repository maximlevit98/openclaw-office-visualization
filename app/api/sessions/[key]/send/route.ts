import { sendToSession } from "@/lib/gateway-adapter";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/sessions/[key]/send
 * Send a message to a session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    if (!key) {
      return NextResponse.json(
        { error: "Session key is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { message, timeoutSeconds } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const result = await sendToSession(key, message, timeoutSeconds);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to send message to session:", message);
    return NextResponse.json(
      { error: "Failed to send message", details: message },
      { status: 500 }
    );
  }
}
