"use client";

import { useState } from "react";
import { Session } from "@/lib/types";
import { SessionList } from "./SessionList";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, BREAKPOINTS } from "@/lib/design-tokens";

interface SidebarProps {
  sessions: Session[];
  selectedSession: string | null;
  onSelectSession: (key: string) => void;
  loading: boolean;
  error: string | null;
}

export function Sidebar({
  sessions,
  selectedSession,
  onSelectSession,
  loading,
  error,
}: SidebarProps) {
  const [isTabletExpanded, setIsTabletExpanded] = useState(false);
  const [filterText, setFilterText] = useState("");

  // Filter sessions by label or key
  const filteredSessions = filterText.trim()
    ? sessions.filter((s) =>
        (s.label || s.key)
          .toLowerCase()
          .includes(filterText.toLowerCase())
      )
    : sessions;

  return (
    <>
      {/* Desktop sidebar (fixed 280px) */}
      <aside 
        style={styles.sidebarDesktop}
        data-sidebar
        className="sidebar-desktop"
      >
        <div style={styles.header}>
          <h1 style={styles.logo}>OpenClaw</h1>
          <p style={styles.subtitle}>Office</p>
        </div>

        <div style={styles.filterContainer}>
          <input
            type="text"
            placeholder="Filter sessions…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={styles.filterInput}
            aria-label="Filter sessions"
          />
          {filterText && (
            <button
              onClick={() => setFilterText("")}
              style={styles.filterClear}
              aria-label="Clear filter"
              title="Clear"
            >
              ✕
            </button>
          )}
        </div>

        <nav style={styles.nav}>
          <h3 style={styles.sectionTitle}>Sessions</h3>
          <SessionList
            sessions={filteredSessions}
            selectedSession={selectedSession}
            onSelectSession={onSelectSession}
            loading={loading}
          />
        </nav>

        {error && (
          <div style={styles.errorBanner}>
            <p style={styles.errorText}>⚠️ Error</p>
            <p style={styles.errorSub}>{error}</p>
          </div>
        )}
      </aside>

      {/* Tablet icon strip + overlay (64px) */}
      <div
        style={{
          ...styles.sidebarTablet,
          display: `var(--tablet-display, none)`,
        }}
        className="sidebar-tablet"
      >
        <div style={styles.iconStrip}>
          {sessions.slice(0, 6).map((session) => (
            <div
              key={session.key}
              style={{
                ...styles.iconItem,
                ...(selectedSession === session.key ? styles.iconItemSelected : {}),
              }}
              onClick={() => {
                onSelectSession(session.key);
                setIsTabletExpanded(false);
              }}
              title={session.label}
            >
              <div style={styles.avatarInitial}>
                {session.label?.charAt(0).toUpperCase() || "•"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tablet sidebar overlay modal */}
      {isTabletExpanded && (
        <div
          style={styles.sidebarOverlayBackdrop}
          onClick={() => setIsTabletExpanded(false)}
        >
          <aside
            style={styles.sidebarOverlay}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.header}>
              <h1 style={styles.logoOverlay}>OpenClaw Office</h1>
              <button
                onClick={() => setIsTabletExpanded(false)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div style={styles.filterContainer}>
              <input
                type="text"
                placeholder="Filter sessions…"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                style={styles.filterInput}
                aria-label="Filter sessions"
              />
              {filterText && (
                <button
                  onClick={() => setFilterText("")}
                  style={styles.filterClear}
                  aria-label="Clear filter"
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </div>

            <nav style={styles.nav}>
              <h3 style={styles.sectionTitle}>Sessions</h3>
              <SessionList
                sessions={filteredSessions}
                selectedSession={selectedSession}
                onSelectSession={(key) => {
                  onSelectSession(key);
                  setIsTabletExpanded(false);
                }}
                loading={loading}
              />
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}

const styles = {
  sidebarDesktop: {
    width: "280px",
    height: "100vh",
    backgroundColor: COLORS.bgSidebar,
    color: COLORS.textPrimary,
    overflowY: "auto" as const,
    borderRight: `1px solid ${COLORS.borderDefault}`,
    display: "flex",
    flexDirection: "column" as const,
    
    // Hide on tablet and mobile
    "@media (max-width: 1023px)": {
      display: "none",
    },
  } as React.CSSProperties,

  sidebarTablet: {
    width: "64px",
    height: "100vh",
    backgroundColor: COLORS.bgSidebar,
    borderRight: `1px solid ${COLORS.borderDefault}`,
    display: "none",
    flexDirection: "column" as const,
    overflowY: "auto" as const,
    
    // Show on tablet only
    "@media (max-width: 1023px) and (min-width: 768px)": {
      display: "flex",
    },
  } as React.CSSProperties,

  iconStrip: {
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.sm,
    padding: SPACING.sm,
  } as React.CSSProperties,

  iconItem: {
    width: "56px",
    height: "56px",
    margin: "0 auto",
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: "transparent",
    border: `2px solid transparent`,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: `all 150ms ease-out`,
  } as React.CSSProperties,

  iconItemSelected: {
    backgroundColor: COLORS.bgSurface,
    borderColor: COLORS.accentPrimary,
    boxShadow: `0 2px 8px rgba(196, 90, 44, 0.15)`,
  } as React.CSSProperties,

  avatarInitial: {
    width: "48px",
    height: "48px",
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.statusIdle,
    color: COLORS.bgSurface,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "600",
  } as React.CSSProperties,

  sidebarOverlayBackdrop: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(26, 24, 22, 0.5)",
    zIndex: 99,
    display: "flex",
  } as React.CSSProperties,

  sidebarOverlay: {
    width: "280px",
    height: "100vh",
    backgroundColor: COLORS.bgSidebar,
    color: COLORS.textPrimary,
    overflowY: "auto" as const,
    display: "flex",
    flexDirection: "column" as const,
    animation: "slideInLeft 200ms ease-out",
  } as React.CSSProperties,

  header: {
    padding: SPACING.lg,
    borderBottom: `1px solid ${COLORS.borderDefault}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  } as React.CSSProperties,

  logo: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  logoOverlay: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
    color: COLORS.textPrimary,
    flex: 1,
  } as React.CSSProperties,

  subtitle: {
    margin: "4px 0 0 0",
    fontSize: "12px",
    color: COLORS.textSecondary,
  } as React.CSSProperties,

  closeButton: {
    background: "none",
    border: "none",
    fontSize: "20px",
    color: COLORS.textSecondary,
    cursor: "pointer",
    padding: 0,
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: `color ${COLORS.borderDefault}`,
  } as React.CSSProperties,

  nav: {
    flex: 1,
    padding: `${SPACING.lg} ${SPACING.md}`,
    overflowY: "auto" as const,
  } as React.CSSProperties,

  sectionTitle: {
    margin: `0 0 ${SPACING.md} 0`,
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    color: COLORS.textTertiary,
    letterSpacing: "0.05em",
  } as React.CSSProperties,

  errorBanner: {
    padding: SPACING.lg,
    backgroundColor: COLORS.statusError,
    borderTop: `1px solid ${COLORS.borderDefault}`,
    marginTop: "auto",
  } as React.CSSProperties,

  errorText: {
    margin: `0 0 ${SPACING.sm} 0`,
    fontSize: "14px",
    color: COLORS.bgSurface,
    fontWeight: "600",
  } as React.CSSProperties,

  errorSub: {
    margin: 0,
    fontSize: "12px",
    color: COLORS.bgSurface,
    opacity: 0.9,
  } as React.CSSProperties,

  filterContainer: {
    position: "relative" as const,
    padding: `${SPACING.md} ${SPACING.md}`,
    borderBottom: `1px solid ${COLORS.borderDefault}`,
    display: "flex",
    alignItems: "center",
    gap: SPACING.sm,
  } as React.CSSProperties,

  filterInput: {
    flex: 1,
    padding: `${SPACING.sm} ${SPACING.md}`,
    backgroundColor: COLORS.bgSurface,
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: RADIUS.sm,
    fontSize: "14px",
    color: COLORS.textPrimary,
    transition: `all 150ms ease-out`,
    fontFamily: "inherit",
  } as React.CSSProperties,

  filterClear: {
    width: "28px",
    height: "28px",
    padding: 0,
    backgroundColor: "transparent",
    border: "none",
    borderRadius: RADIUS.sm,
    fontSize: "14px",
    color: COLORS.textTertiary,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: `all 150ms ease-out`,
  } as React.CSSProperties,
} as const;
