"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Session } from "@/lib/types";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  TRANSITIONS,
  BREAKPOINTS,
  SHADOWS,
} from "@/lib/design-tokens";

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
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const syncViewport = () => setIsDesktop(window.innerWidth >= BREAKPOINTS.tablet);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;

    const query = searchQuery.toLowerCase();
    return sessions.filter(
      (s) => (s.label || s.key).toLowerCase().includes(query) || s.key.toLowerCase().includes(query)
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

  if (!isDesktop) {
    return (
      <div style={styles.sidebarMobile}>
        {loading ? (
          <div style={styles.stripPlaceholder}>...</div>
        ) : (
          sessions.slice(0, 4).map((session) => (
            <button
              key={session.key}
              style={{
                ...styles.iconButton,
                backgroundColor:
                  selectedSession === session.key ? COLORS.accentPrimary : COLORS.bgSurface,
                boxShadow: selectedSession === session.key ? SHADOWS.panel : SHADOWS.card,
              }}
              onClick={() => onSelectSession(session.key)}
              title={session.label || session.key}
            >
              <span style={styles.iconEmoji}>{session.kind === "background" ? "##" : ">>"}</span>
            </button>
          ))
        )}
      </div>
    );
  }

  return (
    <aside style={styles.sidebarDesktop}>
      <div style={styles.header}>
        <h1 style={styles.title}>OPENCLAW HQ</h1>
        <p style={styles.subtitle}>8-BIT OFFICE</p>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <span style={styles.errorText}>ALERT: {error}</span>
        </div>
      )}

      <div style={styles.searchContainer}>
        <input
          ref={searchInputRef}
          type="text"
          style={styles.searchInput}
          placeholder="FIND SESSION (CMD+K)"
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
            X
          </button>
        )}
      </div>

      <div style={styles.sessionList}>
        {loading ? (
          <div style={styles.loadingPlaceholder}>
            <p style={styles.loadingText}>LOADING...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>{searchQuery ? "NO MATCHES" : "NO SESSIONS"}</p>
          </div>
        ) : (
          <>
            {activeSessions.length > 0 && (
              <div style={styles.sessionGroup}>
                <h3 style={styles.groupTitle}>
                  ACTIVE <span style={styles.groupCount}>{activeSessions.length}</span>
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
                  IDLE <span style={styles.groupCount}>{idleSessions.length}</span>
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
        backgroundColor: isSelected ? COLORS.accentPrimary : COLORS.bgSurface,
        color: isSelected ? COLORS.textPrimary : COLORS.textPrimary,
        boxShadow: isSelected ? SHADOWS.panel : SHADOWS.card,
      }}
      onClick={onSelect}
    >
      <div style={styles.sessionLabel}>
        <span style={styles.sessionIcon}>{session.kind === "background" ? "##" : ">>"}</span>
        <div style={styles.sessionContent}>
          <p style={styles.sessionName}>{session.label || session.key}</p>
          <p style={styles.sessionMeta}>
            {(session.status || "active").toUpperCase()} · {session.activeMinutes || 0}M
          </p>
        </div>
      </div>
      {isSelected && <div style={styles.selectedIndicator} />}
    </button>
  );
}

const styles = {
  sidebarDesktop: {
    width: "290px",
    height: "100vh",
    backgroundColor: COLORS.bgSidebar,
    borderRight: `3px solid ${COLORS.borderDefault}`,
    overflow: "hidden",
    overflowY: "auto" as const,
    display: "flex",
    flexDirection: "column" as const,
    boxShadow: SHADOWS.panel,
    paddingBottom: SPACING.md,
  } as React.CSSProperties,

  sidebarMobile: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: SPACING.md,
    width: "72px",
    minWidth: "72px",
    height: "100vh",
    backgroundColor: COLORS.bgSidebar,
    borderRight: `3px solid ${COLORS.borderDefault}`,
    padding: SPACING.md,
    overflow: "hidden",
    overflowY: "auto" as const,
    boxShadow: SHADOWS.panel,
  } as React.CSSProperties,

  header: {
    padding: SPACING.xl,
    textAlign: "left" as const,
    borderBottom: `3px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSurface,
  } as React.CSSProperties,

  title: {
    fontSize: TYPOGRAPHY.textLg,
    fontWeight: TYPOGRAPHY.weight600,
    color: COLORS.textPrimary,
    margin: 0,
    marginBottom: SPACING.xs,
    lineHeight: 1.4,
  } as React.CSSProperties,

  subtitle: {
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textSecondary,
    margin: 0,
    fontWeight: TYPOGRAPHY.weight500,
  } as React.CSSProperties,

  errorBanner: {
    backgroundColor: COLORS.statusError,
    padding: SPACING.md,
    margin: SPACING.md,
    border: `3px solid ${COLORS.borderDefault}`,
    boxShadow: SHADOWS.card,
  } as React.CSSProperties,

  errorText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.textXs,
    fontWeight: TYPOGRAPHY.weight600,
    lineHeight: 1.6,
  } as React.CSSProperties,

  sessionList: {
    flex: 1,
    overflow: "hidden",
    overflowY: "auto" as const,
    padding: SPACING.md,
  } as React.CSSProperties,

  sessionItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: SPACING.md,
    marginBottom: SPACING.md,
    border: `3px solid ${COLORS.borderDefault}`,
    cursor: "pointer",
    transition: `transform ${TRANSITIONS.fast}, box-shadow ${TRANSITIONS.fast}`,
    fontSize: TYPOGRAPHY.textSm,
    fontWeight: TYPOGRAPHY.weight500,
  } as React.CSSProperties,

  sessionLabel: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.md,
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,

  sessionIcon: {
    fontSize: TYPOGRAPHY.textSm,
    fontWeight: TYPOGRAPHY.weight600,
    color: COLORS.textSecondary,
    flexShrink: 0,
  } as React.CSSProperties,

  sessionContent: {
    textAlign: "left" as const,
    minWidth: 0,
  } as React.CSSProperties,

  sessionName: {
    margin: 0,
    fontSize: TYPOGRAPHY.textSm,
    fontWeight: TYPOGRAPHY.weight600,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  } as React.CSSProperties,

  sessionMeta: {
    margin: 0,
    fontSize: TYPOGRAPHY.textXs,
    opacity: 0.9,
    marginTop: "4px",
  } as React.CSSProperties,

  selectedIndicator: {
    width: "10px",
    height: "10px",
    backgroundColor: COLORS.unreadDot,
    border: `2px solid ${COLORS.borderDefault}`,
    flexShrink: 0,
    marginLeft: SPACING.sm,
  } as React.CSSProperties,

  loadingPlaceholder: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "120px",
  } as React.CSSProperties,

  loadingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.textSm,
    margin: 0,
    animation: "pixelPulse 1.2s steps(2, end) infinite",
  } as React.CSSProperties,

  emptyState: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "120px",
    border: `3px dashed ${COLORS.borderSubtle}`,
    backgroundColor: COLORS.bgSurface,
    boxShadow: SHADOWS.card,
  } as React.CSSProperties,

  emptyText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.textSm,
    margin: 0,
  } as React.CSSProperties,

  iconButton: {
    width: "48px",
    height: "48px",
    border: `3px solid ${COLORS.borderDefault}`,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: `transform ${TRANSITIONS.fast}, box-shadow ${TRANSITIONS.fast}`,
    fontSize: TYPOGRAPHY.textSm,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  iconEmoji: {
    display: "block",
    fontSize: TYPOGRAPHY.textSm,
    fontWeight: TYPOGRAPHY.weight600,
  } as React.CSSProperties,

  stripPlaceholder: {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: TYPOGRAPHY.textSm,
    color: COLORS.textSecondary,
    border: `3px dashed ${COLORS.borderSubtle}`,
    backgroundColor: COLORS.bgSurface,
  } as React.CSSProperties,

  searchContainer: {
    position: "relative" as const,
    padding: `${SPACING.md} ${SPACING.md} 0 ${SPACING.md}`,
  } as React.CSSProperties,

  searchInput: {
    width: "100%",
    padding: `${SPACING.md} ${SPACING.xl} ${SPACING.md} ${SPACING.md}`,
    border: `3px solid ${COLORS.borderDefault}`,
    fontSize: TYPOGRAPHY.textXs,
    fontFamily: TYPOGRAPHY.fontFamily,
    backgroundColor: COLORS.bgSurface,
    color: COLORS.textPrimary,
    boxShadow: SHADOWS.card,
  } as React.CSSProperties,

  clearButton: {
    position: "absolute" as const,
    right: `calc(${SPACING.md} + ${SPACING.sm})`,
    top: `calc(${SPACING.md} + ${SPACING.sm})`,
    width: "24px",
    height: "24px",
    backgroundColor: COLORS.bgPrimary,
    border: `2px solid ${COLORS.borderDefault}`,
    color: COLORS.textPrimary,
    cursor: "pointer",
    fontSize: TYPOGRAPHY.textXs,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: SHADOWS.card,
  } as React.CSSProperties,

  sessionGroup: {
    marginBottom: SPACING.lg,
  } as React.CSSProperties,

  groupTitle: {
    fontSize: TYPOGRAPHY.textXs,
    fontWeight: TYPOGRAPHY.weight600,
    color: COLORS.textSecondary,
    margin: 0,
    marginBottom: SPACING.md,
    display: "flex",
    alignItems: "center",
    gap: SPACING.sm,
  } as React.CSSProperties,

  groupCount: {
    fontSize: TYPOGRAPHY.textXs,
    backgroundColor: COLORS.bgSurface,
    color: COLORS.textPrimary,
    padding: `${SPACING.xs} ${SPACING.sm}`,
    border: `2px solid ${COLORS.borderDefault}`,
    boxShadow: SHADOWS.card,
  } as React.CSSProperties,
} as const;
