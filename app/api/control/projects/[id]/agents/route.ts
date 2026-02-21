import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  getPathParamValidated,
  parseJSONBody,
  successResponse,
  VALIDATION_LIMITS,
} from "@/lib/api-utils";
import {
  createProjectAgent,
  getControlProjectById,
  listProjectAgents,
  type OpenClawAgent,
} from "@/lib/openclaw-control";

export const runtime = "nodejs";

interface CreateProjectAgentBody {
  name: string;
  id?: string;
  model?: string;
  emoji?: string;
  theme?: string;
}

interface CreateProjectAgentResponse {
  ok: boolean;
  projectId: string;
  agent: OpenClawAgent;
}

/**
 * GET /api/control/projects/[id]/agents
 * Lists all agents linked to one project.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<OpenClawAgent[] | { error: string; details?: string }>> {
  try {
    const { id } = await params;
    const projectId = getPathParamValidated({ id }, "id", {
      required: true,
      maxLength: VALIDATION_LIMITS.SESSION_KEY_MAX_LENGTH,
    });

    const project = await getControlProjectById(projectId);
    if (!project) {
      return errorResponse("Project not found", projectId, 404);
    }

    const agents = await listProjectAgents(projectId);
    return successResponse(agents);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse("Failed to list project agents", message, 500);
  }
}

/**
 * POST /api/control/projects/[id]/agents
 * Body: { name: string, id?: string, model?: string, emoji?: string, theme?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<CreateProjectAgentResponse | { error: string; details?: string }>> {
  try {
    const { id } = await params;
    const projectId = getPathParamValidated({ id }, "id", {
      required: true,
      maxLength: VALIDATION_LIMITS.SESSION_KEY_MAX_LENGTH,
    });

    const project = await getControlProjectById(projectId);
    if (!project) {
      return errorResponse("Project not found", projectId, 404);
    }

    const body = await parseJSONBody<CreateProjectAgentBody>(request);
    if (typeof body.name !== "string" || !body.name.trim()) {
      return errorResponse("Invalid request body", "name must be a non-empty string", 400);
    }
    if (body.id !== undefined && typeof body.id !== "string") {
      return errorResponse("Invalid request body", "id must be a string", 400);
    }
    if (body.model !== undefined && typeof body.model !== "string") {
      return errorResponse("Invalid request body", "model must be a string", 400);
    }
    if (body.emoji !== undefined && typeof body.emoji !== "string") {
      return errorResponse("Invalid request body", "emoji must be a string", 400);
    }
    if (body.theme !== undefined && typeof body.theme !== "string") {
      return errorResponse("Invalid request body", "theme must be a string", 400);
    }

    const created = await createProjectAgent(projectId, {
      name: body.name,
      id: body.id,
      model: body.model,
      emoji: body.emoji,
      theme: body.theme,
    });

    return successResponse(
      {
        ok: true,
        projectId: created.project.id,
        agent: created.agent,
      },
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse("Failed to create project agent", message, 500);
  }
}
