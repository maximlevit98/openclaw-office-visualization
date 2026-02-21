import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  getPathParamValidated,
  successResponse,
  VALIDATION_LIMITS,
} from "@/lib/api-utils";
import {
  getCronJobById,
  roleAliasFromJobName,
  scheduleLabel,
  type CronJob,
} from "@/lib/openclaw-control";

export const runtime = "nodejs";

export interface ControlJobDetail {
  id: string;
  name: string;
  roleAlias: string | null;
  agentId: string;
  enabled: boolean;
  schedule: string;
  nextRunAtMs?: number;
  lastRunAtMs?: number;
  lastStatus?: string;
  lastDurationMs?: number;
  lastError?: string;
  prompt: string;
  model?: string;
  thinking?: string;
  timeoutSeconds?: number;
}

function toDetail(job: CronJob): ControlJobDetail {
  return {
    id: job.id,
    name: job.name,
    roleAlias: roleAliasFromJobName(job.name),
    agentId: job.agentId,
    enabled: job.enabled,
    schedule: scheduleLabel(job.schedule),
    nextRunAtMs: job.state?.nextRunAtMs,
    lastRunAtMs: job.state?.lastRunAtMs,
    lastStatus: job.state?.lastStatus,
    lastDurationMs: job.state?.lastDurationMs,
    lastError: job.state?.lastError,
    prompt: job.payload?.message || "",
    model: job.payload?.model,
    thinking: job.payload?.thinking,
    timeoutSeconds: job.payload?.timeoutSeconds,
  };
}

/**
 * GET /api/control/jobs/[id]
 * Returns full prompt + runtime metadata for one cron job.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ControlJobDetail | { error: string; details?: string }>> {
  try {
    const { id } = await params;
    const jobId = getPathParamValidated({ id }, "id", {
      required: true,
      maxLength: VALIDATION_LIMITS.SESSION_KEY_MAX_LENGTH,
    });

    const job = await getCronJobById(jobId);
    if (!job) {
      return errorResponse("Control job not found", jobId, 404);
    }

    return successResponse(toDetail(job));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse("Failed to load control job", message, 500);
  }
}
