"use client";

import React, { useState, useMemo } from "react";
import { Session } from "@/lib/types";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from "@/lib/design-tokens";

interface SessionSearchProps {
  sessions: Session[];
  onSelect: (key: string) => void;
  selectedSession: string | null;
}

/**
 * Session search/filter component
 * Real-time filter by label or key
 */
export function SessionSearch({
  sessions,
  onSelect,
  selectedSession,
}: SessionSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    
    const query = searchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        (s.label || s.key).toLowerCase().includes(query) ||
        s.key.toLowerCase().includes(query)
    );
  }, [sessions, searchQuery]);

  return (
    <div style={styles.container}>
      <input
        type="text"
        style={styles.input}
        placeholder="Search sessions..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {searchQuery && (
        <button
          style={styles.clearButton}
          onClick={() => setSearchQuery("")}
          title="Clear search"
        >
          ✕
        </button>
      )}
      {searchQuery && filteredSessions.length === 0 && (
        <div style={styles.noResults}>
          <p style={styles.noResultsText}>No sessions found</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.sm,
  } as React.CSSProperties,

  input: {
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    border: `1px solid ${COLORS.borderDefault}`,
    fontSize: TYPOGRAPHY.textSm,
    fontFamily: TYPOGRAPHY.fontFamily,
    backgroundColor: COLORS.bgPrimary,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  clearButton: {
    position: "absolute",
    right: SPACING.md,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: COLORS.textTertiary,
    cursor: "pointer",
    fontSize: TYPOGRAPHY.textSm,
    padding: SPACING.sm,
  } as React.CSSProperties,

  noResults: {
    padding: SPACING.md,
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.sm,
    textAlign: "center" as const,
  } as React.CSSProperties,

  noResultsText: {
    margin: 0,
    fontSize: TYPOGRAPHY.textSm,
    color: COLORS.textTertiary,
  } as React.CSSProperties,
} as const;
