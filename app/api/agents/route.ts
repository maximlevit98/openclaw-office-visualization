import { listAgents, type Agent } from "@/lib/gateway-adapter";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";

/**
 * GET /api/agents
 * List available agents
 */
export async function GET(
  _request: NextRequest
): Promise<NextResponse<Agent[] | { error: string; details?: string }>> {
  try {
    const agents = await listAgents();
    return successResponse(agents);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to list agents:", message);
    return errorResponse("Failed to list agents", message, 500);
  }
}
