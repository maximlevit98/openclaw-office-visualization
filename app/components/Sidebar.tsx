"use client";

import React, { useState, useMemo } from "react";
import { Session } from "@/lib/types";
import { COLORS, TYPOGRAPHY, SPACING, TRANSITIONS, BREAKPOINTS } from "@/lib/design-tokens";

interface SidebarProps {
  sessions: Session[];
  selectedSession: string | null;
  onSelectSession: (sessionKey: string) => void;
  loading: boolean;
  error: string | null;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function Sidebar({
  sessions,
  selectedSession,
  onSelectSession,
  loading,
  error,
  searchInputRef,
}: SidebarProps) {
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

  const activeSessions = useMemo(
    () => filteredSessions.filter((s) => s.status === "active"),
    [filteredSessions]
  );

  const idleSessions = useMemo(
    () => filteredSessions.filter((s) => s.status === "idle"),
    [filteredSessions]
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside style={styles.sidebarDesktop}>
        <div style={styles.header}>
          <h1 style={styles.title}>OpenClaw</h1>
          <p style={styles.subtitle}>Office</p>
        </div>

        {error && (
          <div style={styles.errorBanner}>
            <span style={styles.errorText}>⚠ {error}</span>
          </div>
        )}

        {/* Search Input */}
        <div style={styles.searchContainer}>
          <input
            ref={searchInputRef}
            type="text"
            style={styles.searchInput}
            placeholder="Search sessions... (Cmd+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search sessions (press Cmd+K)"
          />
          {searchQuery && (
            <button
              style={styles.clearButton}
              onClick={() => setSearchQuery("")}
              title="Clear search"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div style={styles.sessionList}>
          {loading ? (
            <div style={styles.loadingPlaceholder}>
              <p style={styles.loadingText}>Loading...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>
                {searchQuery ? "No sessions match" : "No sessions"}
              </p>
            </div>
          ) : (
            <>
              {activeSessions.length > 0 && (
                <div style={styles.sessionGroup}>
                  <h3 style={styles.groupTitle}>
                    Active <span style={styles.groupCount}>{activeSessions.length}</span>
                  </h3>
                  {activeSessions.map((session) => (
                    <SessionItem
                      key={session.key}
                      session={session}
                      isSelected={selectedSession === session.key}
                      onSelect={() => onSelectSession(session.key)}
                    />
                  ))}
                </div>
              )}

              {idleSessions.length > 0 && (
                <div style={styles.sessionGroup}>
                  <h3 style={styles.groupTitle}>
                    Idle <span style={styles.groupCount}>{idleSessions.length}</span>
                  </h3>
                  {idleSessions.map((session) => (
                    <SessionItem
                      key={session.key}
                      session={session}
                      isSelected={selectedSession === session.key}
                      onSelect={() => onSelectSession(session.key)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Tablet/Mobile Icon Strip */}
      <div style={styles.sidebarMobile}>
        {loading ? (
          <div style={styles.stripPlaceholder}>📡</div>
        ) : (
          sessions.slice(0, 3).map((session) => (
            <button
              key={session.key}
              style={{
                ...styles.iconButton,
                backgroundColor:
                  selectedSession === session.key
                    ? COLORS.accentPrimary
                    : COLORS.bgSidebar,
              }}
              onClick={() => onSelectSession(session.key)}
              title={session.label || session.key}
            >
              <span style={styles.iconEmoji}>
                {session.kind === "background" ? "⚙️" : "💬"}
              </span>
            </button>
          ))
        )}
      </div>
    </>
  );
}

interface SessionItemProps {
  session: Session;
  isSelected: boolean;
  onSelect: () => void;
}

function SessionItem({ session, isSelected, onSelect }: SessionItemProps) {
  return (
    <button
      style={{
        ...styles.sessionItem,
        backgroundColor: isSelected
          ? COLORS.accentPrimary
          : "transparent",
        color: isSelected ? COLORS.bgPrimary : COLORS.textPrimary,
      }}
      onClick={onSelect}
    >
      <div style={styles.sessionLabel}>
        <span
          style={{
            ...styles.sessionIcon,
            color: isSelected ? COLORS.bgPrimary : COLORS.textSecondary,
          }}
        >
          {session.kind === "background" ? "⚙️" : "💬"}
        </span>
        <div style={styles.sessionContent}>
          <p style={styles.sessionName}>{session.label || session.key}</p>
          <p style={styles.sessionMeta}>
            {session.status || "active"} • {session.activeMinutes || 0}m
          </p>
        </div>
      </div>
      {isSelected && (
        <div
          style={{
            width: "4px",
            height: "40%",
            backgroundColor: COLORS.bgPrimary,
            borderRadius: COLORS.bgPrimary,
          }}
        />
      )}
    </button>
  );
}

const styles = {
  sidebarDesktop: {
    display: "none",
    "@media (min-width: 1024px)": {
      display: "flex",
      flexDirection: "column" as const,
    },
    width: "280px",
    height: "100vh",
    backgroundColor: COLORS.bgSidebar,
    borderRight: `1px solid ${COLORS.borderDefault}`,
    overflow: "hidden",
    overflowY: "auto" as const,
    flexDirection: "column" as const,
  } as React.CSSProperties,

  sidebarMobile: {
    display: "flex",
    "@media (min-width: 1024px)": {
      display: "none",
    },
    flexDirection: "column" as const,
    alignItems: "center",
    gap: SPACING.sm,
    width: "64px",
    height: "100vh",
    backgroundColor: COLORS.bgSidebar,
    borderRight: `1px solid ${COLORS.borderDefault}`,
    padding: SPACING.md,
    overflow: "hidden",
    overflowY: "auto" as const,
  } as React.CSSProperties,

  header: {
    padding: SPACING.xl,
    textAlign: "center" as const,
    borderBottom: `1px solid ${COLORS.borderDefault}`,
  } as React.CSSProperties,

  title: {
    fontSize: TYPOGRAPHY.textLg,
    fontWeight: TYPOGRAPHY.weight600,
    color: COLORS.accentPrimary,
    margin: 0,
    marginBottom: SPACING.xs,
  } as React.CSSProperties,

  subtitle: {
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textTertiary,
    margin: 0,
    fontWeight: TYPOGRAPHY.weight500,
  } as React.CSSProperties,

  errorBanner: {
    backgroundColor: COLORS.statusError,
    padding: SPACING.md,
    margin: SPACING.md,
    borderRadius: "6px",
    borderLeft: `3px solid ${COLORS.textPrimary}`,
  } as React.CSSProperties,

  errorText: {
    color: COLORS.bgPrimary,
    fontSize: TYPOGRAPHY.textSm,
    fontWeight: TYPOGRAPHY.weight500,
  } as React.CSSProperties,

  sessionList: {
    flex: 1,
    overflow: "hidden",
    overflowY: "auto" as const,
    padding: SPACING.md,
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: TYPOGRAPHY.textXs,
    fontWeight: TYPOGRAPHY.weight600,
    color: COLORS.textTertiary,
    textTransform: "uppercase" as const,
    margin: 0,
    marginBottom: SPACING.md,
    letterSpacing: "0.5px",
  } as React.CSSProperties,

  sessionItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    border: `1px solid ${COLORS.borderSubtle}`,
    borderRadius: "8px",
    cursor: "pointer",
    transition: `all ${TRANSITIONS.fast}`,
    fontSize: TYPOGRAPHY.textSm,
    fontWeight: TYPOGRAPHY.weight500,
  } as React.CSSProperties,

  sessionLabel: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.md,
    flex: 1,
  } as React.CSSProperties,

  sessionIcon: {
    fontSize: "18px",
  } as React.CSSProperties,

  sessionContent: {
    textAlign: "left" as const,
  } as React.CSSProperties,

  sessionName: {
    margin: 0,
    fontSize: TYPOGRAPHY.textSm,
    fontWeight: TYPOGRAPHY.weight500,
  } as React.CSSProperties,

  sessionMeta: {
    margin: 0,
    fontSize: TYPOGRAPHY.textXs,
    opacity: 0.7,
    marginTop: "2px",
  } as React.CSSProperties,

  loadingPlaceholder: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100px",
  } as React.CSSProperties,

  loadingText: {
    color: COLORS.textTertiary,
    fontSize: TYPOGRAPHY.textSm,
    margin: 0,
    animation: "pulse 1.5s ease-in-out infinite",
  } as React.CSSProperties,

  emptyState: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100px",
  } as React.CSSProperties,

  emptyText: {
    color: COLORS.textTertiary,
    fontSize: TYPOGRAPHY.textSm,
    margin: 0,
  } as React.CSSProperties,

  iconButton: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: `all ${TRANSITIONS.fast}`,
    fontSize: "20px",
  } as React.CSSProperties,

  iconEmoji: {
    display: "block",
    fontSize: "24px",
  } as React.CSSProperties,

  stripPlaceholder: {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    opacity: 0.6,
  } as React.CSSProperties,

  searchContainer: {
    position: "relative" as const,
    padding: `${SPACING.md} ${SPACING.md} 0 ${SPACING.md}`,
  } as React.CSSProperties,

  searchInput: {
    width: "100%",
    padding: SPACING.md,
    borderRadius: "6px",
    border: `1px solid ${COLORS.borderDefault}`,
    fontSize: TYPOGRAPHY.textSm,
    fontFamily: TYPOGRAPHY.fontFamily,
    backgroundColor: COLORS.bgPrimary,
    color: COLORS.textPrimary,
    transition: `all ${TRANSITIONS.fast}`,
  } as React.CSSProperties,

  clearButton: {
    position: "absolute" as const,
    right: `calc(${SPACING.md} + ${SPACING.md})`,
    top: `calc(${SPACING.md} + ${SPACING.md})`,
    background: "none",
    border: "none",
    color: COLORS.textTertiary,
    cursor: "pointer",
    fontSize: TYPOGRAPHY.textSm,
    padding: SPACING.sm,
  } as React.CSSProperties,

  sessionGroup: {
    marginBottom: SPACING.lg,
  } as React.CSSProperties,

  groupTitle: {
    fontSize: TYPOGRAPHY.textXs,
    fontWeight: TYPOGRAPHY.weight600,
    color: COLORS.textTertiary,
    textTransform: "uppercase" as const,
    margin: 0,
    marginBottom: SPACING.md,
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center",
    gap: SPACING.sm,
  } as React.CSSProperties,

  groupCount: {
    fontSize: TYPOGRAPHY.textXs,
    backgroundColor: COLORS.bgPrimary,
    color: COLORS.accentPrimary,
    padding: `${SPACING.xs} ${SPACING.sm}`,
    borderRadius: SPACING.xs,
    fontWeight: TYPOGRAPHY.weight600,
  } as React.CSSProperties,
} as const;
