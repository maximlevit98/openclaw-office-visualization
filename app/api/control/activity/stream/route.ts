import { NextRequest, NextResponse } from "next/server";
import {
  getCronRuns,
  listCronJobs,
  pickLatestMeaningfulRunEntry,
  roleAliasFromJobName,
} from "@/lib/openclaw-control";

export const runtime = "nodejs";

interface LiveActivityEntry {
  jobId: string;
  jobName: string;
  roleAlias: string | null;
  agentId: string;
  enabled: boolean;
  status: string;
  runAtMs?: number;
  lastRunAtMs?: number;
  durationMs?: number;
  model?: string;
  excerpt?: string;
  errorCode?: string; // e.g., "TIMEOUT", "AUTH", "NETWORK" extracted from error message
}

interface StreamPayload {
  type: "snapshot" | "heartbeat" | "error";
  atMs: number;
  entries?: LiveActivityEntry[];
  message?: string;
}

function buildExcerpt(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const firstLine = value.trim().split(/\r?\n/, 1)[0];
  if (!firstLine) return undefined;
  return firstLine.length > 220 ? `${firstLine.slice(0, 217)}...` : firstLine;
}

async function collectActivitySnapshot(): Promise<LiveActivityEntry[]> {
  const jobs = await listCronJobs();

  const entries = await Promise.all(
    jobs.map(async (job): Promise<LiveActivityEntry> => {
      try {
        const runs = await getCronRuns(job.id, 1);
        const latest = pickLatestMeaningfulRunEntry(runs.entries);
        const rawText = latest?.summary || latest?.error || job.state?.lastError;
        const status =
          latest?.status ||
          job.state?.lastStatus ||
          (job.enabled ? "idle" : "disabled");

        // Extract error code from error message if present
        let errorCode: string | undefined;
        if (latest?.error) {
          const match = latest.error.match(/\[([A-Z_]+)\]/);
          errorCode = match ? match[1] : undefined;
        }

        return {
          jobId: job.id,
          jobName: job.name,
          roleAlias: roleAliasFromJobName(job.name),
          agentId: job.agentId,
          enabled: job.enabled,
          status,
          runAtMs: latest?.runAtMs,
          lastRunAtMs: job.state?.lastRunAtMs,
          durationMs: latest?.durationMs ?? job.state?.lastDurationMs,
          model: latest?.model ?? job.payload?.model,
          excerpt: buildExcerpt(rawText),
          errorCode,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to read run state";
        return {
          jobId: job.id,
          jobName: job.name,
          roleAlias: roleAliasFromJobName(job.name),
          agentId: job.agentId,
          enabled: job.enabled,
          status: "error",
          runAtMs: job.state?.lastRunAtMs,
          lastRunAtMs: job.state?.lastRunAtMs,
          durationMs: job.state?.lastDurationMs,
          model: job.payload?.model,
          excerpt: buildExcerpt(message),
          errorCode: "READ_ERROR",
        };
      }
    })
  );

  return entries.sort((a, b) => {
    const aTs = a.runAtMs ?? a.lastRunAtMs ?? 0;
    const bTs = b.runAtMs ?? b.lastRunAtMs ?? 0;
    return bTs - aTs;
  });
}

function encodePayload(payload: StreamPayload): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let inFlight = false;

      const closeStream = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // Stream is already closed.
        }
      };

      const send = (payload: StreamPayload) => {
        if (closed) return;
        try {
          controller.enqueue(encodePayload(payload));
        } catch {
          closeStream();
        }
      };

      const sendSnapshot = async () => {
        if (closed || inFlight) return;
        inFlight = true;
        try {
          const entries = await collectActivitySnapshot();
          send({
            type: "snapshot",
            atMs: Date.now(),
            entries,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to collect activity snapshot";
          send({
            type: "error",
            atMs: Date.now(),
            message,
          });
        } finally {
          inFlight = false;
        }
      };

      void sendSnapshot();
      const snapshotTimer = setInterval(() => {
        void sendSnapshot();
      }, 5000);

      const heartbeatTimer = setInterval(() => {
        send({
          type: "heartbeat",
          atMs: Date.now(),
        });
      }, 30000);

      const cleanup = () => {
        clearInterval(snapshotTimer);
        clearInterval(heartbeatTimer);
        closeStream();
      };

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Encoding": "identity",
    },
  });
}
