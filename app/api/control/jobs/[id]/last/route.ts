import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  getPathParamValidated,
  successResponse,
  VALIDATION_LIMITS,
} from "@/lib/api-utils";
import {
  getCronRuns,
  pickLatestMeaningfulRunEntry,
  type CronRunEntry,
} from "@/lib/openclaw-control";

export const runtime = "nodejs";

interface LastRunResponse {
  id: string;
  lastRun: CronRunEntry | null;
}

/**
 * GET /api/control/jobs/[id]/last
 * Returns the most recent run entry for a cron job.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<LastRunResponse | { error: string; details?: string }>> {
  try {
    const { id } = await params;
    const jobId = getPathParamValidated({ id }, "id", {
      required: true,
      maxLength: VALIDATION_LIMITS.SESSION_KEY_MAX_LENGTH,
    });

    const runs = await getCronRuns(jobId, 12);
    return successResponse({
      id: jobId,
      lastRun: pickLatestMeaningfulRunEntry(runs.entries),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse("Failed to load last run", message, 500);
  }
}
