import { execFile } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const ROLE_TO_JOB_NAME: Record<string, string> = {
  designer: "office-designer-loop",
  backend: "office-backend-loop",
  frontend: "office-frontend-loop",
  tester: "office-tester-loop",
  debugger: "office-debugger-loop",
  product: "office-product-loop",
  producer: "office-producer-approval",
  summary: "office-exec-summary",
  "tg-morning": "news-digest-morning",
  "tg-evening": "news-digest-evening",
};

export interface CronJobState {
  nextRunAtMs?: number;
  lastRunAtMs?: number;
  lastStatus?: string;
  lastDurationMs?: number;
  consecutiveErrors?: number;
  lastError?: string;
}

export interface CronJobPayload {
  kind?: string;
  message?: string;
  model?: string;
  timeoutSeconds?: number;
  thinking?: string;
}

export interface CronJobSchedule {
  kind?: string;
  expr?: string;
  everyMs?: number;
  staggerMs?: number;
}

export interface CronJob {
  id: string;
  name: string;
  agentId: string;
  enabled: boolean;
  schedule?: CronJobSchedule;
  payload?: CronJobPayload;
  state?: CronJobState;
}

export interface CronRunEntry {
  ts?: number;
  jobId?: string;
  action?: string;
  status?: string;
  summary?: string;
  error?: string;
  runAtMs?: number;
  durationMs?: number;
  nextRunAtMs?: number;
  model?: string;
  provider?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  sessionId?: string;
  sessionKey?: string;
}

export interface CronRunsResponse {
  entries: CronRunEntry[];
}

export interface OpenClawAgent {
  id: string;
  name?: string;
  identityName?: string;
  identityEmoji?: string;
  identitySource?: string;
  workspace: string;
  agentDir?: string;
  model?: string;
  bindings?: number;
  isDefault?: boolean;
  routes?: string[];
}

export interface AgentChatTurnInput {
  agentId: string;
  message: string;
  sessionId?: string;
  timeoutSeconds?: number;
}

export interface AgentChatTurnResult {
  agentId: string;
  sessionId?: string;
  status?: string;
  summary?: string;
  reply: string;
  runId?: string;
  model?: string;
  provider?: string;
  durationMs?: number;
  usage?: {
    input?: number;
    output?: number;
    cacheRead?: number;
    cacheWrite?: number;
    total?: number;
  };
}

export interface ControlProject {
  id: string;
  name: string;
  description?: string;
  workspaceRoot: string;
  agentIds: string[];
  createdAtMs: number;
  updatedAtMs: number;
}

interface ControlProjectStore {
  version: 1;
  projects: ControlProject[];
}

export interface CreateControlProjectInput {
  name: string;
  id?: string;
  description?: string;
}

export interface CreateProjectAgentInput {
  name: string;
  id?: string;
  model?: string;
  emoji?: string;
  theme?: string;
}

export interface CreateProjectAgentResult {
  project: ControlProject;
  agent: OpenClawAgent;
}

const CONTROL_STATE_DIR =
  process.env.OPENCLAW_CONTROL_STATE_DIR?.trim() ||
  path.join(os.homedir(), ".openclaw", "control");
const CONTROL_PROJECTS_FILE =
  process.env.OPENCLAW_CONTROL_PROJECTS_FILE?.trim() ||
  path.join(CONTROL_STATE_DIR, "projects.json");
const CONTROL_PROJECTS_WORKSPACES_ROOT =
  process.env.OPENCLAW_CONTROL_PROJECTS_ROOT?.trim() ||
  path.join(os.homedir(), ".openclaw", "workspaces", "projects");

function getOpenClawBin(): string {
  const explicit = process.env.OPENCLAW_BIN?.trim();
  if (explicit) return explicit;

  const homebrew = "/opt/homebrew/bin/openclaw";
  if (existsSync(homebrew)) return homebrew;

  return "openclaw";
}

function getCommandEnv(): NodeJS.ProcessEnv {
  const basePath = process.env.PATH || "/usr/bin:/bin:/usr/sbin:/sbin";
  return {
    ...process.env,
    PATH: `/opt/homebrew/bin:/opt/homebrew/sbin:${basePath}`,
  };
}

function parseJsonLoose<T>(raw: string): T {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("OpenClaw returned empty output");
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const objectStart = trimmed.indexOf("{");
    const objectEnd = trimmed.lastIndexOf("}");
    const arrayStart = trimmed.indexOf("[");
    const arrayEnd = trimmed.lastIndexOf("]");
    const candidates: string[] = [];

    if (objectStart >= 0 && objectEnd > objectStart) {
      candidates.push(trimmed.slice(objectStart, objectEnd + 1));
    }
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      candidates.push(trimmed.slice(arrayStart, arrayEnd + 1));
    }

    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate) as T;
      } catch {
        // Continue to next candidate.
      }
    }
  }

  throw new Error(`Failed to parse OpenClaw JSON output: ${trimmed.slice(0, 300)}`);
}

export async function runOpenClaw(args: string[], timeoutMs = 90000): Promise<string> {
  const command = getOpenClawBin();
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      env: getCommandEnv(),
      timeout: timeoutMs,
      maxBuffer: 20 * 1024 * 1024,
    });

    const output = (stdout || "").trim() || (stderr || "").trim();
    if (!output) {
      return "{}";
    }

    return output;
  } catch (error) {
    const err = error as Error & { stderr?: string; stdout?: string };
    const details = [err.message, err.stderr, err.stdout].filter(Boolean).join(" | ");
    throw new Error(`OpenClaw command failed: ${details}`);
  }
}

export async function listCronJobs(): Promise<CronJob[]> {
  const raw = await runOpenClaw(["cron", "list", "--all", "--json"]);
  const parsed = parseJsonLoose<{ jobs?: CronJob[] }>(raw);
  return Array.isArray(parsed.jobs) ? parsed.jobs : [];
}

export async function getCronJobById(id: string): Promise<CronJob | null> {
  const jobs = await listCronJobs();
  return jobs.find((job) => job.id === id) || null;
}

export async function getCronRuns(id: string, limit = 1): Promise<CronRunsResponse> {
  const raw = await runOpenClaw(["cron", "runs", "--id", id, "--limit", String(limit)]);
  const parsed = parseJsonLoose<CronRunsResponse>(raw);
  const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
  entries.sort((a, b) => runEntryTimestamp(b) - runEntryTimestamp(a));
  return {
    entries,
  };
}

function runEntryTimestamp(entry: CronRunEntry): number {
  if (typeof entry.runAtMs === "number") return entry.runAtMs;
  if (typeof entry.ts === "number") return entry.ts;
  return 0;
}

export function pickLatestMeaningfulRunEntry(entries: CronRunEntry[]): CronRunEntry | null {
  if (!Array.isArray(entries) || entries.length === 0) return null;

  const byRecency = [...entries].sort(
    (a, b) => runEntryTimestamp(b) - runEntryTimestamp(a)
  );

  const finishedWithContent = byRecency.find((entry) => {
    if (entry.action !== "finished") return false;
    return Boolean(
      entry.summary ||
      entry.error ||
      entry.status ||
      typeof entry.durationMs === "number" ||
      entry.usage
    );
  });
  if (finishedWithContent) return finishedWithContent;

  const withAnyText = byRecency.find((entry) => Boolean(entry.summary || entry.error));
  if (withAnyText) return withAnyText;

  return byRecency[0] || null;
}

export async function updateCronPrompt(id: string, prompt: string): Promise<CronJob> {
  await runOpenClaw(["cron", "edit", id, "--message", prompt], 120000);
  const updated = await getCronJobById(id);
  if (!updated) {
    throw new Error(`Cron job not found after update: ${id}`);
  }
  return updated;
}

export async function runCronNow(id: string): Promise<unknown> {
  const raw = await runOpenClaw(["cron", "run", id], 180000);
  try {
    return parseJsonLoose<Record<string, unknown>>(raw);
  } catch {
    return { ok: true, raw };
  }
}

export async function runAgentChatTurn(input: AgentChatTurnInput): Promise<AgentChatTurnResult> {
  const agentId = input.agentId.trim();
  const message = input.message.trim();
  if (!agentId) {
    throw new Error("agentId is required");
  }
  if (!message) {
    throw new Error("message is required");
  }

  const timeoutSeconds = Math.max(15, Math.min(input.timeoutSeconds ?? 180, 1800));
  const args = [
    "agent",
    "--agent",
    agentId,
    "--message",
    message,
    "--channel",
    "last",
    "--json",
    "--timeout",
    String(timeoutSeconds),
    "--verbose",
    "off",
  ];

  if (input.sessionId?.trim()) {
    args.push("--session-id", input.sessionId.trim());
  }

  const raw = await runOpenClaw(args, (timeoutSeconds + 20) * 1000);
  const parsed = parseJsonLoose<Record<string, unknown>>(raw);

  const result = (parsed.result || {}) as Record<string, unknown>;
  const payloads = Array.isArray(result.payloads)
    ? result.payloads.filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object"))
    : [];
  const reply = payloads
    .map((entry) => (typeof entry.text === "string" ? entry.text.trim() : ""))
    .filter(Boolean)
    .join("\n\n");

  const meta =
    result.meta && typeof result.meta === "object"
      ? (result.meta as Record<string, unknown>)
      : {};
  const agentMeta =
    meta.agentMeta && typeof meta.agentMeta === "object"
      ? (meta.agentMeta as Record<string, unknown>)
      : {};
  const usage =
    agentMeta.usage && typeof agentMeta.usage === "object"
      ? (agentMeta.usage as Record<string, unknown>)
      : {};

  return {
    agentId,
    sessionId:
      (typeof agentMeta.sessionId === "string" && agentMeta.sessionId) ||
      input.sessionId,
    status: typeof parsed.status === "string" ? parsed.status : undefined,
    summary: typeof parsed.summary === "string" ? parsed.summary : undefined,
    reply: reply || (typeof parsed.summary === "string" ? parsed.summary : ""),
    runId: typeof parsed.runId === "string" ? parsed.runId : undefined,
    model: typeof agentMeta.model === "string" ? agentMeta.model : undefined,
    provider: typeof agentMeta.provider === "string" ? agentMeta.provider : undefined,
    durationMs: typeof meta.durationMs === "number" ? meta.durationMs : undefined,
    usage: {
      input: typeof usage.input === "number" ? usage.input : undefined,
      output: typeof usage.output === "number" ? usage.output : undefined,
      cacheRead: typeof usage.cacheRead === "number" ? usage.cacheRead : undefined,
      cacheWrite: typeof usage.cacheWrite === "number" ? usage.cacheWrite : undefined,
      total: typeof usage.total === "number" ? usage.total : undefined,
    },
  };
}

export function scheduleLabel(schedule?: CronJobSchedule): string {
  if (!schedule || !schedule.kind) return "-";
  if (schedule.kind === "cron") return schedule.expr || "cron";
  if (schedule.kind === "every") {
    const ms = schedule.everyMs || 0;
    if (ms <= 0) return "every";
    const minutes = Math.round(ms / 60000);
    if (minutes < 60) return `every ${minutes}m`;
    const hours = Math.round(minutes / 60);
    return `every ${hours}h`;
  }
  return schedule.kind;
}

export function roleAliasFromJobName(name: string): string | null {
  const entry = Object.entries(ROLE_TO_JOB_NAME).find(([, jobName]) => jobName === name);
  return entry ? entry[0] : null;
}

export function knownRoleAliases(): string[] {
  return Object.keys(ROLE_TO_JOB_NAME);
}

function ensureControlStoreDir(): void {
  mkdirSync(path.dirname(CONTROL_PROJECTS_FILE), { recursive: true });
  mkdirSync(CONTROL_PROJECTS_WORKSPACES_ROOT, { recursive: true });
}

function toSlug(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.slice(0, 48);
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => typeof value === "string" && value.length > 0)));
}

function normalizeProject(raw: unknown): ControlProject | null {
  if (!raw || typeof raw !== "object") return null;
  const project = raw as Partial<ControlProject>;
  if (!project.id || typeof project.id !== "string") return null;
  if (!project.name || typeof project.name !== "string") return null;
  if (!project.workspaceRoot || typeof project.workspaceRoot !== "string") return null;

  return {
    id: project.id,
    name: project.name,
    description: typeof project.description === "string" ? project.description : undefined,
    workspaceRoot: project.workspaceRoot,
    agentIds: Array.isArray(project.agentIds)
      ? dedupe(project.agentIds.filter((entry): entry is string => typeof entry === "string"))
      : [],
    createdAtMs: typeof project.createdAtMs === "number" ? project.createdAtMs : Date.now(),
    updatedAtMs: typeof project.updatedAtMs === "number" ? project.updatedAtMs : Date.now(),
  };
}

function readControlProjectStore(): ControlProjectStore {
  ensureControlStoreDir();
  if (!existsSync(CONTROL_PROJECTS_FILE)) {
    return { version: 1, projects: [] };
  }

  try {
    const raw = readFileSync(CONTROL_PROJECTS_FILE, "utf8").trim();
    if (!raw) return { version: 1, projects: [] };
    const parsed = JSON.parse(raw) as Partial<ControlProjectStore>;
    const projects = Array.isArray(parsed.projects)
      ? parsed.projects.map(normalizeProject).filter((entry): entry is ControlProject => entry !== null)
      : [];
    return { version: 1, projects };
  } catch {
    return { version: 1, projects: [] };
  }
}

function writeControlProjectStore(store: ControlProjectStore): void {
  ensureControlStoreDir();
  writeFileSync(CONTROL_PROJECTS_FILE, JSON.stringify(store, null, 2), "utf8");
}

function projectWorkspaceContains(workspace: string | undefined, workspaceRoot: string): boolean {
  if (!workspace) return false;
  const normalizedWorkspace = path.resolve(workspace);
  const normalizedRoot = path.resolve(workspaceRoot);
  return (
    normalizedWorkspace === normalizedRoot ||
    normalizedWorkspace.startsWith(`${normalizedRoot}${path.sep}`)
  );
}

function buildProjectId(name: string, explicitId?: string): string {
  const base = toSlug(explicitId || name);
  if (!base) {
    throw new Error("Project id is empty after normalization. Use letters and numbers.");
  }
  return base;
}

function ensureUniqueProjectId(existing: Set<string>, base: string): string {
  if (!existing.has(base)) return base;
  for (let i = 2; i <= 9999; i += 1) {
    const candidate = `${base}-${i}`;
    if (!existing.has(candidate)) return candidate;
  }
  throw new Error(`Could not allocate unique project id for '${base}'.`);
}

function ensureUniqueAgentId(existing: Set<string>, preferred: string): string {
  if (!existing.has(preferred)) return preferred;
  for (let i = 2; i <= 9999; i += 1) {
    const candidate = `${preferred}-${i}`;
    if (!existing.has(candidate)) return candidate;
  }
  throw new Error(`Could not allocate unique agent id for '${preferred}'.`);
}

async function maybeBootstrapProjectFromExistingAgents(
  store: ControlProjectStore
): Promise<ControlProjectStore> {
  if (store.projects.length > 0) return store;

  let existingAgentIds: string[] = [];
  try {
    const agents = await listOpenClawAgents();
    existingAgentIds = dedupe(agents.map((agent) => agent.id));
  } catch {
    // Keep fallback below.
  }

  // Fallback: derive active agent ids from cron jobs when agent listing is unavailable.
  if (existingAgentIds.length === 0) {
    try {
      const jobs = await listCronJobs();
      existingAgentIds = dedupe(jobs.map((job) => job.agentId));
    } catch {
      return store;
    }
  }

  if (existingAgentIds.length === 0) return store;

  const bootstrapId = "openclaw-main";
  const workspaceRoot = path.join(CONTROL_PROJECTS_WORKSPACES_ROOT, bootstrapId);
  mkdirSync(workspaceRoot, { recursive: true });
  const now = Date.now();

  const bootstrapProject: ControlProject = {
    id: bootstrapId,
    name: "Main Workspace",
    description: "Auto-imported from existing OpenClaw agents/jobs",
    workspaceRoot,
    agentIds: existingAgentIds,
    createdAtMs: now,
    updatedAtMs: now,
  };

  const nextStore: ControlProjectStore = {
    version: 1,
    projects: [bootstrapProject],
  };
  writeControlProjectStore(nextStore);
  return nextStore;
}

export async function listControlProjects(): Promise<ControlProject[]> {
  const store = await maybeBootstrapProjectFromExistingAgents(readControlProjectStore());
  return [...store.projects].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getControlProjectById(id: string): Promise<ControlProject | null> {
  const store = await maybeBootstrapProjectFromExistingAgents(readControlProjectStore());
  return store.projects.find((project) => project.id === id) || null;
}

export async function createControlProject(input: CreateControlProjectInput): Promise<ControlProject> {
  const name = input.name?.trim();
  if (!name) {
    throw new Error("Project name is required.");
  }

  const store = readControlProjectStore();
  const existing = new Set(store.projects.map((project) => project.id));
  const baseId = buildProjectId(name, input.id);
  const id = ensureUniqueProjectId(existing, baseId);
  const workspaceRoot = path.join(CONTROL_PROJECTS_WORKSPACES_ROOT, id);
  mkdirSync(workspaceRoot, { recursive: true });

  const now = Date.now();
  const project: ControlProject = {
    id,
    name,
    description: input.description?.trim() || undefined,
    workspaceRoot,
    agentIds: [],
    createdAtMs: now,
    updatedAtMs: now,
  };

  store.projects.push(project);
  writeControlProjectStore(store);
  return project;
}

export async function listOpenClawAgents(): Promise<OpenClawAgent[]> {
  const raw = await runOpenClaw(["agents", "list", "--json"], 120000);
  const parsed = parseJsonLoose<OpenClawAgent[] | { agents?: OpenClawAgent[] }>(raw);
  if (Array.isArray(parsed)) {
    return parsed;
  }
  return Array.isArray(parsed.agents) ? parsed.agents : [];
}

export async function listProjectAgents(projectId: string): Promise<OpenClawAgent[]> {
  const store = readControlProjectStore();
  const project = store.projects.find((entry) => entry.id === projectId);
  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const allAgents = await listOpenClawAgents();
  const discoveredIds = allAgents
    .filter((agent) => projectWorkspaceContains(agent.workspace, project.workspaceRoot))
    .map((agent) => agent.id);
  const mergedAgentIds = dedupe([...project.agentIds, ...discoveredIds]);

  if (mergedAgentIds.join(",") !== project.agentIds.join(",")) {
    project.agentIds = mergedAgentIds;
    project.updatedAtMs = Date.now();
    writeControlProjectStore(store);
  }

  const tracked = new Set(project.agentIds);
  return allAgents.filter((agent) => tracked.has(agent.id));
}

export async function createProjectAgent(
  projectId: string,
  input: CreateProjectAgentInput
): Promise<CreateProjectAgentResult> {
  const store = readControlProjectStore();
  const project = store.projects.find((entry) => entry.id === projectId);
  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const name = input.name?.trim();
  if (!name) {
    throw new Error("Agent name is required.");
  }

  const allAgents = await listOpenClawAgents();
  const existingIds = new Set(allAgents.map((agent) => agent.id));
  const suffix = toSlug(input.id || name) || "agent";
  const preferredId = `${project.id}-${suffix}`;
  const agentId = ensureUniqueAgentId(existingIds, preferredId);
  const workspace = path.join(project.workspaceRoot, agentId);
  mkdirSync(workspace, { recursive: true });

  const createArgs = [
    "agents",
    "add",
    agentId,
    "--workspace",
    workspace,
    "--non-interactive",
    "--json",
  ];
  if (input.model?.trim()) {
    createArgs.push("--model", input.model.trim());
  }
  await runOpenClaw(createArgs, 180000);

  const setIdentityArgs = ["agents", "set-identity", "--agent", agentId];
  const hasIdentity =
    Boolean(name) ||
    Boolean(input.emoji?.trim()) ||
    Boolean(input.theme?.trim());
  if (hasIdentity) {
    setIdentityArgs.push("--name", name);
    if (input.emoji?.trim()) {
      setIdentityArgs.push("--emoji", input.emoji.trim());
    }
    if (input.theme?.trim()) {
      setIdentityArgs.push("--theme", input.theme.trim());
    }
    setIdentityArgs.push("--json");
    try {
      await runOpenClaw(setIdentityArgs, 120000);
    } catch (error) {
      console.warn("Failed to set agent identity:", error);
    }
  }

  const refreshedAgents = await listOpenClawAgents();
  const createdAgent =
    refreshedAgents.find((agent) => agent.id === agentId) ||
    ({
      id: agentId,
      name,
      workspace,
      model: input.model?.trim() || undefined,
    } as OpenClawAgent);

  project.agentIds = dedupe([...project.agentIds, agentId]);
  project.updatedAtMs = Date.now();
  writeControlProjectStore(store);

  return {
    project,
    agent: createdAgent,
  };
}
