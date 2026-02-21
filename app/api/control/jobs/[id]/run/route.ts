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
  runCronNow,
  type CronRunEntry,
} from "@/lib/openclaw-control";

export const runtime = "nodejs";

interface RunJobResponse {
  ok: boolean;
  id: string;
  runResult: unknown;
  lastRun: CronRunEntry | null;
}

/**
 * POST /api/control/jobs/[id]/run
 * Triggers cron job immediately and returns latest run snapshot.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<RunJobResponse | { error: string; details?: string }>> {
  try {
    const { id } = await params;
    const jobId = getPathParamValidated({ id }, "id", {
      required: true,
      maxLength: VALIDATION_LIMITS.SESSION_KEY_MAX_LENGTH,
    });

    const runResult = await runCronNow(jobId);
    const runs = await getCronRuns(jobId, 12);
    const lastRun = pickLatestMeaningfulRunEntry(runs.entries);

    return successResponse({
      ok: true,
      id: jobId,
      runResult,
      lastRun,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isAuth = message.includes("auth") || message.includes("permission");
    const isTimeout = message.includes("timeout");
    const detail = isAuth
      ? "Permission denied. Verify job ownership and credentials."
      : isTimeout
        ? "Job execution timed out. Check job payload and gateway connectivity."
        : message;
    return errorResponse("Failed to run control job", detail, isAuth ? 403 : 500);
  }
}
