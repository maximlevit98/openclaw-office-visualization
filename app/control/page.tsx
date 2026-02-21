"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchJSON, postJSON } from "@/lib/client-fetch";
import {
  COLORS as BASE_COLORS,
  SHADOWS as BASE_SHADOWS,
  SPACING as BASE_SPACING,
  TYPOGRAPHY as BASE_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { getLocaleButtonLabel, Locale } from "@/lib/i18n";
import { useSyncedLocale } from "@/lib/locale-client";

interface ControlJobListItem {
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

interface ControlJobDetail extends ControlJobListItem {
  prompt: string;
  model?: string;
  thinking?: string;
  timeoutSeconds?: number;
}

interface CronRunEntry {
  ts?: number;
  action?: string;
  status?: string;
  durationMs?: number;
  summary?: string;
  error?: string;
  model?: string;
  provider?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  runAtMs?: number;
}

interface LastRunResponse {
  id: string;
  lastRun: CronRunEntry | null;
}

interface RunHistoryResponse {
  id: string;
  entries: CronRunEntry[];
}

interface RunJobResponse {
  ok: boolean;
  id: string;
  runResult: unknown;
  lastRun: CronRunEntry | null;
}

interface OpenClawAgent {
  id: string;
  name?: string;
  identityName?: string;
  identityEmoji?: string;
  workspace: string;
  model?: string;
  bindings?: number;
  isDefault?: boolean;
}

interface ControlProjectListItem {
  id: string;
  name: string;
  description?: string;
  workspaceRoot: string;
  agentIds: string[];
  agentCount: number;
  createdAtMs: number;
  updatedAtMs: number;
}

interface ControlProjectDetail extends ControlProjectListItem {
  agents: OpenClawAgent[];
}

interface CreateProjectAgentResponse {
  ok: boolean;
  projectId: string;
  agent: OpenClawAgent;
}

interface AgentChatResponse {
  ok: boolean;
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

interface AgentChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  atMs: number;
}

interface AgentChatSessionState {
  sessionId?: string;
  messages: AgentChatMessage[];
}

interface MainResizeState {
  x: number;
  width: number;
}

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
}

interface LiveActivityPayload {
  type: "snapshot" | "heartbeat" | "error";
  atMs: number;
  entries?: LiveActivityEntry[];
  message?: string;
}

interface ActivityLogEntry extends LiveActivityEntry {
  eventAtMs: number;
  eventKey: string;
}

const COLORS = {
  ...BASE_COLORS,
  bgPrimary: "#0b0f17",
  bgSurface: "#111827",
  bgSidebar: "#0f1624",
  borderDefault: "#283243",
  borderSubtle: "#334156",
  textPrimary: "#e5ecf5",
  textSecondary: "#9cabbe",
  textTertiary: "#73849b",
  statusIdle: "#2ea043",
  statusError: "#f85149",
  statusOffline: "#6b778d",
  statusOnline: "#3fb9ff",
  accentPrimary: "#3d7bfa",
  accentHover: "#5a92ff",
};

const SHADOWS = {
  ...BASE_SHADOWS,
  card: "0 0 0 1px rgba(255, 255, 255, 0.02), 0 8px 18px rgba(0, 0, 0, 0.22)",
  panel: "0 1px 0 rgba(255, 255, 255, 0.03), 0 16px 34px rgba(0, 0, 0, 0.32)",
  hover: "0 0 0 1px rgba(63, 136, 255, 0.34), 0 14px 28px rgba(0, 0, 0, 0.35)",
};

const SPACING = {
  ...BASE_SPACING,
  xs: "6px",
  sm: "10px",
  md: "14px",
  lg: "18px",
  xl: "24px",
};

const TYPOGRAPHY = {
  ...BASE_TYPOGRAPHY,
  fontFamily:
    "'Inter', 'Segoe UI', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
  fontMono:
    "'SFMono-Regular', 'JetBrains Mono', 'Menlo', 'Consolas', 'Liberation Mono', monospace",
  textXs: "12px",
  textSm: "14px",
  textBase: "15px",
  textLg: "22px",
  textXl: "26px",
};

const statusColors: Record<string, string> = {
  ok: COLORS.statusIdle,
  error: COLORS.statusError,
  idle: COLORS.statusOffline,
};

const CONTROL_MAIN_SPLIT_KEY = "openclaw-control-main-split-width";
const CONTROL_MAIN_MIN_WIDTH = 280;
const CONTROL_MAIN_MAX_WIDTH = 1400;
const CONTROL_MAIN_RESIZER_WIDTH = 16;
const CHAT_ONLY_MODE = true;
const CONTROL_CHAT_STATE_KEY = "openclaw-control-agent-chat-state-v1";
const CONTROL_READ_TIMEOUT_MS = 45000;
const CONTROL_READ_RETRIES = 2;

const CONTROL_TEXT = {
  en: {
    title: "Agent Control",
    subtitle: "Multi-project admin: projects, agents, prompts, and runs in one place",
    liveFeed: "Live Agent Activity",
    liveProcessForJob: "Live Process: Selected Job",
    liveConnected: "Live: connected",
    liveReconnecting: "Live: reconnecting...",
    liveNoItems: "No agent activity yet.",
    liveNoEventsForJob: "No realtime events for this job yet.",
    liveUpdatedAt: "Updated",
    liveStreamError: "Live stream issue",
    noActivityText: "No details yet.",
    project: "Project",
    language: "Language",
    resizePanels: "Resize panels",
    autoDetectedProject: "Auto-detected project",
    loadingProjects: "Loading projects...",
    noProjectSelected: "No project selected",
    selectedProjectJobsOnly: "Only selected project jobs",
    createNewProject: "Create New Project",
    createAgent: "Create Agent",
    refreshAll: "Refresh All",
    backToOffice: "Back to Office",
    jobs: "Jobs",
    agents: "Agents",
    jobsForAgent: "Jobs For Agent",
    noAgentsInScope: "No agents in selected scope.",
    showingAllJobs: "Showing all jobs",
    loadingJobs: "Loading jobs...",
    noJobs: "No jobs found.",
    noJobsForSelectedAgents: "No jobs found for selected project agents.",
    searchAgents: "Search agents...",
    noAgentsMatchSearch: "No agents match the search.",
    selectJob: "Select a job to inspect prompt and runs.",
    loadingJobDetail: "Loading job detail...",
    failedLoadDetail: "Failed to load detail.",
    runNow: "Run Now",
    running: "Running...",
    savePrompt: "Save Prompt",
    unsavedPrompt: "Unsaved prompt changes",
    saving: "Saving...",
    agentChatPanel: "Agent Chat",
    agentChatHint: "Send direct correction to the selected agent (Cursor/Codex-style intervention).",
    agentChatEmpty: "No messages yet. Send first correction.",
    agentChatInputPlaceholder: "Example: Focus only on /control scroll bug and return concise patch summary.",
    newChat: "New Chat",
    chatReset: "Agent chat reset.",
    sendMessage: "Send",
    sendingMessage: "Sending...",
    selectAgentForChat: "Select agent/job to open chat.",
    chatSession: "session",
    agentChatPrompt: "Agent Chat / Prompt",
    showRunDetails: "Show Last Run Details",
    hideRunDetails: "Hide Last Run Details",
    expandLastRun: "Expand Last Run",
    collapseLastRun: "Close Expanded View",
    lastRun: "Last Run",
    runHistory: "Run History",
    loadingRunHistory: "Loading run history...",
    noRunHistory: "No run history yet.",
    noSummary: "No summary.",
    noRunData: "No run data yet.",
    noRunHint: "Try Run Now or Refresh All to load fresh run data.",
    createProject: "Create Project",
    createAgentModal: "Create Agent",
    close: "Close",
    name: "Name",
    projectIdOptional: "Project ID (optional)",
    descriptionOptional: "Description (optional)",
    projectNamePlaceholder: "OpenClaw Office V2",
    projectIdPlaceholder: "office-v2",
    projectDescriptionPlaceholder: "8-bit office upgrade",
    cancel: "Cancel",
    creating: "Creating...",
    agentName: "Agent name",
    agentIdSuffixOptional: "Agent ID suffix (optional)",
    modelOptional: "Model (optional)",
    agentNamePlaceholder: "Backend Worker",
    agentIdPlaceholder: "backend",
    modelPlaceholder: "anthropic/claude-haiku-4-5",
    emojiPlaceholder: "🛠️",
    themePlaceholder: "backend",
    emoji: "Emoji",
    theme: "Theme",
    selectProjectFirst: "Select a project in the top bar first.",
    labelAgent: "agent",
    labelModel: "model",
    labelThinking: "thinking",
    labelJob: "job",
    labelProject: "project",
    labelSchedule: "schedule",
    labelStatus: "status",
    labelDuration: "duration",
    labelAt: "at",
    labelTokens: "tokens",
    labelIn: "in",
    labelOut: "out",
    labelError: "error",
    noDataMarker: "-",
    projectNameRequired: "Project name is required.",
    failedLoadJobs: "Failed to load jobs",
    failedLoadProjects: "Failed to load projects",
    failedLoadProjectDetail: "Failed to load project detail",
    failedLoadJobDetail: "Failed to load job detail",
    projectCreated: "Project created",
    failedCreateProject: "Failed to create project",
    selectProjectFirstError: "Select a project first.",
    agentNameRequired: "Agent name is required.",
    agentCreatedLinked: "Agent created and linked to project.",
    failedCreateAgent: "Failed to create agent",
    promptUpdated: "Prompt updated.",
    failedSavePrompt: "Failed to save prompt",
    runSnapshotUpdated: "Run started/completed. Last run snapshot updated.",
    failedRunJob: "Failed to run job",
    showingJobsForProject: (projectId: string) => `Showing jobs for project ${projectId}`,
    selectedProjectSummary: (name: string, count: number) => `${name} (${count} agents)`,
    projectCreatedWithId: (id: string) => `Project created: ${id}`,
  },
  ru: {
    title: "Панель агентов",
    subtitle: "Управление проектами, агентами, промптами и запусками в одном месте",
    liveFeed: "Активность агентов (Live)",
    liveProcessForJob: "Live-процесс: выбранная задача",
    liveConnected: "Live: подключено",
    liveReconnecting: "Live: переподключение...",
    liveNoItems: "Пока нет активности агентов.",
    liveNoEventsForJob: "Для этой задачи пока нет realtime-событий.",
    liveUpdatedAt: "Обновлено",
    liveStreamError: "Проблема live-потока",
    noActivityText: "Деталей пока нет.",
    project: "Проект",
    language: "Язык",
    resizePanels: "Изменить ширину панелей",
    autoDetectedProject: "Автоопределенный проект",
    loadingProjects: "Загрузка проектов...",
    noProjectSelected: "Проект не выбран",
    selectedProjectJobsOnly: "Только задачи выбранного проекта",
    createNewProject: "Создать проект",
    createAgent: "Создать агента",
    refreshAll: "Обновить всё",
    backToOffice: "Назад в офис",
    jobs: "Задачи",
    agents: "Агенты",
    jobsForAgent: "Задачи агента",
    noAgentsInScope: "Нет агентов в выбранной области.",
    showingAllJobs: "Показаны все задачи",
    loadingJobs: "Загрузка задач...",
    noJobs: "Задачи не найдены.",
    noJobsForSelectedAgents: "Для агентов выбранного проекта задачи не найдены.",
    searchAgents: "Поиск агентов...",
    noAgentsMatchSearch: "По вашему поиску агенты не найдены.",
    selectJob: "Выберите задачу, чтобы посмотреть промпт и запуски.",
    loadingJobDetail: "Загрузка деталей задачи...",
    failedLoadDetail: "Не удалось загрузить детали.",
    runNow: "Запустить",
    running: "Запуск...",
    savePrompt: "Сохранить промпт",
    unsavedPrompt: "Есть несохранённые изменения промпта",
    saving: "Сохранение...",
    agentChatPanel: "Чат агента",
    agentChatHint: "Отправьте прямую корректировку выбранному агенту (в стиле Cursor/Codex).",
    agentChatEmpty: "Сообщений пока нет. Отправьте первую корректировку.",
    agentChatInputPlaceholder: "Например: Сфокусируйся только на баге со скроллом /control и верни краткий patch summary.",
    newChat: "Новый чат",
    chatReset: "Чат агента сброшен.",
    sendMessage: "Отправить",
    sendingMessage: "Отправка...",
    selectAgentForChat: "Выберите агента/задачу, чтобы открыть чат.",
    chatSession: "сессия",
    agentChatPrompt: "Чат агента / Промпт",
    showRunDetails: "Показать детали последнего запуска",
    hideRunDetails: "Скрыть детали последнего запуска",
    expandLastRun: "Развернуть последний запуск",
    collapseLastRun: "Закрыть развернутый вид",
    lastRun: "Последний запуск",
    runHistory: "История запусков",
    loadingRunHistory: "Загрузка истории запусков...",
    noRunHistory: "История запусков пока пуста.",
    noSummary: "Нет сводки.",
    noRunData: "Данных о запуске пока нет.",
    noRunHint: "Нажмите «Запустить» или «Обновить всё», чтобы получить свежие данные запуска.",
    createProject: "Создать проект",
    createAgentModal: "Создать агента",
    close: "Закрыть",
    name: "Название",
    projectIdOptional: "ID проекта (опционально)",
    descriptionOptional: "Описание (опционально)",
    projectNamePlaceholder: "Офис OpenClaw V2",
    projectIdPlaceholder: "office-v2",
    projectDescriptionPlaceholder: "Апгрейд офиса в 8-bit стиле",
    cancel: "Отмена",
    creating: "Создание...",
    agentName: "Имя агента",
    agentIdSuffixOptional: "Суффикс ID агента (опционально)",
    modelOptional: "Модель (опционально)",
    agentNamePlaceholder: "Backend Worker",
    agentIdPlaceholder: "backend",
    modelPlaceholder: "anthropic/claude-haiku-4-5",
    emojiPlaceholder: "🛠️",
    themePlaceholder: "backend",
    emoji: "Эмодзи",
    theme: "Тема",
    selectProjectFirst: "Сначала выберите проект в верхней панели.",
    labelAgent: "агент",
    labelModel: "модель",
    labelThinking: "размышления",
    labelJob: "задача",
    labelProject: "проект",
    labelSchedule: "расписание",
    labelStatus: "статус",
    labelDuration: "длительность",
    labelAt: "время",
    labelTokens: "токены",
    labelIn: "вход",
    labelOut: "выход",
    labelError: "ошибка",
    noDataMarker: "-",
    projectNameRequired: "Название проекта обязательно.",
    failedLoadJobs: "Не удалось загрузить задачи",
    failedLoadProjects: "Не удалось загрузить проекты",
    failedLoadProjectDetail: "Не удалось загрузить детали проекта",
    failedLoadJobDetail: "Не удалось загрузить детали задачи",
    projectCreated: "Проект создан",
    failedCreateProject: "Не удалось создать проект",
    selectProjectFirstError: "Сначала выберите проект.",
    agentNameRequired: "Имя агента обязательно.",
    agentCreatedLinked: "Агент создан и привязан к проекту.",
    failedCreateAgent: "Не удалось создать агента",
    promptUpdated: "Промпт обновлён.",
    failedSavePrompt: "Не удалось сохранить промпт",
    runSnapshotUpdated: "Запуск выполнен. Данные последнего запуска обновлены.",
    failedRunJob: "Не удалось запустить задачу",
    showingJobsForProject: (projectId: string) => `Показаны задачи проекта ${projectId}`,
    selectedProjectSummary: (name: string, count: number) => `${name} (${count} агентов)`,
    projectCreatedWithId: (id: string) => `Проект создан: ${id}`,
  },
} as const;

export default function ControlPage() {
  const [locale, setLocale] = useSyncedLocale("en");
  const t = CONTROL_TEXT[locale];
  const [jobs, setJobs] = useState<ControlJobListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [detail, setDetail] = useState<ControlJobDetail | null>(null);
  const [promptDraft, setPromptDraft] = useState("");
  const [lastRun, setLastRun] = useState<CronRunEntry | null>(null);
  const [runHistory, setRunHistory] = useState<CronRunEntry[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingRunHistory, setLoadingRunHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isNarrow, setIsNarrow] = useState(false);
  const [jobsPaneWidth, setJobsPaneWidth] = useState(360);
  const [isResizingMain, setIsResizingMain] = useState(false);
  const mainResizeStateRef = useRef<MainResizeState | null>(null);
  const [activityEntries, setActivityEntries] = useState<LiveActivityEntry[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [activityConnected, setActivityConnected] = useState(false);
  const [activityUpdatedAtMs, setActivityUpdatedAtMs] = useState<number | null>(null);
  const [activityError, setActivityError] = useState("");
  const activityFingerprintRef = useRef<Map<string, string>>(new Map());

  const [projects, setProjects] = useState<ControlProjectListItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [projectDetail, setProjectDetail] = useState<ControlProjectDetail | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingProjectDetail, setLoadingProjectDetail] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [scopeToProject, setScopeToProject] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [showRunDetails, setShowRunDetails] = useState(false);
  const [showRunExpanded, setShowRunExpanded] = useState(false);
  const [chatByAgent, setChatByAgent] = useState<Record<string, AgentChatSessionState>>({});
  const [chatDraftByAgent, setChatDraftByAgent] = useState<Record<string, string>>({});
  const [sendingChat, setSendingChat] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");
  const chatListRef = useRef<HTMLDivElement | null>(null);

  const [projectNameDraft, setProjectNameDraft] = useState("");
  const [projectIdDraft, setProjectIdDraft] = useState("");
  const [projectDescriptionDraft, setProjectDescriptionDraft] = useState("");

  const [agentNameDraft, setAgentNameDraft] = useState("");
  const [agentIdDraft, setAgentIdDraft] = useState("");
  const [agentModelDraft, setAgentModelDraft] = useState("");
  const [agentEmojiDraft, setAgentEmojiDraft] = useState("");
  const [agentThemeDraft, setAgentThemeDraft] = useState("");

  const projectByAgentId = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projects) {
      for (const agentId of project.agentIds || []) {
        if (!map.has(agentId)) {
          map.set(agentId, project.id);
        }
      }
    }
    return map;
  }, [projects]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const selectedProjectAgentIds = useMemo(() => {
    if (!projectDetail) return new Set<string>();
    return new Set([
      ...(projectDetail.agentIds || []),
      ...projectDetail.agents.map((agent) => agent.id),
    ]);
  }, [projectDetail]);

  const visibleJobs = useMemo(() => {
    if (!scopeToProject || !selectedProjectId) return jobs;
    if (selectedProjectAgentIds.size === 0) return [];
    return jobs.filter((job) => selectedProjectAgentIds.has(job.agentId));
  }, [jobs, scopeToProject, selectedProjectId, selectedProjectAgentIds]);

  const selectedJob = useMemo(
    () => visibleJobs.find((job) => job.id === selectedId) || null,
    [visibleJobs, selectedId]
  );

  const latestActivityByJobId = useMemo(() => {
    const map = new Map<string, LiveActivityEntry>();
    for (const entry of activityEntries) {
      if (!map.has(entry.jobId)) {
        map.set(entry.jobId, entry);
      }
    }
    return map;
  }, [activityEntries]);

  const visibleAgents = useMemo(() => {
    const byId = new Map<
      string,
      {
        id: string;
        label: string;
        model?: string;
        emoji?: string;
        jobs: ControlJobListItem[];
      }
    >();

    for (const agent of projectDetail?.agents || []) {
      byId.set(agent.id, {
        id: agent.id,
        label: agent.identityName || agent.name || agent.id,
        model: agent.model,
        emoji: agent.identityEmoji,
        jobs: [],
      });
    }

    for (const job of visibleJobs) {
      const existing = byId.get(job.agentId) || {
        id: job.agentId,
        label: job.agentId,
        jobs: [],
      };
      existing.jobs.push(job);
      byId.set(job.agentId, existing);
    }

    return Array.from(byId.values())
      .map((agent) => ({
        ...agent,
        jobs: [...agent.jobs].sort((a, b) => {
          const aTs = a.lastRunAtMs || 0;
          const bTs = b.lastRunAtMs || 0;
          return bTs - aTs;
        }),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [projectDetail, visibleJobs]);

  const filteredAgents = useMemo(() => {
    const query = agentSearch.trim().toLowerCase();
    if (!query) return visibleAgents;
    return visibleAgents.filter((agent) => {
      return (
        agent.id.toLowerCase().includes(query) ||
        agent.label.toLowerCase().includes(query) ||
        (agent.model || "").toLowerCase().includes(query)
      );
    });
  }, [visibleAgents, agentSearch]);

  const selectedAgentJobs = useMemo(() => {
    if (!selectedAgentId) return [];
    const found = visibleAgents.find((agent) => agent.id === selectedAgentId);
    return found ? found.jobs : [];
  }, [visibleAgents, selectedAgentId]);

  const selectedAgent = useMemo(
    () => visibleAgents.find((agent) => agent.id === selectedAgentId) || null,
    [visibleAgents, selectedAgentId]
  );

  const activeChatSession = selectedAgentId ? chatByAgent[selectedAgentId] : undefined;
  const activeChatMessages = activeChatSession?.messages || [];
  const activeChatDraft = selectedAgentId ? chatDraftByAgent[selectedAgentId] || "" : "";

  const selectedJobActivity = useMemo(
    () => activityLog.filter((entry) => entry.jobId === selectedId).slice(0, 16),
    [activityLog, selectedId]
  );

  const isPromptDirty = Boolean(detail && promptDraft !== (detail.prompt || ""));

  useEffect(() => {
    void Promise.all([loadJobs(), loadProjects()]);
  }, []);

  useEffect(() => {
    const sync = () => {
      const width = window.innerWidth;
      setIsNarrow(width < 1200);
      setJobsPaneWidth((current) =>
        clamp(current, CONTROL_MAIN_MIN_WIDTH, getControlMainMaxWidth(width))
      );
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(CONTROL_MAIN_SPLIT_KEY));
    if (!Number.isFinite(stored)) return;
    setJobsPaneWidth(
      clamp(stored, CONTROL_MAIN_MIN_WIDTH, getControlMainMaxWidth(window.innerWidth))
    );
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CONTROL_MAIN_SPLIT_KEY, String(Math.round(jobsPaneWidth)));
  }, [jobsPaneWidth]);

  useEffect(() => {
    if (!isResizingMain) return;

    const handleMove = (event: PointerEvent) => {
      const state = mainResizeStateRef.current;
      if (!state) return;

      const delta = event.clientX - state.x;
      const next = clamp(
        state.width + delta,
        CONTROL_MAIN_MIN_WIDTH,
        getControlMainMaxWidth(window.innerWidth)
      );
      setJobsPaneWidth(next);
    };

    const handleEnd = () => {
      setIsResizingMain(false);
      mainResizeStateRef.current = null;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
    };
  }, [isResizingMain]);

  useEffect(() => {
    if (!isResizingMain) return;
    const previousCursor = document.body.style.cursor;
    const previousSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousSelect;
    };
  }, [isResizingMain]);

  useEffect(() => {
    if (!selectedProjectId) {
      setProjectDetail(null);
      return;
    }
    void loadProjectDetail(selectedProjectId);
  }, [selectedProjectId]);

  useEffect(() => {
    if (visibleJobs.length === 0) {
      setSelectedId("");
      setSelectedAgentId("");
      setDetail(null);
      setLastRun(null);
      setRunHistory([]);
      return;
    }

    if (!selectedId || !visibleJobs.some((job) => job.id === selectedId)) {
      setSelectedId(visibleJobs[0].id);
    }
  }, [visibleJobs, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    setShowRunExpanded(false);
    void loadDetail(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (!visibleAgents.length) {
      setSelectedAgentId("");
      return;
    }

    if (!selectedAgentId || !visibleAgents.some((agent) => agent.id === selectedAgentId)) {
      const fallback = selectedJob?.agentId || visibleAgents[0].id;
      setSelectedAgentId(fallback);
    }
  }, [visibleAgents, selectedAgentId, selectedJob]);

  useEffect(() => {
    if (!CHAT_ONLY_MODE) return;
    if (filteredAgents.length === 0) return;
    if (selectedAgentId && filteredAgents.some((agent) => agent.id === selectedAgentId)) return;

    const fallback = filteredAgents[0];
    setSelectedAgentId(fallback.id);
    const firstJob = fallback.jobs[0];
    if (firstJob) {
      setSelectedId(firstJob.id);
    }
  }, [filteredAgents, selectedAgentId]);

  useEffect(() => {
    if (!selectedId) return;
    const timer = window.setInterval(() => {
      void loadRunHistory(selectedId, { silent: true });
    }, 8000);
    return () => window.clearInterval(timer);
  }, [selectedId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let active = true;
    const source = new EventSource("/api/control/activity/stream");

    source.onopen = () => {
      if (!active) return;
      setActivityConnected(true);
      setActivityError("");
    };

    source.onmessage = (event) => {
      if (!active) return;
      try {
        const payload = JSON.parse(event.data) as LiveActivityPayload;
        if (payload.type === "snapshot") {
          const nextEntries = Array.isArray(payload.entries) ? payload.entries.slice(0, 80) : [];
          const atMs = payload.atMs || Date.now();
          setActivityEntries(nextEntries);
          setActivityUpdatedAtMs(atMs);
          setActivityLog((previous) => {
            const additions: ActivityLogEntry[] = [];
            const seen = activityFingerprintRef.current;
            const isFirstSnapshot = seen.size === 0;

            for (const entry of nextEntries) {
              const fingerprint = `${entry.runAtMs || entry.lastRunAtMs || 0}|${entry.status}|${entry.excerpt || ""}`;
              const prev = seen.get(entry.jobId);
              seen.set(entry.jobId, fingerprint);
              if (prev === fingerprint) continue;
              if (isFirstSnapshot && !prev) continue;

              additions.push({
                ...entry,
                eventAtMs: atMs,
                eventKey: `${entry.jobId}:${fingerprint}`,
              });
            }

            if (additions.length === 0) return previous;
            return [...additions, ...previous].slice(0, 220);
          });
          setActivityError("");
          return;
        }
        if (payload.type === "error") {
          setActivityError(payload.message || t.liveStreamError);
          setActivityUpdatedAtMs(payload.atMs || Date.now());
          return;
        }
        if (payload.type === "heartbeat") {
          setActivityUpdatedAtMs(payload.atMs || Date.now());
        }
      } catch {
        setActivityError(t.liveStreamError);
      }
    };

    source.onerror = () => {
      if (!active) return;
      setActivityConnected(false);
    };

    return () => {
      active = false;
      source.close();
    };
  }, [t.liveStreamError]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(CONTROL_CHAT_STATE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      setChatByAgent(normalizeChatStore(parsed));
    } catch {
      // Ignore invalid local chat state.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CONTROL_CHAT_STATE_KEY, JSON.stringify(chatByAgent));
  }, [chatByAgent]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("control-cursor-theme");
    return () => {
      document.body.classList.remove("control-cursor-theme");
    };
  }, []);

  useEffect(() => {
    const node = chatListRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [selectedAgentId, activeChatMessages.length]);

  useEffect(() => {
    if (!showRunDetails) {
      setShowRunExpanded(false);
    }
  }, [showRunDetails]);

  const loadJobs = async () => {
    setLoadingList(true);
    setError("");
    try {
      const data = await fetchJSON<ControlJobListItem[]>("/api/control/jobs", {
        timeoutMs: CONTROL_READ_TIMEOUT_MS,
        retries: CONTROL_READ_RETRIES,
        skipCache: true,
      });
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.failedLoadJobs;
      setError(msg);
    } finally {
      setLoadingList(false);
    }
  };

  const loadProjects = async () => {
    setLoadingProjects(true);
    setError("");
    try {
      const data = await fetchJSON<ControlProjectListItem[]>("/api/control/projects", {
        timeoutMs: CONTROL_READ_TIMEOUT_MS,
        retries: CONTROL_READ_RETRIES,
        skipCache: true,
      });
      const nextProjects = Array.isArray(data) ? data : [];
      setProjects(nextProjects);
      setSelectedProjectId((current) => {
        if (current && nextProjects.some((project) => project.id === current)) {
          return current;
        }
        return nextProjects[0]?.id || "";
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.failedLoadProjects;
      setError(msg);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadProjectDetail = async (projectId: string) => {
    setLoadingProjectDetail(true);
    setError("");
    try {
      const data = await fetchJSON<ControlProjectDetail>(
        `/api/control/projects/${encodeURIComponent(projectId)}`,
        {
          timeoutMs: CONTROL_READ_TIMEOUT_MS,
          retries: CONTROL_READ_RETRIES,
          skipCache: true,
        }
      );
      setProjectDetail(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.failedLoadProjectDetail;
      setError(msg);
      setProjectDetail(null);
    } finally {
      setLoadingProjectDetail(false);
    }
  };

  const loadDetail = async (id: string) => {
    setLoadingDetail(true);
    setError("");
    try {
      const [job, run, history] = await Promise.all([
        fetchJSON<ControlJobDetail>(`/api/control/jobs/${encodeURIComponent(id)}`, {
          timeoutMs: CONTROL_READ_TIMEOUT_MS,
          retries: CONTROL_READ_RETRIES,
          skipCache: true,
        }),
        fetchJSON<LastRunResponse>(`/api/control/jobs/${encodeURIComponent(id)}/last`, {
          timeoutMs: CONTROL_READ_TIMEOUT_MS,
          retries: CONTROL_READ_RETRIES,
          skipCache: true,
        }),
        fetchJSON<RunHistoryResponse>(
          `/api/control/jobs/${encodeURIComponent(id)}/history?limit=24`,
          {
            timeoutMs: CONTROL_READ_TIMEOUT_MS,
            retries: CONTROL_READ_RETRIES,
            skipCache: true,
          }
        ),
      ]);

      setDetail(job);
      setPromptDraft(job.prompt || "");
      setLastRun(run.lastRun || null);
      setRunHistory(Array.isArray(history.entries) ? history.entries : []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.failedLoadJobDetail;
      setError(msg);
      setRunHistory([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadRunHistory = async (
    id: string,
    options?: {
      silent?: boolean;
    }
  ) => {
    const silent = Boolean(options?.silent);
    if (!silent) {
      setLoadingRunHistory(true);
      setError("");
    }

    try {
      const history = await fetchJSON<RunHistoryResponse>(
        `/api/control/jobs/${encodeURIComponent(id)}/history?limit=24`,
        {
          timeoutMs: CONTROL_READ_TIMEOUT_MS,
          retries: CONTROL_READ_RETRIES,
          skipCache: true,
        }
      );
      setRunHistory(Array.isArray(history.entries) ? history.entries : []);
    } catch (err) {
      if (!silent) {
        const msg = err instanceof Error ? err.message : t.failedLoadDetail;
        setError(msg);
      }
    } finally {
      if (!silent) {
        setLoadingRunHistory(false);
      }
    }
  };

  const handleRefreshAll = async () => {
    setMessage("");
    setError("");
    await Promise.all([loadJobs(), loadProjects()]);
    if (selectedProjectId) {
      await loadProjectDetail(selectedProjectId);
    }
    if (selectedId) {
      await loadDetail(selectedId);
    }
  };

  const handleCreateProject = async () => {
    const name = projectNameDraft.trim();
    if (!name) {
      setError(t.projectNameRequired);
      return;
    }

    setCreatingProject(true);
    setError("");
    setMessage("");
    try {
      const created = await postJSON<ControlProjectListItem>(
        "/api/control/projects",
        {
          name,
          id: projectIdDraft.trim() || undefined,
          description: projectDescriptionDraft.trim() || undefined,
        },
        {
          timeoutMs: 30000,
          retries: 0,
        }
      );

      setProjectNameDraft("");
      setProjectIdDraft("");
      setProjectDescriptionDraft("");
      setShowCreateProject(false);
      setSelectedProjectId(created.id);
      await Promise.all([loadProjects(), loadJobs(), loadProjectDetail(created.id)]);
      setMessage(t.projectCreatedWithId(created.id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.failedCreateProject;
      setError(msg);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleCreateAgent = async () => {
    if (!selectedProjectId) {
      setError(t.selectProjectFirstError);
      return;
    }

    const name = agentNameDraft.trim();
    if (!name) {
      setError(t.agentNameRequired);
      return;
    }

    setCreatingAgent(true);
    setError("");
    setMessage("");
    try {
      await postJSON<CreateProjectAgentResponse>(
        `/api/control/projects/${encodeURIComponent(selectedProjectId)}/agents`,
        {
          name,
          id: agentIdDraft.trim() || undefined,
          model: agentModelDraft.trim() || undefined,
          emoji: agentEmojiDraft.trim() || undefined,
          theme: agentThemeDraft.trim() || undefined,
        },
        {
          timeoutMs: 120000,
          retries: 0,
        }
      );

      setAgentNameDraft("");
      setAgentIdDraft("");
      setAgentEmojiDraft("");
      setAgentThemeDraft("");
      setShowCreateAgent(false);
      await Promise.all([loadProjects(), loadJobs(), loadProjectDetail(selectedProjectId)]);
      setMessage(t.agentCreatedLinked);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.failedCreateAgent;
      setError(msg);
    } finally {
      setCreatingAgent(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!detail) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await postJSON(
        `/api/control/jobs/${encodeURIComponent(detail.id)}/prompt`,
        {
          prompt: promptDraft,
        },
        {
          timeoutMs: 30000,
          retries: 0,
        }
      );
      setMessage(t.promptUpdated);
      await Promise.all([loadJobs(), loadDetail(detail.id)]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.failedSavePrompt;
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    if (!detail) return;
    setRunning(true);
    setError("");
    setMessage("");
    try {
      const result = await postJSON<RunJobResponse>(
        `/api/control/jobs/${encodeURIComponent(detail.id)}/run`,
        {},
        {
          timeoutMs: 180000,
          retries: 0,
        }
      );
      setLastRun(result.lastRun || null);
      setMessage(t.runSnapshotUpdated);
      await Promise.all([loadJobs(), loadRunHistory(detail.id, { silent: true })]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.failedRunJob;
      setError(msg);
    } finally {
      setRunning(false);
    }
  };

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
    const preferred = visibleJobs
      .filter((job) => job.agentId === agentId)
      .sort((a, b) => (b.lastRunAtMs || 0) - (a.lastRunAtMs || 0))[0];
    if (preferred) {
      setSelectedId(preferred.id);
    } else {
      setSelectedId("");
    }
  };

  const handleChatDraftChange = (value: string) => {
    if (!selectedAgentId) return;
    setChatDraftByAgent((previous) => ({
      ...previous,
      [selectedAgentId]: value,
    }));
  };

  const handleSendAgentMessage = async () => {
    if (!selectedAgentId) {
      setError(t.selectAgentForChat);
      return;
    }

    const text = activeChatDraft.trim();
    if (!text) return;

    const agentId = selectedAgentId;
    const userMessage: AgentChatMessage = {
      id: `user:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      role: "user",
      text,
      atMs: Date.now(),
    };

    setChatDraftByAgent((previous) => ({
      ...previous,
      [agentId]: "",
    }));
    setChatByAgent((previous) => {
      const current = previous[agentId] || { messages: [] };
      return {
        ...previous,
        [agentId]: {
          ...current,
          messages: [...current.messages, userMessage].slice(-80),
        },
      };
    });

    setSendingChat(true);
    setError("");
    setMessage("");

    const sessionId = chatByAgent[agentId]?.sessionId;

    try {
      const response = await postJSON<AgentChatResponse>(
        `/api/control/agents/${encodeURIComponent(agentId)}/chat`,
        {
          message: text,
          sessionId,
        },
        {
          timeoutMs: 240000,
          retries: 0,
        }
      );

      const meta: string[] = [];
      if (response.model) meta.push(response.model);
      if (response.durationMs) meta.push(formatDuration(response.durationMs));
      if (typeof response.usage?.total === "number") {
        meta.push(`${response.usage.total} tok`);
      }
      const assistantText = response.reply?.trim() || response.summary || t.noSummary;
      const finalText = meta.length > 0 ? `${assistantText}\n\n[${meta.join(" | ")}]` : assistantText;
      const assistantMessage: AgentChatMessage = {
        id: `assistant:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
        role: "assistant",
        text: finalText,
        atMs: Date.now(),
      };

      setChatByAgent((previous) => {
        const current = previous[agentId] || { messages: [] };
        return {
          ...previous,
          [agentId]: {
            sessionId: response.sessionId || current.sessionId,
            messages: [...current.messages, assistantMessage].slice(-80),
          },
        };
      });

      await Promise.all([
        loadJobs(),
        selectedId ? loadRunHistory(selectedId, { silent: true }) : Promise.resolve(),
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.failedRunJob;
      setError(msg);

      const systemMessage: AgentChatMessage = {
        id: `system:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
        role: "system",
        text: msg,
        atMs: Date.now(),
      };
      setChatByAgent((previous) => {
        const current = previous[agentId] || { messages: [] };
        return {
          ...previous,
          [agentId]: {
            ...current,
            messages: [...current.messages, systemMessage].slice(-80),
          },
        };
      });
    } finally {
      setSendingChat(false);
    }
  };

  const handleResetAgentChat = () => {
    if (!selectedAgentId) return;
    setChatByAgent((previous) => {
      const next = { ...previous };
      delete next[selectedAgentId];
      return next;
    });
    setChatDraftByAgent((previous) => {
      const next = { ...previous };
      delete next[selectedAgentId];
      return next;
    });
    setMessage(t.chatReset);
  };

  const handleMainResizeStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isNarrow) return;
    mainResizeStateRef.current = {
      x: event.clientX,
      width: jobsPaneWidth,
    };
    setIsResizingMain(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const mainLayoutStyle: React.CSSProperties = isNarrow
    ? { ...styles.main, ...styles.mainNarrow }
    : {
        ...styles.main,
        gridTemplateColumns: `${Math.round(jobsPaneWidth)}px ${CONTROL_MAIN_RESIZER_WIDTH}px minmax(0, 1fr)`,
      };
  const lastRunSummaryText = lastRun
    ? (lastRun.summary || (lastRun.error ? `${t.labelError}: ${lastRun.error}` : t.noSummary))
    : "";

  return (
    <div style={styles.page}>
      <style jsx global>{`
        body.control-cursor-theme {
          background-color: #0b0f17 !important;
          background-image: radial-gradient(circle at 18% 12%, #1b2438 0%, #0b0f17 55%, #090d14 100%) !important;
          color: #e5ecf5 !important;
          font-family: ${TYPOGRAPHY.fontFamily} !important;
          image-rendering: auto !important;
          letter-spacing: 0 !important;
        }

        body.control-cursor-theme::before {
          display: none !important;
        }

        body.control-cursor-theme ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        body.control-cursor-theme ::-webkit-scrollbar-track {
          background: #0f1624;
          border: 1px solid #283243;
        }

        body.control-cursor-theme ::-webkit-scrollbar-thumb {
          background: #3d7bfa;
          border: 1px solid #283243;
          border-radius: 10px;
        }

        body.control-cursor-theme ::-webkit-scrollbar-thumb:hover {
          background: #5a92ff;
        }
      `}</style>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>{t.title}</h1>
          <p style={styles.subtitle}>{t.subtitle}</p>
        </div>
        <div style={{ ...styles.headerButtons, ...(isNarrow ? styles.headerButtonsNarrow : null) }}>
          <div style={styles.projectPicker}>
            <span style={styles.projectPickerLabel}>{t.project}</span>
            <select
              style={styles.selectInput}
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
            >
              {projects.length === 0 ? (
                <option value="">{t.autoDetectedProject}</option>
              ) : (
                projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({project.agentCount})
                  </option>
                ))
              )}
            </select>
          </div>
          <div style={styles.projectMetaBlock}>
            <p style={styles.projectMetaInline}>
              {loadingProjects
                ? t.loadingProjects
                : selectedProject
                  ? t.selectedProjectSummary(selectedProject.name, selectedProject.agentCount)
                  : t.noProjectSelected}
            </p>
            <label style={styles.toggleWrap}>
              <input
                type="checkbox"
                checked={scopeToProject}
                onChange={(event) => setScopeToProject(event.target.checked)}
              />
              <span style={styles.toggleLabel}>{t.selectedProjectJobsOnly}</span>
            </label>
          </div>
          <div style={styles.langWrap}>
            <span style={styles.projectPickerLabel}>{t.language}</span>
            <div style={styles.langButtons}>
              <button
                style={{
                  ...styles.langButton,
                  ...(locale === "en" ? styles.langButtonActive : null),
                }}
                onClick={() => setLocale("en")}
              >
                {getLocaleButtonLabel("en")}
              </button>
              <button
                style={{
                  ...styles.langButton,
                  ...(locale === "ru" ? styles.langButtonActive : null),
                }}
                onClick={() => setLocale("ru")}
              >
                {getLocaleButtonLabel("ru")}
              </button>
            </div>
          </div>
          <button
            style={styles.secondaryButton}
            onClick={() => setShowCreateProject(true)}
          >
            {t.createNewProject}
          </button>
          <button
            style={{
              ...styles.secondaryButton,
              ...(!selectedProjectId ? styles.secondaryButtonDisabled : null),
            }}
            onClick={() => setShowCreateAgent(true)}
            disabled={!selectedProjectId}
          >
            {t.createAgent}
          </button>
          <button style={styles.actionButton} onClick={() => void handleRefreshAll()}>
            {t.refreshAll}
          </button>
          <a href="/" style={styles.linkButton}>
            {t.backToOffice}
          </a>
        </div>
      </header>

      <main style={mainLayoutStyle}>
        <section style={styles.sidebar}>
          <div style={styles.sectionHeaderRow}>
            <h2 style={styles.sectionTitle}>{CHAT_ONLY_MODE ? t.agents : t.jobs}</h2>
            <span style={styles.pillCount}>{CHAT_ONLY_MODE ? filteredAgents.length : visibleJobs.length}</span>
          </div>

          {!CHAT_ONLY_MODE && (
            <p style={styles.dimText}>
              {scopeToProject && selectedProject
                ? t.showingJobsForProject(selectedProject.id)
                : t.showingAllJobs}
            </p>
          )}

          <div style={styles.agentScopePanel}>
            {CHAT_ONLY_MODE ? (
              <input
                style={styles.agentSearchInput}
                value={agentSearch}
                onChange={(event) => setAgentSearch(event.target.value)}
                placeholder={t.searchAgents}
              />
            ) : null}
            {!CHAT_ONLY_MODE && (
              <div style={styles.sectionHeaderRow}>
                <h3 style={styles.sectionTitle}>{t.agents}</h3>
                <span style={styles.pillCount}>{visibleAgents.length}</span>
              </div>
            )}
            {visibleAgents.length === 0 ? (
              <p style={styles.dimText}>{t.noAgentsInScope}</p>
            ) : filteredAgents.length === 0 ? (
              <p style={styles.dimText}>{t.noAgentsMatchSearch}</p>
            ) : (
              <div style={styles.agentButtonList}>
                {filteredAgents.map((agent) => {
                  const isSelectedAgent = selectedAgentId === agent.id;
                  const firstJob = agent.jobs[0];
                  const liveItem = agent.jobs
                    .map((job) => latestActivityByJobId.get(job.id))
                    .find((entry): entry is LiveActivityEntry => Boolean(entry));
                  const statusKey = (
                    liveItem?.status ||
                    firstJob?.lastStatus ||
                    "idle"
                  ).toLowerCase();
                  const statusColor = statusColors[statusKey] || COLORS.textTertiary;

                  return (
                    <button
                      key={agent.id}
                      style={{
                        ...styles.agentButton,
                        ...(isSelectedAgent ? styles.agentButtonSelected : null),
                      }}
                      onClick={() => handleAgentSelect(agent.id)}
                    >
                      <div style={styles.jobRowTop}>
                        <span style={styles.jobName}>
                          {agent.emoji ? `${agent.emoji} ` : ""}
                          {agent.label}
                        </span>
                        <span style={{ ...styles.statusDot, backgroundColor: statusColor }} />
                      </div>
                      <p style={styles.jobMeta}>
                        {t.labelAgent}: {agent.id}
                      </p>
                      <p style={styles.jobMeta}>
                        {t.jobs}: {agent.jobs.length} | {t.labelModel}: {agent.model || t.noDataMarker}
                      </p>
                      <p style={styles.liveExcerpt}>{liveItem?.excerpt || t.noActivityText}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {!CHAT_ONLY_MODE &&
            (loadingList ? (
              <p style={styles.dimText}>{t.loadingJobs}</p>
            ) : visibleJobs.length === 0 ? (
              <p style={styles.dimText}>
                {scopeToProject ? t.noJobsForSelectedAgents : t.noJobs}
              </p>
            ) : (
              <div style={styles.jobList}>
                {visibleJobs.map((job) => {
                  const isSelected = job.id === selectedId;
                  const statusKey = (job.lastStatus || "").toLowerCase();
                  const statusColor = statusColors[statusKey] || COLORS.textTertiary;
                  const projectId = projectByAgentId.get(job.agentId);
                  return (
                    <button
                      key={job.id}
                      onClick={() => {
                        setSelectedId(job.id);
                        setSelectedAgentId(job.agentId);
                      }}
                      style={{
                        ...styles.jobRow,
                        ...(isSelected ? styles.jobRowSelected : null),
                      }}
                    >
                      <div style={styles.jobRowTop}>
                        <span style={styles.jobName}>{job.roleAlias || job.name}</span>
                        <span style={{ ...styles.statusDot, backgroundColor: statusColor }} />
                      </div>
                      <p style={styles.jobMeta}>
                        {t.labelJob}: {job.name}
                      </p>
                      <p style={styles.jobMeta}>
                        {t.labelAgent}: {job.agentId}
                      </p>
                      <p style={styles.jobMeta}>
                        {t.labelProject}: {projectId || t.noDataMarker}
                      </p>
                      <p style={styles.jobMeta}>
                        {t.labelSchedule}: {job.schedule}
                      </p>
                    </button>
                  );
                })}
              </div>
            ))}
        </section>

        {!isNarrow && (
          <div
            style={{
              ...styles.mainResizer,
              ...(isResizingMain ? styles.mainResizerActive : null),
            }}
            role="separator"
            aria-orientation="vertical"
            aria-label={t.resizePanels}
            onPointerDown={handleMainResizeStart}
          >
            <div style={styles.mainResizerGrip} />
          </div>
        )}

        <section style={styles.content}>
          {!CHAT_ONLY_MODE && (
            <div style={styles.livePanel}>
            <div style={styles.sectionHeaderRow}>
              <h3 style={styles.sectionTitle}>{t.liveFeed}</h3>
              <span
                style={{
                  ...styles.liveStateBadge,
                  ...(activityConnected ? styles.liveStateOn : styles.liveStateOff),
                }}
              >
                {activityConnected ? t.liveConnected : t.liveReconnecting}
              </span>
            </div>
            {activityUpdatedAtMs ? (
              <p style={styles.dimText}>
                {t.liveUpdatedAt}: {formatTimestamp(activityUpdatedAtMs, locale)}
              </p>
            ) : null}
            {activityError ? (
              <p style={styles.dimText}>
                {t.liveStreamError}: {activityError}
              </p>
            ) : null}

            {activityEntries.length === 0 ? (
              <p style={styles.dimText}>{t.liveNoItems}</p>
            ) : (
              <div style={styles.liveList}>
                {activityEntries.map((entry) => {
                  const ts = entry.runAtMs ?? entry.lastRunAtMs;
                  const selectedFromFeed = selectedId === entry.jobId;
                  return (
                    <button
                      key={`${entry.jobId}:${ts || 0}:${entry.status}`}
                      style={{
                        ...styles.liveRow,
                        ...(selectedFromFeed ? styles.liveRowSelected : null),
                      }}
                      onClick={() => {
                        setSelectedId(entry.jobId);
                        setSelectedAgentId(entry.agentId);
                      }}
                    >
                      <div style={styles.liveRowTop}>
                        <span style={styles.liveTitle}>
                          {entry.roleAlias || entry.jobName}
                        </span>
                        <span style={styles.liveStatus}>
                          <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: entry.status === "FAIL" ? COLORS.statusError : entry.status === "PASS" ? COLORS.statusOnline : COLORS.textTertiary, marginRight: SPACING.xs }} />
                          {entry.status || t.noDataMarker}
                        </span>
                      </div>
                      <p style={styles.jobMeta}>
                        {t.labelAgent}: {entry.agentId} | {t.labelAt}: {formatTimestamp(ts, locale)} |{" "}
                        {t.labelDuration}: {formatDuration(entry.durationMs)}
                      </p>
                      <p style={styles.liveExcerpt}>{entry.excerpt || t.noActivityText}</p>
                    </button>
                  );
                })}
              </div>
            )}
            </div>
          )}

          {!CHAT_ONLY_MODE && selectedJob ? (
            <div style={styles.livePanel}>
              <div style={styles.sectionHeaderRow}>
                <h3 style={styles.sectionTitle}>{t.liveProcessForJob}</h3>
                <span style={styles.pillCount}>{selectedJobActivity.length}</span>
              </div>
              <p style={styles.dimText}>
                {t.labelJob}: {selectedJob.name} | {t.labelAgent}: {selectedJob.agentId}
              </p>
              {selectedJobActivity.length === 0 ? (
                <p style={styles.dimText}>{t.liveNoEventsForJob}</p>
              ) : (
                <div style={styles.processLogList}>
                  {selectedJobActivity.map((entry) => (
                    <div key={entry.eventKey} style={styles.processLogRow}>
                      <div style={styles.liveRowTop}>
                        <span style={styles.liveStatus}>{entry.status || t.noDataMarker}</span>
                        <span style={styles.jobMeta}>
                          {formatTimestamp(entry.eventAtMs, locale)}
                        </span>
                      </div>
                      <p style={styles.liveExcerpt}>{entry.excerpt || t.noActivityText}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {CHAT_ONLY_MODE ? (
            <div style={styles.chatOnlyShell}>
              <div style={styles.sectionHeaderRow}>
                <h3 style={styles.sectionTitle}>{t.agentChatPanel}</h3>
                <div style={styles.inlineActions}>
                  <span style={styles.pillCount}>{activeChatMessages.length}</span>
                  <button
                    style={styles.secondaryButton}
                    onClick={handleResetAgentChat}
                    disabled={!selectedAgentId}
                  >
                    {t.newChat}
                  </button>
                </div>
              </div>
              <p style={styles.dimText}>{t.agentChatHint}</p>
              {selectedAgent ? (
                <p style={styles.jobMeta}>
                  {t.labelAgent}: {selectedAgent.id}
                  {activeChatSession?.sessionId
                    ? ` | ${t.chatSession}: ${activeChatSession.sessionId}`
                    : ""}
                </p>
              ) : (
                <p style={styles.dimText}>{t.selectAgentForChat}</p>
              )}

              {activeChatMessages.length === 0 ? (
                <p style={styles.dimText}>{t.agentChatEmpty}</p>
              ) : (
                <div ref={chatListRef} style={styles.chatMessageList}>
                  {activeChatMessages.map((messageEntry) => (
                    <div
                      key={messageEntry.id}
                      style={{
                        ...styles.chatMessage,
                        ...(messageEntry.role === "user"
                          ? styles.chatMessageUser
                          : messageEntry.role === "assistant"
                            ? styles.chatMessageAssistant
                            : styles.chatMessageSystem),
                      }}
                    >
                      <p style={styles.chatMessageRole}>{messageEntry.role.toUpperCase()}</p>
                      <pre style={styles.chatMessageText}>{messageEntry.text}</pre>
                      <p style={styles.chatMessageTime}>
                        {formatTimestamp(messageEntry.atMs, locale)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                style={styles.chatInput}
                value={activeChatDraft}
                onChange={(event) => handleChatDraftChange(event.target.value)}
                placeholder={t.agentChatInputPlaceholder}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSendAgentMessage();
                  }
                }}
              />
              <button
                style={styles.actionButton}
                onClick={() => void handleSendAgentMessage()}
                disabled={!selectedAgentId || sendingChat || !activeChatDraft.trim()}
              >
                {sendingChat ? t.sendingMessage : t.sendMessage}
              </button>
            </div>
          ) : !selectedJob ? (
            <p style={styles.dimText}>{t.selectJob}</p>
          ) : loadingDetail && !detail ? (
            <p style={styles.dimText}>{t.loadingJobDetail}</p>
          ) : detail ? (
            <>
              <div style={styles.contentHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>{detail.roleAlias || detail.name}</h2>
                  <p style={styles.dimText}>
                    {t.labelAgent}: {detail.agentId} | {t.labelModel}: {detail.model || t.noDataMarker} |{" "}
                    {t.labelThinking}: {detail.thinking || t.noDataMarker}
                  </p>
                </div>
                <div style={styles.inlineActions}>
                  <button
                    style={styles.actionButton}
                    onClick={handleRunNow}
                    disabled={running}
                  >
                    {running ? t.running : t.runNow}
                  </button>
                  <button
                    style={styles.actionButton}
                    onClick={handleSavePrompt}
                    disabled={saving || !isPromptDirty}
                  >
                    {saving ? t.saving : t.savePrompt}
                  </button>
                </div>
              </div>

              <div style={styles.agentScopePanel}>
                <div style={styles.sectionHeaderRow}>
                  <h3 style={styles.sectionTitle}>{t.jobsForAgent}</h3>
                  <span style={styles.pillCount}>{selectedAgentJobs.length}</span>
                </div>
                {selectedAgentJobs.length === 0 ? (
                  <p style={styles.dimText}>{t.noJobsForSelectedAgents}</p>
                ) : (
                  <div style={styles.agentJobStrip}>
                    {selectedAgentJobs.map((job) => {
                      const isCurrent = job.id === selectedId;
                      const jobStatus = (job.lastStatus || "idle").toLowerCase();
                      const jobStatusColor = statusColors[jobStatus] || COLORS.textTertiary;
                      return (
                        <button
                          key={job.id}
                          style={{
                            ...styles.agentJobButton,
                            ...(isCurrent ? styles.agentJobButtonSelected : null),
                          }}
                          onClick={() => {
                            setSelectedId(job.id);
                            setSelectedAgentId(job.agentId);
                          }}
                        >
                          <div style={styles.jobRowTop}>
                            <span style={styles.jobName}>{job.roleAlias || job.name}</span>
                            <span style={{ ...styles.statusDot, backgroundColor: jobStatusColor }} />
                          </div>
                          <p style={styles.jobMeta}>{job.name}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div
                style={{
                  ...styles.editorWorkspace,
                  ...(isNarrow ? styles.editorWorkspaceNarrow : null),
                }}
              >
                <div style={styles.promptPane}>
                  <label style={styles.label} htmlFor="prompt-editor">
                    {t.agentChatPrompt}
                  </label>
                  {isPromptDirty ? <p style={styles.dimText}>{t.unsavedPrompt}</p> : null}
                  <textarea
                    id="prompt-editor"
                    style={styles.promptEditor}
                    value={promptDraft}
                    onChange={(event) => setPromptDraft(event.target.value)}
                  />
                </div>

                <aside style={styles.chatPane}>
                  <div style={styles.sectionHeaderRow}>
                    <h3 style={styles.sectionTitle}>{t.agentChatPanel}</h3>
                    <span style={styles.pillCount}>{activeChatMessages.length}</span>
                  </div>
                  <p style={styles.dimText}>{t.agentChatHint}</p>
                  {selectedAgent ? (
                    <p style={styles.jobMeta}>
                      {t.labelAgent}: {selectedAgent.id}
                      {activeChatSession?.sessionId
                        ? ` | ${t.chatSession}: ${activeChatSession.sessionId}`
                        : ""}
                    </p>
                  ) : (
                    <p style={styles.dimText}>{t.selectAgentForChat}</p>
                  )}

                  {activeChatMessages.length === 0 ? (
                    <p style={styles.dimText}>{t.agentChatEmpty}</p>
                  ) : (
                    <div ref={chatListRef} style={styles.chatMessageList}>
                      {activeChatMessages.map((messageEntry) => (
                        <div
                          key={messageEntry.id}
                          style={{
                            ...styles.chatMessage,
                            ...(messageEntry.role === "user"
                              ? styles.chatMessageUser
                              : messageEntry.role === "assistant"
                                ? styles.chatMessageAssistant
                                : styles.chatMessageSystem),
                          }}
                        >
                          <p style={styles.chatMessageRole}>{messageEntry.role.toUpperCase()}</p>
                          <pre style={styles.chatMessageText}>{messageEntry.text}</pre>
                          <p style={styles.chatMessageTime}>
                            {formatTimestamp(messageEntry.atMs, locale)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <textarea
                    style={styles.chatInput}
                    value={activeChatDraft}
                    onChange={(event) => handleChatDraftChange(event.target.value)}
                    placeholder={t.agentChatInputPlaceholder}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleSendAgentMessage();
                      }
                    }}
                  />
                  <button
                    style={styles.actionButton}
                    onClick={() => void handleSendAgentMessage()}
                    disabled={!selectedAgentId || sendingChat || !activeChatDraft.trim()}
                  >
                    {sendingChat ? t.sendingMessage : t.sendMessage}
                  </button>
                </aside>
              </div>

              <div style={styles.runActionsRow}>
                <button
                  style={styles.secondaryButton}
                  onClick={() => setShowRunDetails((prev) => !prev)}
                >
                  {showRunDetails ? t.hideRunDetails : t.showRunDetails}
                </button>
                {showRunDetails && (
                  <button
                    style={styles.secondaryButton}
                    onClick={() => setShowRunExpanded(true)}
                  >
                    {t.expandLastRun}
                  </button>
                )}
              </div>

              {showRunDetails && (
                <div style={styles.runCard}>
                  <h3 style={styles.sectionTitle}>{t.lastRun}</h3>
                  {lastRun ? (
                    <>
                      <p style={{ ...styles.dimText, fontWeight: 500, color: COLORS.textPrimary }}>
                        {t.labelStatus}: {lastRun.status || t.noDataMarker} | {t.labelDuration}:{" "}
                        {formatDuration(lastRun.durationMs)} | {t.labelAt}: {formatTimestamp(lastRun.runAtMs, locale)}
                      </p>
                      <p style={styles.dimText}>
                        {t.labelTokens}: {lastRun.usage?.total_tokens ?? 0} ({t.labelIn}:{" "}
                        {lastRun.usage?.input_tokens ?? 0}, {t.labelOut}: {lastRun.usage?.output_tokens ?? 0})
                      </p>
                      <pre style={styles.summary}>{lastRunSummaryText}</pre>
                    </>
                  ) : (
                    <>
                      <p style={styles.dimText}>{t.noRunData}</p>
                      <p style={styles.dimText}>{t.noRunHint}</p>
                    </>
                  )}
                </div>
              )}

              <div style={styles.runCard}>
                <div style={styles.sectionHeaderRow}>
                  <h3 style={styles.sectionTitle}>{t.runHistory}</h3>
                  <span style={styles.pillCount}>{runHistory.length}</span>
                </div>
                {loadingRunHistory && runHistory.length === 0 ? (
                  <p style={styles.dimText}>{t.loadingRunHistory}</p>
                ) : runHistory.length === 0 ? (
                  <p style={styles.dimText}>{t.noRunHistory}</p>
                ) : (
                  <div style={styles.historyList}>
                    {runHistory.map((entry, index) => (
                      <div
                        key={`${entry.runAtMs || entry.ts || 0}:${entry.action || "run"}:${index}`}
                        style={styles.historyRow}
                      >
                        <p style={styles.jobMeta}>
                          {t.labelStatus}: {entry.status || t.noDataMarker} | {t.labelDuration}:{" "}
                          {formatDuration(entry.durationMs)} | {t.labelAt}:{" "}
                          {formatTimestamp(entry.runAtMs || entry.ts, locale)}
                        </p>
                        <p style={styles.jobMeta}>
                          {t.labelTokens}: {entry.usage?.total_tokens ?? 0} ({t.labelIn}:{" "}
                          {entry.usage?.input_tokens ?? 0}, {t.labelOut}:{" "}
                          {entry.usage?.output_tokens ?? 0})
                        </p>
                        <p style={styles.liveExcerpt}>
                          {buildRunExcerpt(entry.summary || entry.error) || t.noActivityText}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p style={styles.dimText}>{t.failedLoadDetail}</p>
          )}
        </section>
      </main>

      {showCreateProject && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateProject(false)}>
          <div style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.sectionTitle}>{t.createProject}</h3>
              <button style={styles.modalClose} onClick={() => setShowCreateProject(false)}>
                {t.close}
              </button>
            </div>

            <label style={styles.label}>{t.name}</label>
            <input
              style={styles.textInput}
              value={projectNameDraft}
              onChange={(event) => setProjectNameDraft(event.target.value)}
              placeholder={t.projectNamePlaceholder}
            />

            <label style={styles.label}>{t.projectIdOptional}</label>
            <input
              style={styles.textInput}
              value={projectIdDraft}
              onChange={(event) => setProjectIdDraft(event.target.value)}
              placeholder={t.projectIdPlaceholder}
            />

            <label style={styles.label}>{t.descriptionOptional}</label>
            <input
              style={styles.textInput}
              value={projectDescriptionDraft}
              onChange={(event) => setProjectDescriptionDraft(event.target.value)}
              placeholder={t.projectDescriptionPlaceholder}
            />

            <div style={styles.modalActions}>
              <button style={styles.linkButton} onClick={() => setShowCreateProject(false)}>
                {t.cancel}
              </button>
              <button
                style={styles.actionButton}
                onClick={handleCreateProject}
                disabled={creatingProject}
              >
                {creatingProject ? t.creating : t.createProject}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateAgent && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateAgent(false)}>
          <div style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.sectionTitle}>{t.createAgentModal}</h3>
              <button style={styles.modalClose} onClick={() => setShowCreateAgent(false)}>
                {t.close}
              </button>
            </div>

            {!selectedProject ? (
              <p style={styles.dimText}>{t.selectProjectFirst}</p>
            ) : (
              <>
                <p style={styles.dimText}>
                  {t.labelProject}: {selectedProject.name} ({selectedProject.id})
                </p>
                <label style={styles.label}>{t.agentName}</label>
                <input
                  style={styles.textInput}
                  value={agentNameDraft}
                  onChange={(event) => setAgentNameDraft(event.target.value)}
                  placeholder={t.agentNamePlaceholder}
                />

                <label style={styles.label}>{t.agentIdSuffixOptional}</label>
                <input
                  style={styles.textInput}
                  value={agentIdDraft}
                  onChange={(event) => setAgentIdDraft(event.target.value)}
                  placeholder={t.agentIdPlaceholder}
                />

                <label style={styles.label}>{t.modelOptional}</label>
                <input
                  style={styles.textInput}
                  value={agentModelDraft}
                  onChange={(event) => setAgentModelDraft(event.target.value)}
                  placeholder={t.modelPlaceholder}
                />

                <div style={styles.inlineFields}>
                  <div style={styles.inlineField}>
                    <label style={styles.label}>{t.emoji}</label>
                    <input
                      style={styles.textInput}
                      value={agentEmojiDraft}
                      onChange={(event) => setAgentEmojiDraft(event.target.value)}
                      placeholder={t.emojiPlaceholder}
                    />
                  </div>
                  <div style={styles.inlineField}>
                    <label style={styles.label}>{t.theme}</label>
                    <input
                      style={styles.textInput}
                      value={agentThemeDraft}
                      onChange={(event) => setAgentThemeDraft(event.target.value)}
                      placeholder={t.themePlaceholder}
                    />
                  </div>
                </div>

                <div style={styles.modalActions}>
                  <button style={styles.linkButton} onClick={() => setShowCreateAgent(false)}>
                    {t.cancel}
                  </button>
                  <button
                    style={styles.actionButton}
                    onClick={handleCreateAgent}
                    disabled={creatingAgent || loadingProjectDetail}
                  >
                    {creatingAgent ? t.creating : t.createAgent}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showRunExpanded && showRunDetails && (
        <div style={styles.modalOverlay} onClick={() => setShowRunExpanded(false)}>
          <div style={styles.runExpandedCard} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.sectionTitle}>{t.lastRun}</h3>
              <button style={styles.modalClose} onClick={() => setShowRunExpanded(false)}>
                {t.collapseLastRun}
              </button>
            </div>
            {lastRun ? (
              <>
                <p style={styles.dimText}>
                  {t.labelStatus}: {lastRun.status || t.noDataMarker} | {t.labelDuration}:{" "}
                  {formatDuration(lastRun.durationMs)} | {t.labelAt}: {formatTimestamp(lastRun.runAtMs, locale)}
                </p>
                <p style={styles.dimText}>
                  {t.labelTokens}: {lastRun.usage?.total_tokens ?? 0} ({t.labelIn}:{" "}
                  {lastRun.usage?.input_tokens ?? 0}, {t.labelOut}: {lastRun.usage?.output_tokens ?? 0})
                </p>
                <pre style={styles.summaryExpanded}>{lastRunSummaryText}</pre>
              </>
            ) : (
              <>
                <p style={styles.dimText}>{t.noRunData}</p>
                <p style={styles.dimText}>{t.noRunHint}</p>
              </>
            )}
          </div>
        </div>
      )}

      {message && <div style={styles.toastOk}>{message}</div>}
      {error && <div style={styles.toastErr}>{error}</div>}
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getControlMainMaxWidth(viewportWidth: number): number {
  const ratio = viewportWidth >= 1440 ? 0.42 : 0.48;
  const adaptive = Math.floor(viewportWidth * ratio);
  return clamp(adaptive, CONTROL_MAIN_MIN_WIDTH, CONTROL_MAIN_MAX_WIDTH);
}

function formatTimestamp(ms: number | undefined, locale: Locale): string {
  if (!ms) return "-";
  return new Date(ms).toLocaleString(locale === "ru" ? "ru-RU" : "en-US");
}

function formatDuration(ms?: number): string {
  if (!ms || ms <= 0) return "-";
  if (ms < 1000) return `${ms}ms`;
  const sec = Math.round(ms / 1000);
  return `${sec}s`;
}

function buildRunExcerpt(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const line = value.trim().split(/\r?\n/, 1)[0];
  if (!line) return undefined;
  return line.length > 220 ? `${line.slice(0, 217)}...` : line;
}

function normalizeChatStore(raw: unknown): Record<string, AgentChatSessionState> {
  if (!raw || typeof raw !== "object") return {};

  const output: Record<string, AgentChatSessionState> = {};
  const entries = Object.entries(raw as Record<string, unknown>);

  for (const [agentId, value] of entries) {
    if (typeof agentId !== "string" || !agentId.trim()) continue;
    if (!value || typeof value !== "object") continue;

    const candidate = value as Partial<AgentChatSessionState> & { messages?: unknown };
    const sessionId =
      typeof candidate.sessionId === "string" && candidate.sessionId.trim()
        ? candidate.sessionId.trim()
        : undefined;
    const messagesSource = Array.isArray(candidate.messages) ? candidate.messages : [];
    const messages = messagesSource
      .map((entry): AgentChatMessage | null => {
        if (!entry || typeof entry !== "object") return null;
        const message = entry as Partial<AgentChatMessage>;
        if (message.role !== "user" && message.role !== "assistant" && message.role !== "system") {
          return null;
        }
        if (typeof message.text !== "string" || !message.text.trim()) return null;
        return {
          id:
            typeof message.id === "string" && message.id.trim()
              ? message.id
              : `${message.role}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
          role: message.role,
          text: message.text,
          atMs: typeof message.atMs === "number" ? message.atMs : Date.now(),
        };
      })
      .filter((entry): entry is AgentChatMessage => entry !== null)
      .slice(-100);

    if (!sessionId && messages.length === 0) continue;
    output[agentId] = { sessionId, messages };
  }

  return output;
}

const styles = {
  page: {
    minHeight: "100dvh",
    height: "100dvh",
    backgroundColor: COLORS.bgPrimary,
    color: COLORS.textPrimary,
    display: "flex",
    flexDirection: "column" as const,
    fontFamily: TYPOGRAPHY.fontFamily,
    padding: SPACING.sm,
    gap: SPACING.md,
    overflowY: "auto" as const,
    overflowX: "hidden" as const,
    WebkitOverflowScrolling: "touch",
  } as React.CSSProperties,

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.lg,
    flexWrap: "wrap" as const,
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: "12px",
    backgroundColor: COLORS.bgSurface,
    padding: `${SPACING.md} ${SPACING.lg}`,
    boxShadow: SHADOWS.panel,
    position: "sticky" as const,
    top: SPACING.sm,
    zIndex: 12,
  } as React.CSSProperties,

  title: {
    margin: 0,
    fontSize: "17px",
    fontWeight: 600,
    lineHeight: 1.35,
    letterSpacing: "0.01em",
  } as React.CSSProperties,

  subtitle: {
    margin: 0,
    marginTop: SPACING.xs,
    fontSize: "12px",
    color: COLORS.textSecondary,
    lineHeight: 1.45,
  } as React.CSSProperties,

  headerButtons: {
    display: "flex",
    gap: SPACING.md,
    alignItems: "center",
    flexWrap: "wrap" as const,
    justifyContent: "flex-end",
    flex: "1 1 760px",
    minWidth: 0,
  } as React.CSSProperties,

  headerButtonsNarrow: {
    justifyContent: "flex-start",
    flex: "1 1 100%",
  } as React.CSSProperties,

  projectPicker: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.xs,
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: "10px",
    backgroundColor: COLORS.bgPrimary,
    boxShadow: SHADOWS.card,
    padding: `${SPACING.xs} ${SPACING.sm}`,
  } as React.CSSProperties,

  projectPickerLabel: {
    fontSize: "11px",
    color: COLORS.textSecondary,
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  selectInput: {
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: "8px",
    backgroundColor: COLORS.bgSidebar,
    color: COLORS.textPrimary,
    boxShadow: "none",
    padding: "7px 10px",
    fontSize: "12px",
    minWidth: "160px",
    width: "min(240px, 42vw)",
    maxWidth: "100%",
  } as React.CSSProperties,

  projectMetaBlock: {
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: "10px",
    backgroundColor: COLORS.bgPrimary,
    boxShadow: SHADOWS.card,
    padding: `${SPACING.xs} ${SPACING.sm}`,
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
    minWidth: "180px",
    maxWidth: "100%",
  } as React.CSSProperties,

  projectMetaInline: {
    margin: 0,
    fontSize: "11px",
    color: COLORS.textSecondary,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  } as React.CSSProperties,

  langWrap: {
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: "10px",
    backgroundColor: COLORS.bgPrimary,
    boxShadow: SHADOWS.card,
    padding: `${SPACING.xs} ${SPACING.sm}`,
    display: "flex",
    alignItems: "center",
    gap: SPACING.xs,
    minWidth: 0,
  } as React.CSSProperties,

  langButtons: {
    display: "flex",
    gap: "6px",
  } as React.CSSProperties,

  langButton: {
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: "8px",
    backgroundColor: COLORS.bgPrimary,
    boxShadow: "none",
    padding: "6px 10px",
    minWidth: "40px",
    fontSize: "12px",
    color: COLORS.textPrimary,
    cursor: "pointer",
  } as React.CSSProperties,

  langButtonActive: {
    backgroundColor: COLORS.accentPrimary,
    borderColor: COLORS.accentHover,
    color: "#f5f9ff",
  } as React.CSSProperties,

  linkButton: {
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: "8px",
    backgroundColor: COLORS.bgPrimary,
    boxShadow: SHADOWS.card,
    padding: `8px ${SPACING.md}`,
    color: COLORS.textPrimary,
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: 500,
    lineHeight: 1.2,
    display: "inline-flex",
    alignItems: "center",
  } as React.CSSProperties,

  actionButton: {
    border: `1px solid ${COLORS.accentHover}`,
    borderRadius: "8px",
    backgroundColor: COLORS.accentPrimary,
    boxShadow: SHADOWS.card,
    padding: `8px ${SPACING.md}`,
    color: "#f5f9ff",
    fontSize: "12px",
    fontWeight: 600,
    lineHeight: 1.2,
    cursor: "pointer",
  } as React.CSSProperties,

  secondaryButton: {
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: "8px",
    backgroundColor: COLORS.bgPrimary,
    boxShadow: SHADOWS.card,
    padding: `8px ${SPACING.md}`,
    color: COLORS.textPrimary,
    fontSize: "12px",
    fontWeight: 500,
    lineHeight: 1.2,
    cursor: "pointer",
  } as React.CSSProperties,

  secondaryButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  } as React.CSSProperties,

  projectsSection: {
    border: `3px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSurface,
    boxShadow: SHADOWS.panel,
    padding: SPACING.lg,
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.md,
  } as React.CSSProperties,

  projectsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.3fr",
    gap: SPACING.md,
    minHeight: 0,
  } as React.CSSProperties,

  projectsGridNarrow: {
    gridTemplateColumns: "1fr",
  } as React.CSSProperties,

  projectPanel: {
    border: `2px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgPrimary,
    boxShadow: SHADOWS.card,
    padding: SPACING.md,
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.sm,
    minHeight: 0,
  } as React.CSSProperties,

  toggleActionButton: {
    border: `2px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSidebar,
    boxShadow: SHADOWS.card,
    padding: `${SPACING.sm} ${SPACING.md}`,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.textXs,
    textAlign: "left" as const,
    cursor: "pointer",
  } as React.CSSProperties,

  toggleActionButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  } as React.CSSProperties,

  drawerBody: {
    border: `2px dashed ${COLORS.borderSubtle}`,
    backgroundColor: COLORS.bgSurface,
    boxShadow: SHADOWS.card,
    padding: SPACING.md,
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.sm,
  } as React.CSSProperties,

  projectList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.sm,
    overflowY: "auto" as const,
    maxHeight: "360px",
  } as React.CSSProperties,

  projectRow: {
    border: `2px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSurface,
    boxShadow: SHADOWS.card,
    padding: SPACING.sm,
    textAlign: "left" as const,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  } as React.CSSProperties,

  projectRowSelected: {
    backgroundColor: COLORS.accentPrimary,
    boxShadow: SHADOWS.hover,
  } as React.CSSProperties,

  projectRowTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.sm,
  } as React.CSSProperties,

  projectName: {
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  projectBadge: {
    fontSize: "9px",
    border: `1px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSidebar,
    padding: "2px 6px",
  } as React.CSSProperties,

  projectMeta: {
    margin: 0,
    fontSize: "9px",
    color: COLORS.textSecondary,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  } as React.CSSProperties,

  inlineFields: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: SPACING.sm,
  } as React.CSSProperties,

  inlineField: {
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.xs,
  } as React.CSSProperties,

  textInput: {
    width: "100%",
    border: `2px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSurface,
    color: COLORS.textPrimary,
    boxShadow: SHADOWS.card,
    padding: `${SPACING.sm} ${SPACING.md}`,
    fontSize: TYPOGRAPHY.textXs,
  } as React.CSSProperties,

  divider: {
    borderTop: `2px dashed ${COLORS.borderSubtle}`,
    margin: `${SPACING.sm} 0`,
  } as React.CSSProperties,

  agentList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.sm,
    overflowY: "auto" as const,
    maxHeight: "220px",
  } as React.CSSProperties,

  agentRow: {
    border: `2px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSurface,
    boxShadow: SHADOWS.card,
    padding: SPACING.sm,
  } as React.CSSProperties,

  agentName: {
    margin: 0,
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  agentMeta: {
    margin: 0,
    fontSize: "9px",
    color: COLORS.textSecondary,
    lineHeight: 1.5,
  } as React.CSSProperties,

  main: {
    display: "grid",
    gridTemplateColumns: "minmax(560px, 56%) 16px minmax(0, 1fr)",
    gap: 0,
    minHeight: 0,
    flex: "1 1 auto",
    minWidth: 0,
  } as React.CSSProperties,

  mainNarrow: {
    gridTemplateColumns: "1fr",
    gridTemplateRows: "auto auto",
  } as React.CSSProperties,

  mainResizer: {
    borderTop: `1px solid ${COLORS.borderDefault}`,
    borderBottom: `1px solid ${COLORS.borderDefault}`,
    backgroundColor: "#0d1422",
    boxShadow: "none",
    cursor: "col-resize",
    userSelect: "none" as const,
    touchAction: "none" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 0,
  } as React.CSSProperties,

  mainResizerActive: {
    backgroundColor: "#14223a",
    boxShadow: "none",
  } as React.CSSProperties,

  mainResizerGrip: {
    width: "4px",
    height: "42%",
    borderRadius: "99px",
    backgroundColor: COLORS.borderSubtle,
    boxShadow: "none",
  } as React.CSSProperties,

  sidebar: {
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: "12px",
    backgroundColor: COLORS.bgSurface,
    boxShadow: SHADOWS.panel,
    padding: SPACING.md,
    overflowY: "hidden" as const,
    minHeight: "auto",
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.sm,
    minWidth: 0,
  } as React.CSSProperties,

  content: {
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: "12px",
    backgroundColor: COLORS.bgSurface,
    boxShadow: SHADOWS.panel,
    padding: SPACING.md,
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.md,
    overflowY: "hidden" as const,
    overflowX: "hidden" as const,
    minHeight: 0,
    minWidth: 0,
  } as React.CSSProperties,

  sectionHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  sectionTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 600,
    letterSpacing: "0.01em",
  } as React.CSSProperties,

  livePanel: {
    border: `2px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgPrimary,
    boxShadow: SHADOWS.card,
    padding: SPACING.md,
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.sm,
  } as React.CSSProperties,

  agentScopePanel: {
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: "10px",
    backgroundColor: COLORS.bgPrimary,
    boxShadow: SHADOWS.card,
    padding: SPACING.md,
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.sm,
    minHeight: 0,
    flex: "1 1 auto",
  } as React.CSSProperties,

  agentSearchInput: {
    width: "100%",
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: "8px",
    backgroundColor: COLORS.bgSidebar,
    color: COLORS.textPrimary,
    boxShadow: "none",
    padding: "8px 10px",
    fontSize: "12px",
    lineHeight: 1.3,
  } as React.CSSProperties,

  agentButtonList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.xs,
    maxHeight: "100%",
    overflowY: "auto" as const,
    minHeight: 0,
  } as React.CSSProperties,

  agentButton: {
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: "10px",
    backgroundColor: COLORS.bgSurface,
    boxShadow: SHADOWS.card,
    padding: SPACING.sm,
    textAlign: "left" as const,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  } as React.CSSProperties,

  agentButtonSelected: {
    borderColor: COLORS.accentPrimary,
    backgroundColor: "#132238",
    boxShadow: SHADOWS.hover,
  } as React.CSSProperties,

  liveStateBadge: {
    border: `1px solid ${COLORS.borderDefault}`,
    boxShadow: SHADOWS.card,
    padding: "2px 8px",
    fontSize: "9px",
  } as React.CSSProperties,

  liveStateOn: {
    backgroundColor: COLORS.statusIdle,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  liveStateOff: {
    backgroundColor: COLORS.statusError,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  liveList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.xs,
    maxHeight: "280px",
    overflowY: "auto" as const,
  } as React.CSSProperties,

  processLogList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.xs,
    maxHeight: "220px",
    overflowY: "auto" as const,
  } as React.CSSProperties,

  processLogRow: {
    border: `1px solid ${COLORS.borderSubtle}`,
    backgroundColor: COLORS.bgSurface,
    boxShadow: SHADOWS.card,
    padding: SPACING.xs,
    display: "flex",
    flexDirection: "column" as const,
    gap: "3px",
  } as React.CSSProperties,

  liveRow: {
    border: `2px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSurface,
    boxShadow: SHADOWS.card,
    padding: SPACING.sm,
    textAlign: "left" as const,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  } as React.CSSProperties,

  liveRowSelected: {
    backgroundColor: COLORS.bgSidebar,
    boxShadow: SHADOWS.hover,
  } as React.CSSProperties,

  liveRowTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  } as React.CSSProperties,

  liveTitle: {
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  liveStatus: {
    fontSize: "9px",
    border: `1px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgPrimary,
    padding: "2px 6px",
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  liveExcerpt: {
    margin: 0,
    fontSize: "11px",
    color: COLORS.textSecondary,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  } as React.CSSProperties,

  dimText: {
    margin: 0,
    fontSize: "12px",
    color: COLORS.textSecondary,
    lineHeight: 1.45,
  } as React.CSSProperties,

  toggleWrap: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.xs,
    fontSize: "9px",
    color: COLORS.textSecondary,
  } as React.CSSProperties,

  toggleLabel: {
    fontSize: "9px",
    color: COLORS.textSecondary,
  } as React.CSSProperties,

  pillCount: {
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: "999px",
    backgroundColor: COLORS.bgPrimary,
    boxShadow: "none",
    padding: "2px 10px",
    fontSize: "11px",
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  jobList: {
    marginTop: SPACING.xs,
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.sm,
  } as React.CSSProperties,

  jobRow: {
    border: `2px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgPrimary,
    boxShadow: SHADOWS.card,
    padding: SPACING.sm,
    textAlign: "left" as const,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  } as React.CSSProperties,

  jobRowSelected: {
    backgroundColor: COLORS.accentPrimary,
    boxShadow: SHADOWS.hover,
  } as React.CSSProperties,

  jobRowTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  } as React.CSSProperties,

  jobName: {
    fontSize: "13px",
    fontWeight: 500,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  statusDot: {
    width: "9px",
    height: "9px",
    borderRadius: "999px",
  } as React.CSSProperties,

  jobMeta: {
    margin: 0,
    fontSize: "11px",
    color: COLORS.textSecondary,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  } as React.CSSProperties,

  contentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: SPACING.md,
  } as React.CSSProperties,

  inlineActions: {
    display: "flex",
    gap: SPACING.sm,
  } as React.CSSProperties,

  runActionsRow: {
    display: "flex",
    gap: SPACING.sm,
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  label: {
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textSecondary,
  } as React.CSSProperties,

  editorWorkspace: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.5fr) minmax(320px, 1fr)",
    gap: SPACING.md,
    alignItems: "start",
  } as React.CSSProperties,

  editorWorkspaceNarrow: {
    gridTemplateColumns: "1fr",
  } as React.CSSProperties,

  promptPane: {
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.xs,
    minWidth: 0,
  } as React.CSSProperties,

  chatPane: {
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: "12px",
    backgroundColor: COLORS.bgPrimary,
    boxShadow: SHADOWS.card,
    padding: SPACING.sm,
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.xs,
    minHeight: "340px",
    minWidth: 0,
  } as React.CSSProperties,

  chatOnlyShell: {
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: "12px",
    backgroundColor: COLORS.bgPrimary,
    boxShadow: SHADOWS.card,
    padding: SPACING.md,
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.md,
    minHeight: 0,
    minWidth: 0,
    flex: "1 1 auto",
    overflow: "hidden" as const,
  } as React.CSSProperties,

  chatMessageList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.sm,
    maxHeight: "100%",
    overflowY: "auto" as const,
    paddingRight: "4px",
    minHeight: 0,
    flex: "1 1 auto",
  } as React.CSSProperties,

  chatMessage: {
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: "10px",
    boxShadow: "none",
    padding: "8px 10px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "5px",
    maxWidth: "92%",
  } as React.CSSProperties,

  chatMessageUser: {
    alignSelf: "flex-end",
    backgroundColor: "#1f3152",
    borderColor: "#385f9f",
  } as React.CSSProperties,

  chatMessageAssistant: {
    alignSelf: "flex-start",
    backgroundColor: "#141f33",
    borderColor: "#2d3f5e",
  } as React.CSSProperties,

  chatMessageSystem: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(248, 81, 73, 0.16)",
    borderColor: "rgba(248, 81, 73, 0.5)",
  } as React.CSSProperties,

  chatMessageRole: {
    margin: 0,
    fontSize: "10px",
    color: COLORS.textTertiary,
    fontWeight: 600,
    letterSpacing: "0.05em",
  } as React.CSSProperties,

  chatMessageText: {
    margin: 0,
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
    fontFamily: TYPOGRAPHY.fontMono,
    fontSize: "12px",
    lineHeight: 1.45,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  chatMessageTime: {
    margin: 0,
    fontSize: "10px",
    color: COLORS.textTertiary,
  } as React.CSSProperties,

  chatInput: {
    width: "100%",
    minHeight: "110px",
    resize: "vertical" as const,
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: "10px",
    boxShadow: "none",
    backgroundColor: COLORS.bgSidebar,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontMono,
    fontSize: "12px",
    lineHeight: 1.45,
    padding: SPACING.sm,
  } as React.CSSProperties,

  agentJobStrip: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: SPACING.xs,
  } as React.CSSProperties,

  agentJobButton: {
    border: `2px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSurface,
    boxShadow: SHADOWS.card,
    padding: SPACING.sm,
    textAlign: "left" as const,
    cursor: "pointer",
    minWidth: "220px",
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  } as React.CSSProperties,

  agentJobButtonSelected: {
    backgroundColor: COLORS.bgSidebar,
    boxShadow: SHADOWS.hover,
  } as React.CSSProperties,

  promptEditor: {
    width: "100%",
    minHeight: "340px",
    resize: "vertical" as const,
    border: `3px solid ${COLORS.borderDefault}`,
    boxShadow: SHADOWS.card,
    backgroundColor: COLORS.bgPrimary,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontMono,
    fontSize: TYPOGRAPHY.textBase,
    lineHeight: 1.7,
    padding: SPACING.md,
  } as React.CSSProperties,

  runCard: {
    border: `2px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgPrimary,
    boxShadow: SHADOWS.card,
    padding: SPACING.md,
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.sm,
    minHeight: "auto",
    overflow: "visible",
  } as React.CSSProperties,

  summary: {
    margin: 0,
    whiteSpace: "pre-wrap" as const,
    overflow: "visible",
    border: `2px solid ${COLORS.borderSubtle}`,
    backgroundColor: COLORS.bgSurface,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.textXs,
    lineHeight: 1.6,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  historyList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.xs,
    maxHeight: "320px",
    overflowY: "auto" as const,
  } as React.CSSProperties,

  historyRow: {
    border: `1px solid ${COLORS.borderSubtle}`,
    backgroundColor: COLORS.bgSurface,
    boxShadow: SHADOWS.card,
    padding: SPACING.xs,
    display: "flex",
    flexDirection: "column" as const,
    gap: "3px",
  } as React.CSSProperties,

  runExpandedCard: {
    width: "min(1200px, 100%)",
    maxHeight: "88vh",
    overflowY: "auto" as const,
    border: `3px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSurface,
    boxShadow: SHADOWS.panel,
    padding: SPACING.lg,
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.sm,
  } as React.CSSProperties,

  summaryExpanded: {
    margin: 0,
    whiteSpace: "pre-wrap" as const,
    overflowY: "auto" as const,
    maxHeight: "68vh",
    border: `2px solid ${COLORS.borderSubtle}`,
    backgroundColor: COLORS.bgSurface,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.textXs,
    lineHeight: 1.8,
    color: COLORS.textPrimary,
    wordBreak: "break-word" as const,
  } as React.CSSProperties,

  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(20, 27, 45, 0.38)",
    zIndex: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.lg,
  } as React.CSSProperties,

  modalCard: {
    width: "min(760px, 100%)",
    maxHeight: "82vh",
    overflowY: "auto" as const,
    border: `3px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSurface,
    boxShadow: SHADOWS.panel,
    padding: SPACING.lg,
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.sm,
  } as React.CSSProperties,

  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
  } as React.CSSProperties,

  modalClose: {
    border: `2px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSidebar,
    boxShadow: SHADOWS.card,
    padding: `${SPACING.xs} ${SPACING.sm}`,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.textXs,
    cursor: "pointer",
  } as React.CSSProperties,

  modalActions: {
    marginTop: SPACING.sm,
    display: "flex",
    gap: SPACING.sm,
    justifyContent: "flex-end",
  } as React.CSSProperties,

  toastOk: {
    position: "fixed" as const,
    right: SPACING.lg,
    bottom: SPACING.lg,
    border: `2px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.statusIdle,
    padding: `${SPACING.sm} ${SPACING.md}`,
    boxShadow: SHADOWS.panel,
    fontSize: TYPOGRAPHY.textXs,
    zIndex: 50,
  } as React.CSSProperties,

  toastErr: {
    position: "fixed" as const,
    right: SPACING.lg,
    bottom: `calc(${SPACING.lg} + 48px)`,
    border: `2px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.statusError,
    padding: `${SPACING.sm} ${SPACING.md}`,
    boxShadow: SHADOWS.panel,
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textPrimary,
    zIndex: 50,
    maxWidth: "680px",
    wordBreak: "break-word" as const,
  } as React.CSSProperties,
} as const;
