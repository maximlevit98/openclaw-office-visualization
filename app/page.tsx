"use client";

import { useEffect, useState, useRef } from "react";
import { Session, Message, Agent } from "@/lib/types";
import { Sidebar } from "./components/Sidebar";
import { MessagePanel } from "./components/MessagePanel";
import { OfficePanel } from "./components/OfficePanel";
import { OfficeStrip } from "./components/OfficeStrip";
import { fetchJSON, fetchWithFallback, isServiceHealthy, postJSON } from "@/lib/client-fetch";
import { generateMockSessions, generateMockMessages, generateMockAgents } from "@/lib/mock-data";
import { useKeyboardShortcut } from "@/lib/hooks";

// Responsive office display component
function ResponsiveOffice({
  agents,
  loading,
  onAgentClick,
}: {
  agents: Agent[];
  loading: boolean;
  onAgentClick?: (agentId: string) => void;
}) {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkTablet = () => setIsTablet(window.innerWidth < 1024);
    checkTablet();
    window.addEventListener("resize", checkTablet);
    return () => window.removeEventListener("resize", checkTablet);
  }, []);

  if (isTablet) {
    return <OfficeStrip agents={agents} loading={loading} onAgentClick={onAgentClick} />;
  }

  return <OfficePanel agents={agents} loading={loading} onAgentClick={onAgentClick} />;
}

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Keyboard shortcuts
  useKeyboardShortcut(
    { key: "k", ctrl: true },
    () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    },
    !loading
  );

  // Cmd+/ (or Ctrl+/) to focus message input
  useKeyboardShortcut(
    { key: "/", ctrl: true },
    () => {
      messageInputRef.current?.focus();
    },
    !loading && !!selectedSession
  );

  // Fetch sessions and agents on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check service health first (quick 3s check)
        const healthy = await isServiceHealthy();
        if (!healthy) {
          setError("Service degraded (using fallback data)");
        }

        // Fetch with timeout protection (5s timeout, 1 retry)
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

        setSessions(Array.isArray(sessionsData) ? sessionsData : []);
        setAgents(Array.isArray(agentsData) ? agentsData : []);

        // Auto-select first session
        if (Array.isArray(sessionsData) && sessionsData.length > 0) {
          setSelectedSession(sessionsData[0].key);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        // Fallback to mock data
        const mockSessions = generateMockSessions();
        setSessions(mockSessions);
        setSelectedSession(mockSessions[0].key);

        const mockAgents = generateMockAgents();
        setAgents(mockAgents);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch messages when session is selected
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
        // Show mock messages as fallback
        setMessages(generateMockMessages());
      }
    };

    fetchHistory();
  }, [selectedSession]);

  const handleSendMessage = async (content: string) => {
    if (!selectedSession) return;

    setSending(true);
    try {
      // Optimistic update: add message immediately
      const userMessage: Message = {
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send to API with timeout protection (5s timeout, 1 retry)
      await postJSON(
        `/api/sessions/${encodeURIComponent(selectedSession)}/send`,
        { message: content, timeoutSeconds: 10 },
        { timeoutMs: 5000, retries: 1 }
      );

      // Optionally fetch updated history
      try {
        const data = await fetchJSON<Message[]>(
          `/api/sessions/${encodeURIComponent(selectedSession)}/history?limit=20`,
          { timeoutMs: 5000, retries: 1 }
        );
        if (Array.isArray(data)) {
          setMessages(data);
        }
      } catch {
        // Keep optimistic update if history fetch fails
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to send message:", errorMsg);
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Error: ${errorMsg}`,
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
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Refresh failed: ${errorMsg}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const currentSession = selectedSession
    ? sessions.find((s) => s.key === selectedSession)
    : sessions[0];

  const handleAgentClick = (agentId: string) => {
    // Find session for this agent and select it
    const agentSession = sessions.find((s) => s.label?.includes(agentId));
    if (agentSession) {
      setSelectedSession(agentSession.key);
    }
  };

  return (
    <div style={styles.container} data-layout="office-dashboard">
      {/* Sidebar: Desktop 280px fixed | Tablet/Mobile 64px icon strip */}
      <Sidebar
        sessions={sessions}
        selectedSession={selectedSession}
        onSelectSession={setSelectedSession}
        loading={loading}
        error={error}
        searchInputRef={searchInputRef}
      />

      {/* Main content area: Desktop 3-col grid | Tablet 2-col grid | Mobile flex */}
      <div style={styles.mainContent}>
        {/* Chat column (center, flex: 1) */}
        <div style={styles.chatColumn}>
          <MessagePanel
            currentSession={currentSession}
            messages={messages}
            selectedSession={selectedSession}
            onSendMessage={handleSendMessage}
            onRefresh={handleRefreshMessages}
            isSending={sending}
            inputRef={messageInputRef}
          />
        </div>

        {/* Office section (Desktop: right panel; Tablet: top strip; Mobile: deferred) */}
        <div style={styles.officeColumn}>
          <ResponsiveOffice 
            agents={agents} 
            loading={loading}
            onAgentClick={handleAgentClick}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "280px 1fr 300px",
    gridTemplateRows: "1fr",
    height: "100vh",
    backgroundColor: "#FAF8F5",
    color: "#1A1816",
    gap: 0,
    overflow: "hidden",
    
    "@media (max-width: 1023px)": {
      gridTemplateColumns: "64px 1fr",
      gridTemplateRows: "52px 1fr",
    },
    
    "@media (max-width: 767px)": {
      gridTemplateColumns: "1fr",
      gridTemplateRows: "auto 1fr auto",
    },
  } as React.CSSProperties,

  mainContent: {
    display: "grid",
    gridTemplateColumns: "1fr 300px",
    gridTemplateRows: "1fr",
    gap: 0,
    overflow: "hidden",
    height: "100vh",
    
    "@media (max-width: 1023px)": {
      gridColumn: "2",
      gridRow: "2",
      gridTemplateColumns: "1fr",
      gridTemplateRows: "52px 1fr",
    },
    
    "@media (max-width: 767px)": {
      gridColumn: "1",
      gridRow: "2 / -1",
      gridTemplateColumns: "1fr",
      gridTemplateRows: "1fr",
    },
  } as React.CSSProperties,

  chatColumn: {
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
    height: "100vh",
  } as React.CSSProperties,

  officeColumn: {
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
    height: "100vh",
    
    "@media (max-width: 1023px)": {
      height: "52px",
      maxHeight: "52px",
      borderBottom: "1px solid #E5E0D8",
    },
    
    "@media (max-width: 767px)": {
      display: "none",
    },
  } as React.CSSProperties,
} as const;
