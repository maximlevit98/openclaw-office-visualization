import { listAgents } from "@/lib/gateway-adapter";
import { NextResponse } from "next/server";

/**
 * GET /api/agents
 * List available agents
 */
export async function GET() {
  try {
    const agents = await listAgents();
    return NextResponse.json(agents);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to list agents:", message);
    return NextResponse.json(
      { error: "Failed to list agents", details: message },
      { status: 500 }
    );
  }
}
