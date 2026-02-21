"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Session, Message, Agent } from "@/lib/types";
import { MessagePanel } from "./components/MessagePanel";
import { OfficeSimulation } from "./components/OfficeSimulation";
import { AgentChatSidebar } from "./components/AgentChatSidebar";
import { fetchJSON, fetchWithFallback, isServiceHealthy, postJSON } from "@/lib/client-fetch";
import { generateMockSessions, generateMockMessages, generateMockAgents } from "@/lib/mock-data";
import { useKeyboardShortcut } from "@/lib/hooks";
import { BREAKPOINTS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from "@/lib/design-tokens";
import { findSessionForAgent } from "@/lib/session-mapping";
import { useSyncedLocale } from "@/lib/locale-client";

type ViewportMode = "desktop" | "tablet" | "mobile";
interface ResizeState {
  x: number;
  width: number;
  scale: number;
}

const CHAT_DOCK_WIDTH_KEY = "openclaw-office-chat-dock-width";
const CHAT_DOCK_MIN_WIDTH = 320;
const CHAT_DOCK_MAX_WIDTH = 760;
const RESIZER_WIDTH = 12;

const TEXT = {
  en: {
    degraded: "Service degraded (using fallback data)",
    error: "Error",
    refreshFailed: "Refresh failed",
  },
  ru: {
    degraded: "Сервис недоступен (используются резервные данные)",
    error: "Ошибка",
    refreshFailed: "Обновление не удалось",
  },
} as const;

function getViewportMode(width: number): ViewportMode {
  if (width < BREAKPOINTS.mobile) return "mobile";
  if (width < BREAKPOINTS.tablet) return "tablet";
  return "desktop";
}

function getMaxChatDockWidth(viewportWidth: number): number {
  const adaptiveMax = Math.floor(viewportWidth * 0.45);
  return clamp(adaptiveMax, CHAT_DOCK_MIN_WIDTH, CHAT_DOCK_MAX_WIDTH);
}

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [viewportMode, setViewportMode] = useState<ViewportMode>("desktop");
  const [locale, setLocale] = useSyncedLocale("en");
  const [chatDockWidth, setChatDockWidth] = useState(390);
  const [isResizingDock, setIsResizingDock] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const resizeStateRef = useRef<ResizeState | null>(null);
  const t = TEXT[locale];

  useKeyboardShortcut(
    { key: "k", ctrl: true },
    () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    },
    !loading
  );

  useKeyboardShortcut(
    { key: "/", ctrl: true },
    () => {
      messageInputRef.current?.focus();
    },
    !loading && !!selectedSession
  );

  useEffect(() => {
    const syncViewport = () => {
      const width = window.innerWidth;
      setViewportMode(getViewportMode(width));
      setChatDockWidth((current) =>
        clamp(current, CHAT_DOCK_MIN_WIDTH, getMaxChatDockWidth(width))
      );
    };
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(CHAT_DOCK_WIDTH_KEY));
    if (!Number.isFinite(stored)) return;
    setChatDockWidth(
      clamp(stored, CHAT_DOCK_MIN_WIDTH, getMaxChatDockWidth(window.innerWidth))
    );
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CHAT_DOCK_WIDTH_KEY, String(chatDockWidth));
  }, [chatDockWidth]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const healthy = await isServiceHealthy();
        if (!healthy) {
          setError(t.degraded);
        }

        const [sessionsData, agentsData] = await Promise.all([
          fetchWithFallback("/api/sessions", [] as Session[], {
            timeoutMs: 5000,
            retries: 1,
          }),
          fetchWithFallback("/api/agents", [] as Agent[], {
            timeoutMs: 5000,
            retries: 1,
          }),
        ]);

        const nextSessions = Array.isArray(sessionsData) ? sessionsData : [];
        const nextAgents = Array.isArray(agentsData) ? agentsData : [];

        setSessions(nextSessions);
        setAgents(nextAgents);

        if (nextSessions.length > 0) {
          setSelectedSession(nextSessions[0].key);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        const mockSessions = generateMockSessions();
        const mockAgents = generateMockAgents();
        setSessions(mockSessions);
        setAgents(mockAgents);
        setSelectedSession(mockSessions[0]?.key || null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t.degraded]);

  useEffect(() => {
    if (!selectedSession) return;

    const fetchHistory = async () => {
      try {
        const data = await fetchJSON<Message[]>(
          `/api/sessions/${encodeURIComponent(selectedSession)}/history?limit=20`,
          { timeoutMs: 5000, retries: 1 }
        );
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch history:", err);
        setMessages(generateMockMessages());
      }
    };

    fetchHistory();
  }, [selectedSession]);

  const handleSendMessage = async (content: string) => {
    if (!selectedSession) return;

    setSending(true);
    try {
      const userMessage: Message = {
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      await postJSON(
        `/api/sessions/${encodeURIComponent(selectedSession)}/send`,
        { message: content, timeoutSeconds: 10 },
        { timeoutMs: 5000, retries: 1 }
      );

      try {
        const data = await fetchJSON<Message[]>(
          `/api/sessions/${encodeURIComponent(selectedSession)}/history?limit=20`,
          { timeoutMs: 5000, retries: 1 }
        );
        if (Array.isArray(data)) {
          setMessages(data);
        }
      } catch {
        // Keep optimistic messages when refresh fails.
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to send message:", errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `${t.error}: ${errorMsg}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleRefreshMessages = async () => {
    if (!selectedSession) return;

    try {
      const data = await fetchJSON<Message[]>(
        `/api/sessions/${encodeURIComponent(selectedSession)}/history?limit=20`,
        { timeoutMs: 5000, retries: 1 }
      );
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to refresh messages:", errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `${t.refreshFailed}: ${errorMsg}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleAgentClick = (agentId: string) => {
    const agent = agents.find((item) => item.id === agentId);
    if (!agent) return;

    const session = findSessionForAgent(agent, sessions);
    if (session) {
      setSelectedSession(session.key);
    }
  };

  const currentSession = selectedSession
    ? sessions.find((session) => session.key === selectedSession)
    : sessions[0];

  const selectedAgentId = useMemo(() => {
    if (!selectedSession) return null;
    const linked = agents.find(
      (agent) => findSessionForAgent(agent, sessions)?.key === selectedSession
    );
    return linked?.id || null;
  }, [agents, sessions, selectedSession]);

  const scale = viewportMode === "mobile" ? 0.86 : viewportMode === "tablet" ? 0.78 : 0.68;
  const styles = getLayoutStyles(viewportMode, chatDockWidth);
  const inverseScale = 1 / scale;

  const handleDockResizeStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (viewportMode !== "desktop") return;
    resizeStateRef.current = {
      x: event.clientX,
      width: chatDockWidth,
      scale,
    };
    setIsResizingDock(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  useEffect(() => {
    if (!isResizingDock) return;

    const handleMove = (event: PointerEvent) => {
      const state = resizeStateRef.current;
      if (!state) return;

      const delta = (event.clientX - state.x) / state.scale;
      const maxWidthForViewport = getMaxChatDockWidth(window.innerWidth);
      const nextWidth = clamp(
        state.width - delta,
        CHAT_DOCK_MIN_WIDTH,
        maxWidthForViewport
      );
      setChatDockWidth(nextWidth);
    };

    const handleEnd = () => {
      setIsResizingDock(false);
      resizeStateRef.current = null;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
    };
  }, [isResizingDock]);

  useEffect(() => {
    if (!isResizingDock) return;
    const previousCursor = document.body.style.cursor;
    const previousSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousSelect;
    };
  }, [isResizingDock]);

  return (
    <div style={styles.viewportFrame}>
      <div
        style={{
          ...styles.scaledCanvas,
          width: `${inverseScale * 100}vw`,
          height: `${inverseScale * 100}vh`,
          transform: `scale(${scale})`,
        }}
      >
        <div style={styles.container}>
          <section style={styles.officeStage}>
            <a href="/control" style={styles.controlLink}>
              {locale === "ru" ? "КОНТРОЛЬ" : "CONTROL"}
            </a>
            <OfficeSimulation
              agents={agents}
              loading={loading}
              selectedAgentId={selectedAgentId}
              onAgentClick={handleAgentClick}
              locale={locale}
            />
          </section>

          {viewportMode === "desktop" && (
            <div
              style={{
                ...styles.resizer,
                ...(isResizingDock ? styles.resizerActive : null),
              }}
              role="separator"
              aria-orientation="vertical"
              aria-label={locale === "ru" ? "Изменить ширину панели" : "Resize sidebar"}
              onPointerDown={handleDockResizeStart}
            >
              <div style={styles.resizerGrip} />
            </div>
          )}

          <aside style={styles.chatDock}>
            <AgentChatSidebar
              agents={agents}
              sessions={sessions}
              selectedSession={selectedSession}
              onSelectSession={setSelectedSession}
              loading={loading}
              error={error}
              searchInputRef={searchInputRef}
              locale={locale}
              onLocaleChange={setLocale}
            />
            <div style={styles.messageWrap}>
              <MessagePanel
                currentSession={currentSession}
                messages={messages}
                selectedSession={selectedSession}
                onSendMessage={handleSendMessage}
                onRefresh={handleRefreshMessages}
                isSending={sending}
                inputRef={messageInputRef}
                embedded
                locale={locale}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function getLayoutStyles(mode: ViewportMode, chatDockWidth: number) {
  const common = {
    viewportFrame: {
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      backgroundColor: COLORS.bgPrimary,
      position: "relative" as const,
    } as React.CSSProperties,

    scaledCanvas: {
      transformOrigin: "top left",
      position: "absolute" as const,
      top: 0,
      left: 0,
    } as React.CSSProperties,

    messageWrap: {
      minHeight: 0,
      overflow: "hidden",
    } as React.CSSProperties,

    controlLink: {
      position: "absolute" as const,
      top: SPACING.md,
      right: SPACING.md,
      zIndex: 20,
      border: `2px solid ${COLORS.borderDefault}`,
      backgroundColor: COLORS.accentPrimary,
      color: COLORS.textPrimary,
      textDecoration: "none",
      boxShadow: SHADOWS.card,
      padding: `${SPACING.xs} ${SPACING.sm}`,
      fontSize: TYPOGRAPHY.textXs,
    } as React.CSSProperties,

    resizer: {
      display: "none",
    } as React.CSSProperties,

    resizerActive: {
      display: "none",
    } as React.CSSProperties,

    resizerGrip: {
      display: "none",
    } as React.CSSProperties,
  };

  if (mode === "mobile") {
    return {
      ...common,
      container: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "34vh 66vh",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: COLORS.bgPrimary,
        position: "relative" as const,
      } as React.CSSProperties,

      officeStage: {
        gridRow: "1",
        gridColumn: "1",
        minHeight: 0,
        overflow: "hidden",
        position: "relative" as const,
      } as React.CSSProperties,

      chatDock: {
        gridRow: "2",
        gridColumn: "1",
        minHeight: 0,
        display: "grid",
        gridTemplateRows: "260px 1fr",
        borderTop: `3px solid ${COLORS.borderDefault}`,
        overflow: "hidden",
      } as React.CSSProperties,
    } as const;
  }

  if (mode === "tablet") {
    return {
      ...common,
      container: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "42vh 58vh",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: COLORS.bgPrimary,
        position: "relative" as const,
      } as React.CSSProperties,

      officeStage: {
        gridRow: "1",
        gridColumn: "1",
        minHeight: 0,
        overflow: "hidden",
        position: "relative" as const,
      } as React.CSSProperties,

      chatDock: {
        gridRow: "2",
        gridColumn: "1",
        minHeight: 0,
        display: "grid",
        gridTemplateRows: "290px 1fr",
        borderTop: `3px solid ${COLORS.borderDefault}`,
        overflow: "hidden",
      } as React.CSSProperties,
    } as const;
  }

  return {
    ...common,
    container: {
      display: "grid",
      gridTemplateColumns: `1fr ${RESIZER_WIDTH}px ${chatDockWidth}px`,
      gridTemplateRows: "1fr",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      backgroundColor: COLORS.bgPrimary,
      position: "relative" as const,
    } as React.CSSProperties,

    officeStage: {
      gridRow: "1",
      gridColumn: "1",
      minWidth: 0,
      minHeight: 0,
      overflow: "hidden",
      position: "relative" as const,
    } as React.CSSProperties,

    resizer: {
      gridRow: "1",
      gridColumn: "2",
      backgroundColor: COLORS.bgPrimary,
      borderLeft: `2px solid ${COLORS.borderDefault}`,
      borderRight: `2px solid ${COLORS.borderDefault}`,
      cursor: "col-resize",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    } as React.CSSProperties,

    resizerActive: {
      backgroundColor: COLORS.bgSidebar,
      boxShadow: "inset 0 0 0 2px rgba(20, 27, 45, 0.22)",
    } as React.CSSProperties,

    resizerGrip: {
      width: "4px",
      height: "44px",
      backgroundColor: COLORS.borderDefault,
      boxShadow: SHADOWS.card,
    } as React.CSSProperties,

    chatDock: {
      gridRow: "1",
      gridColumn: "3",
      minWidth: 0,
      minHeight: 0,
      borderLeft: "none",
      display: "grid",
      gridTemplateRows: "300px 1fr",
      overflow: "hidden",
      backgroundColor: COLORS.bgSurface,
    } as React.CSSProperties,
  } as const;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
