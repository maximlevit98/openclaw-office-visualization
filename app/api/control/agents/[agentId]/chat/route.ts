import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  getPathParamValidated,
  parseJSONBody,
  successResponse,
  validateMessage,
  VALIDATION_LIMITS,
} from "@/lib/api-utils";
import { runAgentChatTurn } from "@/lib/openclaw-control";

export const runtime = "nodejs";

interface AgentChatBody {
  message: string;
  sessionId?: string;
}

interface AgentChatResponse {
  ok: boolean;
  agentId: string;
  sessionId?: string;
  status?: string;
  summary?: string;
  reply: string;
  runId?: string;
  model?: string;
  provider?: string;
  durationMs?: number;
  usage?: {
    input?: number;
    output?: number;
    cacheRead?: number;
    cacheWrite?: number;
    total?: number;
  };
}

/**
 * POST /api/control/agents/[agentId]/chat
 * Body: { message: string, sessionId?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
): Promise<NextResponse<AgentChatResponse | { error: string; details?: string }>> {
  try {
    const { agentId } = await params;
    const id = getPathParamValidated({ agentId }, "agentId", {
      required: true,
      maxLength: VALIDATION_LIMITS.SESSION_KEY_MAX_LENGTH,
    });

    const body = await parseJSONBody<AgentChatBody>(request);
    const message = validateMessage(body.message);
    const sessionId =
      typeof body.sessionId === "string" && body.sessionId.trim().length > 0
        ? body.sessionId.trim()
        : undefined;

    const result = await runAgentChatTurn({
      agentId: id,
      message,
      sessionId,
    });

    return successResponse({
      ok: true,
      agentId: result.agentId,
      sessionId: result.sessionId,
      status: result.status,
      summary: result.summary,
      reply: result.reply,
      runId: result.runId,
      model: result.model,
      provider: result.provider,
      durationMs: result.durationMs,
      usage: result.usage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse("Failed to send agent chat message", message, 500);
  }
}
