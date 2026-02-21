import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  getPathParamValidated,
  parseJSONBody,
  successResponse,
  VALIDATION_LIMITS,
} from "@/lib/api-utils";
import { updateCronPrompt } from "@/lib/openclaw-control";

export const runtime = "nodejs";

interface UpdatePromptBody {
  prompt: string;
}

interface UpdatePromptResponse {
  ok: boolean;
  id: string;
}

/**
 * POST /api/control/jobs/[id]/prompt
 * Body: { prompt: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<UpdatePromptResponse | { error: string; details?: string }>> {
  try {
    const { id } = await params;
    const jobId = getPathParamValidated({ id }, "id", {
      required: true,
      maxLength: VALIDATION_LIMITS.SESSION_KEY_MAX_LENGTH,
    });

    const body = await parseJSONBody<UpdatePromptBody>(request);
    if (typeof body.prompt !== "string") {
      return errorResponse("Invalid request body", "prompt must be a string", 400);
    }

    if (!body.prompt.trim()) {
      return errorResponse("Invalid request body", "prompt cannot be empty", 400);
    }

    await updateCronPrompt(jobId, body.prompt);
    return successResponse({ ok: true, id: jobId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse("Failed to update prompt", message, 500);
  }
}
