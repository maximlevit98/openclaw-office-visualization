import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  getPathParamValidated,
  getQueryParamAsPositiveInt,
  successResponse,
  VALIDATION_LIMITS,
} from "@/lib/api-utils";
import { getCronRuns, type CronRunEntry } from "@/lib/openclaw-control";

export const runtime = "nodejs";

interface RunHistoryResponse {
  id: string;
  entries: CronRunEntry[];
}

/**
 * GET /api/control/jobs/[id]/history?limit=20
 * Returns recent run entries for one cron job.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<RunHistoryResponse | { error: string; details?: string }>> {
  try {
    const { id } = await params;
    const jobId = getPathParamValidated({ id }, "id", {
      required: true,
      maxLength: VALIDATION_LIMITS.SESSION_KEY_MAX_LENGTH,
    });

    const limit =
      getQueryParamAsPositiveInt(request, "limit", {
        min: 1,
        max: 60,
      }) ?? 20;

    const runs = await getCronRuns(jobId, limit);
    return successResponse({
      id: jobId,
      entries: runs.entries,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse("Failed to load run history", message, 500);
  }
}
