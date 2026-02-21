import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  getPathParamValidated,
  successResponse,
  VALIDATION_LIMITS,
} from "@/lib/api-utils";
import {
  getControlProjectById,
  listProjectAgents,
  type ControlProject,
  type OpenClawAgent,
} from "@/lib/openclaw-control";

export const runtime = "nodejs";

interface ControlProjectDetail extends ControlProject {
  agentCount: number;
  agents: OpenClawAgent[];
}

/**
 * GET /api/control/projects/[id]
 * Returns project metadata and resolved agent list.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ControlProjectDetail | { error: string; details?: string }>> {
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
    return successResponse({
      ...project,
      agentCount: project.agentIds.length,
      agents,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse("Failed to load project detail", message, 500);
  }
}
