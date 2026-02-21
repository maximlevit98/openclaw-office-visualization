"use client";

import { Session } from "@/lib/types";
import { COLORS, SPACING, RADIUS, TRANSITIONS } from "@/lib/design-tokens";

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
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: "transparent",
    border: `1px solid transparent`,
    borderLeft: `3px solid transparent`,
    borderRadius: RADIUS.sm,
    color: COLORS.textPrimary,
    cursor: "pointer",
    fontSize: "14px",
    transition: `all ${TRANSITIONS.fast}`,
    fontFamily: "inherit",
  } as React.CSSProperties,

  itemActive: {
    backgroundColor: COLORS.bgSurface,
    borderLeftColor: COLORS.accentPrimary,
    borderLeftWidth: "3px",
    color: COLORS.textPrimary,
    fontWeight: 500,
  } as React.CSSProperties,

  name: {
    fontWeight: 500,
    flex: 1,
  } as React.CSSProperties,

  meta: {
    fontSize: "12px",
    color: COLORS.textTertiary,
    marginLeft: SPACING.md,
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  loadingText: {
    fontSize: "14px",
    color: COLORS.textTertiary,
    margin: 0,
    padding: `${SPACING.md} ${SPACING.lg}`,
  } as React.CSSProperties,

  emptyText: {
    fontSize: "14px",
    color: COLORS.textTertiary,
    margin: 0,
    padding: `${SPACING.md} ${SPACING.lg}`,
  } as React.CSSProperties,
};
