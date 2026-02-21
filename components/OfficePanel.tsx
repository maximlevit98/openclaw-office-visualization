"use client";

import { useState } from "react";
import { Agent } from "@/lib/types";
import { COLORS, RADIUS, SPACING, SHADOWS, TRANSITIONS, getStatusColor, getStatusLabel, getAvatarColor } from "@/lib/design-tokens";

interface OfficePanelProps {
  agents: Agent[];
  loading: boolean;
  onAgentClick?: (agentId: string) => void;
}

export function OfficePanel({ agents, loading, onAgentClick }: OfficePanelProps) {
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);

  // Desktop: Vertical card stack; Tablet: Horizontal avatar strip
  return (
    <>
      {/* Desktop Panel (300px right column) */}
      <section style={styles.panelDesktop} className="office-panel-desktop">
        <div style={styles.header}>
          <h2 style={styles.title}>The Bullpen</h2>
        </div>

        <div style={styles.cardGrid}>
          {loading ? (
            <p style={styles.loadingText}>Loading agents…</p>
          ) : agents.length === 0 ? (
            <p style={styles.emptyText}>No agents available</p>
          ) : (
            agents.map((agent) => {
              const isHovered = hoveredAgentId === agent.id;
              const statusColor = getStatusColor(agent.status);
              const statusLabel = getStatusLabel(agent.status);
              const avatarColor = getAvatarColor(agent.name || agent.id);
              const isOffline = agent.status?.toLowerCase() === "offline";
              const isError = agent.status?.toLowerCase() === "error";
              const isThinking = agent.status?.toLowerCase() === "thinking";

              return (
                <div
                  key={agent.id}
                  onClick={() => onAgentClick?.(agent.id)}
                  onMouseEnter={() => setHoveredAgentId(agent.id)}
                  onMouseLeave={() => setHoveredAgentId(null)}
                  style={{
                    ...styles.card,
                    ...(isHovered ? styles.cardHover : {}),
                    ...(isOffline ? styles.cardOffline : {}),
                    ...(isError ? styles.cardError : {}),
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      ...styles.avatar,
                      backgroundColor: avatarColor,
                    }}
                  >
                    <span style={styles.avatarInitial}>
                      {(agent.name || agent.id).charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Text Content */}
                  <div style={styles.cardContent}>
                    <h3 style={styles.agentName}>{agent.name || agent.id}</h3>
                    <p style={styles.agentRole}>{agent.id}</p>

                    {/* Status Badge */}
                    <div style={styles.statusBadge}>
                      <div
                        style={{
                          ...styles.statusDot,
                          backgroundColor: statusColor,
                          ...(isThinking ? { animation: "pulse 2s infinite" } : {}),
                        }}
                      />
                      <span style={{ ...styles.statusText, color: statusColor }}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  {/* Card Border for thinking/error states */}
                  {(isThinking || isError) && (
                    <div
                      style={{
                        ...styles.cardBorderGlow,
                        borderColor: statusColor,
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Tablet Status Strip (52px top bar) */}
      <div style={styles.statusStrip} className="office-strip-tablet">
        {!loading && agents.length > 0 ? (
          agents.map((agent) => {
            const statusColor = getStatusColor(agent.status);
            const avatarColor = getAvatarColor(agent.name || agent.id);
            const isOffline = agent.status?.toLowerCase() === "offline";

            return (
              <div
                key={agent.id}
                onClick={() => onAgentClick?.(agent.id)}
                style={{
                  ...styles.stripItem,
                  ...(isOffline ? styles.stripItemOffline : {}),
                }}
                title={`${agent.name || agent.id} · ${getStatusLabel(agent.status)}`}
              >
                <div
                  style={{
                    ...styles.stripAvatar,
                    backgroundColor: avatarColor,
                  }}
                >
                  <span style={styles.stripAvatarText}>
                    {(agent.name || agent.id).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div
                  style={{
                    ...styles.stripStatusDot,
                    backgroundColor: statusColor,
                  }}
                />
              </div>
            );
          })
        ) : (
          <p style={styles.stripEmpty}>No agents</p>
        )}
      </div>
    </>
  );
}

const styles = {
  panelDesktop: {
    display: "flex",
    flexDirection: "column" as const,
    width: "300px",
    height: "100vh",
    backgroundColor: COLORS.bgPrimary,
    borderLeft: `1px solid ${COLORS.borderDefault}`,
    overflow: "hidden" as const,

    "@media (max-width: 1023px)": {
      display: "none",
    },
  } as React.CSSProperties,

  header: {
    padding: SPACING.xl,
    borderBottom: `1px solid ${COLORS.borderDefault}`,
  } as React.CSSProperties,

  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "600",
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  cardGrid: {
    flex: 1,
    overflowY: "auto" as const,
    padding: SPACING.lg,
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: SPACING.md,
  } as React.CSSProperties,

  card: {
    display: "grid",
    gridTemplateColumns: "48px 1fr",
    gap: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.bgSurface,
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: RADIUS.md,
    cursor: "pointer",
    transition: `all ${TRANSITIONS.fast}`,
    boxShadow: SHADOWS.card,
    position: "relative" as const,
  } as React.CSSProperties,

  cardHover: {
    boxShadow: SHADOWS.hover,
    transform: "translateY(-1px)",
  } as React.CSSProperties,

  cardOffline: {
    opacity: 0.6,
  } as React.CSSProperties,

  cardError: {
    opacity: 0.95,
  } as React.CSSProperties,

  cardBorderGlow: {
    position: "absolute" as const,
    inset: 0,
    borderRadius: RADIUS.md,
    border: `1px solid`,
    pointerEvents: "none" as const,
    opacity: 0.3,
  } as React.CSSProperties,

  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: RADIUS.full,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as React.CSSProperties,

  avatarInitial: {
    fontSize: "18px",
    fontWeight: "600",
    color: COLORS.bgSurface,
  } as React.CSSProperties,

  cardContent: {
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    gap: "2px",
  } as React.CSSProperties,

  agentName: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  agentRole: {
    margin: 0,
    fontSize: "14px",
    color: COLORS.textSecondary,
  } as React.CSSProperties,

  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  } as React.CSSProperties,

  statusDot: {
    width: "10px",
    height: "10px",
    borderRadius: RADIUS.full,
    flexShrink: 0,
  } as React.CSSProperties,

  statusText: {
    fontSize: "12px",
    fontWeight: "500",
  } as React.CSSProperties,

  statusStrip: {
    display: "none",
    width: "100%",
    height: "52px",
    backgroundColor: COLORS.bgSidebar,
    borderBottom: `1px solid ${COLORS.borderDefault}`,
    padding: `${SPACING.md} ${SPACING.lg}`,
    overflowX: "auto" as const,
    flexDirection: "row" as const,
    gap: SPACING.md,
    alignItems: "center",

    "@media (max-width: 1023px) and (min-width: 768px)": {
      display: "flex",
    },
  } as React.CSSProperties,

  stripItem: {
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: `all ${TRANSITIONS.fast}`,
    flexShrink: 0,
  } as React.CSSProperties,

  stripItemOffline: {
    opacity: 0.5,
  } as React.CSSProperties,

  stripAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: RADIUS.full,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as React.CSSProperties,

  stripAvatarText: {
    fontSize: "14px",
    fontWeight: "600",
    color: COLORS.bgSurface,
  } as React.CSSProperties,

  stripStatusDot: {
    position: "absolute" as const,
    bottom: "-2px",
    right: "-2px",
    width: "12px",
    height: "12px",
    borderRadius: RADIUS.full,
    border: `2px solid ${COLORS.bgSidebar}`,
  } as React.CSSProperties,

  loadingText: {
    fontSize: "14px",
    color: COLORS.textTertiary,
    margin: 0,
    textAlign: "center" as const,
    gridColumn: "1 / -1",
  } as React.CSSProperties,

  emptyText: {
    fontSize: "14px",
    color: COLORS.textTertiary,
    margin: 0,
    textAlign: "center" as const,
    gridColumn: "1 / -1",
  } as React.CSSProperties,

  stripEmpty: {
    fontSize: "12px",
    color: COLORS.textTertiary,
    margin: 0,
  } as React.CSSProperties,
} as const;
