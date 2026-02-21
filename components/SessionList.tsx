"use client";

import { Session } from "@/lib/types";

interface SessionListProps {
  sessions: Session[];
  selectedSession: string | null;
  onSelectSession: (key: string) => void;
  loading: boolean;
}

export function SessionList({
  sessions,
  selectedSession,
  onSelectSession,
  loading,
}: SessionListProps) {
  if (loading) {
    return <p style={styles.loadingText}>Loading sessions...</p>;
  }

  if (sessions.length === 0) {
    return <p style={styles.emptyText}>No active sessions</p>;
  }

  return (
    <ul style={styles.list}>
      {sessions.map((session) => (
        <li key={session.key}>
          <button
            onClick={() => onSelectSession(session.key)}
            style={{
              ...styles.item,
              ...(selectedSession === session.key ? styles.itemActive : {}),
            }}
          >
            <span style={styles.name}>{session.label || session.key}</span>
            <span style={styles.meta}>
              {session.activeMinutes ? `${session.activeMinutes}m` : ""}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

const styles = {
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  } as React.CSSProperties,

  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: "0.75rem",
    marginBottom: "0.5rem",
    backgroundColor: "transparent",
    border: "1px solid #374151",
    borderRadius: "0.375rem",
    color: "#f3f4f6",
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "all 0.2s",
    fontFamily: "inherit",
  } as React.CSSProperties,

  itemActive: {
    backgroundColor: "#374151",
    borderColor: "#60a5fa",
    color: "#fff",
  } as React.CSSProperties,

  name: {
    fontWeight: 500,
  } as React.CSSProperties,

  meta: {
    fontSize: "0.75rem",
    color: "#9ca3af",
  } as React.CSSProperties,

  loadingText: {
    fontSize: "0.875rem",
    color: "#9ca3af",
    margin: 0,
  } as React.CSSProperties,

  emptyText: {
    fontSize: "0.875rem",
    color: "#9ca3af",
    margin: 0,
  } as React.CSSProperties,
};
