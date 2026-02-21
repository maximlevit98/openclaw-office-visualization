"use client";

import { useState } from "react";
import { Session } from "@/lib/types";
import { COLORS, SPACING, RADIUS, TRANSITIONS } from "@/lib/design-tokens";
import { formatTimestamp } from "@/lib/utils";

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
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

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
            onMouseEnter={() => setHoveredKey(session.key)}
            onMouseLeave={() => setHoveredKey(null)}
            style={{
              ...styles.item,
              ...(selectedSession === session.key ? styles.itemActive : {}),
              ...(hoveredKey === session.key && selectedSession !== session.key
                ? styles.itemHover
                : {}),
            }}
          >
            <div style={styles.itemContent}>
              <div style={styles.itemHeader}>
                {session.unreadCount && session.unreadCount > 0 && (
                  <div style={styles.unreadDot} title={`${session.unreadCount} unread`} />
                )}
                <span style={styles.name}>{session.label || session.key}</span>
              </div>
              {session.lastMessage && (
                <div style={styles.itemMeta}>
                  <span style={styles.preview}>{session.lastMessage}</span>
                  {session.lastMessageTime && (
                    <span style={styles.time}>{formatTimestamp(session.lastMessageTime)}</span>
                  )}
                </div>
              )}
            </div>
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
    flexDirection: "column" as const,
    alignItems: "flex-start",
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

  itemHover: {
    backgroundColor: COLORS.bgPrimary,
    borderLeftColor: COLORS.borderDefault,
    transition: `all ${TRANSITIONS.fast}`,
  } as React.CSSProperties,

  name: {
    fontWeight: 500,
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
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

  unreadDot: {
    width: "8px",
    height: "8px",
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.unreadDot,
    flexShrink: 0,
    animation: "pulse 2s infinite",
  } as React.CSSProperties,

  itemContent: {
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.sm,
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,

  itemHeader: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.sm,
    minWidth: 0,
  } as React.CSSProperties,

  itemMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.sm,
    minWidth: 0,
  } as React.CSSProperties,

  preview: {
    fontSize: "12px",
    color: COLORS.textSecondary,
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  time: {
    fontSize: "11px",
    color: COLORS.textTertiary,
    flexShrink: 0,
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
};
