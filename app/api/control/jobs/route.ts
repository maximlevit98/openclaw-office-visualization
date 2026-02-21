import { NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import {
  listCronJobs,
  roleAliasFromJobName,
  scheduleLabel,
  type CronJob,
} from "@/lib/openclaw-control";

export const runtime = "nodejs";

export interface ControlJobListItem {
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
}

function toListItem(job: CronJob): ControlJobListItem {
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
  };
}

/**
 * GET /api/control/jobs
 * Returns all cron jobs with compact metadata for the control panel.
 */
export async function GET(
  _request: NextRequest
): Promise<NextResponse<ControlJobListItem[] | { error: string; details?: string }>> {
  try {
    const jobs = await listCronJobs();
    return successResponse(jobs.map(toListItem));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse("Failed to load control jobs", message, 500);
  }
}
