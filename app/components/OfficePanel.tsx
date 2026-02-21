"use client";

import React from "react";
import { Agent } from "@/lib/types";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  TRANSITIONS,
  SHADOWS,
  getStatusColor,
  getAvatarColor,
} from "@/lib/design-tokens";

interface OfficePanelProps {
  agents: Agent[];
  loading: boolean;
  onAgentClick?: (agentId: string) => void;
}

export function OfficePanel({ agents, loading, onAgentClick }: OfficePanelProps) {
  const onlineAgents = agents.filter((a) => ["online", "busy", "active"].includes(a.status || ""));
  const idleAgents = agents.filter((a) => a.status === "idle");
  const offlineAgents = agents.filter((a) => a.status === "offline");

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>AGENT FLOOR</h2>
        <span style={styles.count}>{agents.length}</span>
      </div>

      {loading ? (
        <div style={styles.loadingState}>
          <p style={styles.loadingText}>SPAWNING AGENTS...</p>
        </div>
      ) : agents.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyIcon}>NO UNITS ONLINE</p>
        </div>
      ) : (
        <div style={styles.agentsContainer}>
          {onlineAgents.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                ONLINE <span style={styles.badge}>{onlineAgents.length}</span>
              </h3>
              {onlineAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onClick={() => onAgentClick?.(agent.id)}
                />
              ))}
            </div>
          )}

          {idleAgents.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                IDLE <span style={styles.badge}>{idleAgents.length}</span>
              </h3>
              {idleAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onClick={() => onAgentClick?.(agent.id)}
                />
              ))}
            </div>
          )}

          {offlineAgents.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                OFFLINE <span style={styles.badge}>{offlineAgents.length}</span>
              </h3>
              {offlineAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onClick={() => onAgentClick?.(agent.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

function AgentCard({ agent, onClick }: AgentCardProps) {
  const statusColor = getStatusColor(agent.status);
  const avatarColor = getAvatarColor(agent.name);
  const initials = (agent.name || agent.id)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <button
      style={styles.agentCard}
      onClick={onClick}
      title={`${agent.name || agent.id} - ${agent.status || "unknown"}`}
    >
      <div style={styles.agentCardContent}>
        <div
          style={{
            ...styles.avatar,
            backgroundColor: avatarColor,
            color: COLORS.textPrimary,
          }}
        >
          {initials}
        </div>
        <div style={styles.agentInfo}>
          <p style={styles.agentName}>{agent.name || agent.id}</p>
          <div style={styles.statusLine}>
            <span
              style={{
                ...styles.statusDot,
                backgroundColor: statusColor,
              }}
            />
            <span style={styles.statusText}>{(agent.status || "unknown").toUpperCase()}</span>
          </div>
        </div>
      </div>
      {agent.lastSeen && <p style={styles.lastSeen}>{formatLastSeen(agent.lastSeen)}</p>}
    </button>
  );
}

function formatLastSeen(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "NOW";
  if (minutes < 60) return `${minutes}M AGO`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}H AGO`;

  const days = Math.floor(hours / 24);
  return `${days}D AGO`;
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100vh",
    backgroundColor: COLORS.bgSidebar,
    borderLeft: `3px solid ${COLORS.borderDefault}`,
    boxShadow: SHADOWS.panel,
  } as React.CSSProperties,

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.lg,
    borderBottom: `3px solid ${COLORS.borderDefault}`,
    gap: SPACING.md,
    backgroundColor: COLORS.bgSurface,
  } as React.CSSProperties,

  title: {
    fontSize: TYPOGRAPHY.textSm,
    fontWeight: TYPOGRAPHY.weight600,
    margin: 0,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  count: {
    fontSize: TYPOGRAPHY.textXs,
    backgroundColor: COLORS.accentPrimary,
    color: COLORS.textPrimary,
    padding: `${SPACING.xs} ${SPACING.sm}`,
    border: `2px solid ${COLORS.borderDefault}`,
    fontWeight: TYPOGRAPHY.weight600,
    boxShadow: SHADOWS.card,
  } as React.CSSProperties,

  agentsContainer: {
    flex: 1,
    overflow: "hidden",
    overflowY: "auto" as const,
    padding: SPACING.lg,
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.xl,
  } as React.CSSProperties,

  section: {
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.md,
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: TYPOGRAPHY.textXs,
    fontWeight: TYPOGRAPHY.weight600,
    color: COLORS.textSecondary,
    margin: 0,
    marginBottom: SPACING.sm,
    display: "flex",
    alignItems: "center",
    gap: SPACING.sm,
  } as React.CSSProperties,

  badge: {
    fontSize: TYPOGRAPHY.textXs,
    backgroundColor: COLORS.bgSurface,
    color: COLORS.textPrimary,
    padding: `${SPACING.xs} ${SPACING.sm}`,
    border: `2px solid ${COLORS.borderDefault}`,
    fontWeight: TYPOGRAPHY.weight600,
    boxShadow: SHADOWS.card,
  } as React.CSSProperties,

  agentCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
    backgroundColor: COLORS.bgSurface,
    border: `3px solid ${COLORS.borderDefault}`,
    cursor: "pointer",
    transition: `transform ${TRANSITIONS.normal}, box-shadow ${TRANSITIONS.normal}`,
    fontSize: TYPOGRAPHY.textSm,
    fontFamily: TYPOGRAPHY.fontFamily,
    gap: SPACING.md,
    boxShadow: SHADOWS.card,
    color: COLORS.textPrimary,
    textAlign: "left" as const,
  } as React.CSSProperties,

  agentCardContent: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.md,
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,

  avatar: {
    width: "40px",
    height: "40px",
    border: `2px solid ${COLORS.borderDefault}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: TYPOGRAPHY.weight600,
    fontSize: TYPOGRAPHY.textXs,
    flexShrink: 0,
    boxShadow: SHADOWS.card,
  } as React.CSSProperties,

  agentInfo: {
    textAlign: "left" as const,
    minWidth: 0,
  } as React.CSSProperties,

  agentName: {
    margin: 0,
    fontSize: TYPOGRAPHY.textSm,
    fontWeight: TYPOGRAPHY.weight600,
    color: COLORS.textPrimary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  statusLine: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "6px",
  } as React.CSSProperties,

  statusDot: {
    width: "9px",
    height: "9px",
    border: `1px solid ${COLORS.borderDefault}`,
    flexShrink: 0,
  } as React.CSSProperties,

  statusText: {
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textSecondary,
  } as React.CSSProperties,

  lastSeen: {
    margin: 0,
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textSecondary,
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  } as React.CSSProperties,

  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    border: `3px dashed ${COLORS.borderSubtle}`,
    margin: SPACING.lg,
    backgroundColor: COLORS.bgSurface,
    boxShadow: SHADOWS.card,
  } as React.CSSProperties,

  emptyIcon: {
    fontSize: TYPOGRAPHY.textSm,
    margin: 0,
    color: COLORS.textSecondary,
  } as React.CSSProperties,

  loadingState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  } as React.CSSProperties,

  loadingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.textSm,
    margin: 0,
    animation: "pixelPulse 1.3s steps(2, end) infinite",
  } as React.CSSProperties,
} as const;
