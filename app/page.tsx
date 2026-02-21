"use client";

import { useEffect, useState } from "react";
import { Session, Message, Agent } from "@/lib/types";
import { Sidebar } from "@/components/Sidebar";
import { MessagePanel } from "@/components/MessagePanel";
import { OfficePanel } from "@/components/OfficePanel";

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Fetch sessions and agents on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [sessionsRes, agentsRes] = await Promise.all([
          fetch("/api/sessions"),
          fetch("/api/agents"),
        ]);

        if (!sessionsRes.ok) throw new Error("Failed to fetch sessions");
        if (!agentsRes.ok) throw new Error("Failed to fetch agents");

        const sessionsData = await sessionsRes.json();
        const agentsData = await agentsRes.json();

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
        const mockSessions: Session[] = [
          {
            key: "demo-1",
            label: "Main Session",
            kind: "main",
            activeMinutes: 42,
          },
          {
            key: "demo-2",
            label: "Background Task",
            kind: "background",
            activeMinutes: 5,
          },
        ];
        setSessions(mockSessions);
        setSelectedSession(mockSessions[0].key);

        const mockAgents: Agent[] = [
          { id: "frontend", name: "Frontend Agent", status: "online" },
          { id: "backend", name: "Backend Agent", status: "online" },
          { id: "deploy", name: "Deploy Agent", status: "idle" },
        ];
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
        const res = await fetch(
          `/api/sessions/${encodeURIComponent(selectedSession)}/history?limit=20`
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
        // Show mock messages
        setMessages([
          { role: "user", content: "What can you do?" },
          {
            role: "assistant",
            content: "I can help with various tasks including code review, testing, and deployment.",
          },
        ]);
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

      // Send to API
      const response = await fetch(
        `/api/sessions/${encodeURIComponent(selectedSession)}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, timeoutSeconds: 10 }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      // Optionally fetch updated history
      try {
        const historyRes = await fetch(
          `/api/sessions/${encodeURIComponent(selectedSession)}/history?limit=20`
        );
        if (historyRes.ok) {
          const data = await historyRes.json();
          if (Array.isArray(data)) {
            setMessages(data);
          }
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
    <div style={styles.container}>
      {/* Sidebar (Desktop: fixed 280px left; Tablet: 64px icon strip overlay) */}
      <Sidebar
        sessions={sessions}
        selectedSession={selectedSession}
        onSelectSession={setSelectedSession}
        loading={loading}
        error={error}
      />

      {/* Main layout: Desktop (3-col) + Tablet (2-col with top strip) */}
      <div style={styles.layout}>
        {/* Chat panel */}
        <div style={styles.chatColumn}>
          <MessagePanel
            currentSession={currentSession}
            messages={messages}
            selectedSession={selectedSession}
            onSendMessage={handleSendMessage}
            isSending={sending}
          />
        </div>

        {/* Office panel (Desktop: right column; Tablet: top strip) */}
        <div style={styles.officeColumn}>
          <OfficePanel 
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
    display: "flex",
    height: "100vh",
    backgroundColor: "#FAF8F5",
    color: "#1A1816",
    overflow: "hidden",
  } as React.CSSProperties,

  layout: {
    display: "flex",
    width: "100%",
    height: "100vh",
  } as React.CSSProperties,

  mainLayout: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1fr 300px",
    gridTemplateRows: "auto 1fr",
    gap: 0,
    overflow: "hidden",
    
    "@media (max-width: 1023px)": {
      gridTemplateColumns: "1fr",
      gridTemplateRows: "52px 1fr",
    },
  } as React.CSSProperties,

  chatColumn: {
    gridColumn: "1",
    gridRow: "1 / -1",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
    
    "@media (max-width: 1023px)": {
      gridColumn: "1",
      gridRow: "2",
    },
  } as React.CSSProperties,

  officeColumn: {
    gridColumn: "2",
    gridRow: "1 / -1",
    
    "@media (max-width: 1023px)": {
      gridColumn: "1",
      gridRow: "1",
    },
  } as React.CSSProperties,
} as const;
