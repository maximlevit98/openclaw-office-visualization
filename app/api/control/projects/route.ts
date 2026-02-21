import { NextRequest, NextResponse } from "next/server";
import { errorResponse, parseJSONBody, successResponse } from "@/lib/api-utils";
import {
  createControlProject,
  listControlProjects,
  type ControlProject,
} from "@/lib/openclaw-control";

export const runtime = "nodejs";

interface CreateProjectBody {
  name: string;
  id?: string;
  description?: string;
}

interface ControlProjectListItem extends ControlProject {
  agentCount: number;
}

function toListItem(project: ControlProject): ControlProjectListItem {
  return {
    ...project,
    agentCount: project.agentIds.length,
  };
}

/**
 * GET /api/control/projects
 * Lists all tracked projects managed by the control panel.
 */
export async function GET(
  _request: NextRequest
): Promise<NextResponse<ControlProjectListItem[] | { error: string; details?: string }>> {
  try {
    const projects = await listControlProjects();
    return successResponse(projects.map(toListItem));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse("Failed to list projects", message, 500);
  }
}

/**
 * POST /api/control/projects
 * Body: { name: string, id?: string, description?: string }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ControlProjectListItem | { error: string; details?: string }>> {
  try {
    const body = await parseJSONBody<CreateProjectBody>(request);
    if (typeof body.name !== "string" || !body.name.trim()) {
      return errorResponse("Invalid request body", "name must be a non-empty string", 400);
    }

    if (body.id !== undefined && typeof body.id !== "string") {
      return errorResponse("Invalid request body", "id must be a string", 400);
    }

    if (body.description !== undefined && typeof body.description !== "string") {
      return errorResponse("Invalid request body", "description must be a string", 400);
    }

    const created = await createControlProject({
      name: body.name,
      id: body.id,
      description: body.description,
    });
    return successResponse(toListItem(created), 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse("Failed to create project", message, 500);
  }
}
