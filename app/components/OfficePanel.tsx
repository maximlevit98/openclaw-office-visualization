"use client";

import React from "react";
import { Agent } from "@/lib/types";
import { COLORS, TYPOGRAPHY, SPACING, TRANSITIONS, RADIUS, SHADOWS, getStatusColor, getAvatarColor } from "@/lib/design-tokens";

interface OfficePanelProps {
  agents: Agent[];
  loading: boolean;
  onAgentClick?: (agentId: string) => void;
}

export function OfficePanel({
  agents,
  loading,
  onAgentClick,
}: OfficePanelProps) {
  const onlineAgents = agents.filter((a) =>
    ["online", "busy"].includes(a.status || "")
  );
  const idleAgents = agents.filter((a) => a.status === "idle");
  const offlineAgents = agents.filter((a) => a.status === "offline");

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Agents</h2>
        <span style={styles.count}>{agents.length}</span>
      </div>

      {loading ? (
        <div style={styles.loadingState}>
          <p style={styles.loadingText}>Loading agents...</p>
        </div>
      ) : agents.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyIcon}>🤖</p>
          <p style={styles.emptyText}>No agents online</p>
        </div>
      ) : (
        <div style={styles.agentsContainer}>
          {/* Online Agents */}
          {onlineAgents.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                Online <span style={styles.badge}>{onlineAgents.length}</span>
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

          {/* Idle Agents */}
          {idleAgents.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                Idle <span style={styles.badge}>{idleAgents.length}</span>
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

          {/* Offline Agents */}
          {offlineAgents.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                Offline{" "}
                <span style={styles.badge}>{offlineAgents.length}</span>
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
            color: COLORS.bgPrimary,
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
            <span style={styles.statusText}>{agent.status || "unknown"}</span>
          </div>
        </div>
      </div>
      {agent.lastSeen && (
        <p style={styles.lastSeen}>
          {formatLastSeen(agent.lastSeen)}
        </p>
      )}
    </button>
  );
}

function formatLastSeen(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100vh",
    backgroundColor: COLORS.bgSurface,
    borderLeft: `1px solid ${COLORS.borderDefault}`,
    "@media (max-width: 1023px)": {
      height: "auto",
      borderLeft: "none",
      borderBottom: `1px solid ${COLORS.borderDefault}`,
    },
  } as React.CSSProperties,

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.lg,
    borderBottom: `1px solid ${COLORS.borderDefault}`,
    gap: SPACING.md,
  } as React.CSSProperties,

  title: {
    fontSize: TYPOGRAPHY.textLg,
    fontWeight: TYPOGRAPHY.weight600,
    margin: 0,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  count: {
    fontSize: TYPOGRAPHY.textSm,
    backgroundColor: COLORS.bgPrimary,
    color: COLORS.textSecondary,
    padding: `${SPACING.xs} ${SPACING.sm}`,
    borderRadius: RADIUS.full,
    fontWeight: TYPOGRAPHY.weight500,
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
    fontSize: TYPOGRAPHY.textSm,
    fontWeight: TYPOGRAPHY.weight600,
    color: COLORS.textSecondary,
    margin: 0,
    marginBottom: SPACING.sm,
    display: "flex",
    alignItems: "center",
    gap: SPACING.sm,
    textTransform: "capitalize" as const,
  } as React.CSSProperties,

  badge: {
    fontSize: TYPOGRAPHY.textXs,
    backgroundColor: COLORS.bgPrimary,
    color: COLORS.accentPrimary,
    padding: `${SPACING.xs} ${SPACING.sm}`,
    borderRadius: RADIUS.full,
    fontWeight: TYPOGRAPHY.weight600,
  } as React.CSSProperties,

  agentCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
    backgroundColor: COLORS.bgPrimary,
    border: `1px solid ${COLORS.borderSubtle}`,
    borderRadius: RADIUS.md,
    cursor: "pointer",
    transition: `all ${TRANSITIONS.normal}`,
    fontSize: TYPOGRAPHY.textSm,
    fontFamily: TYPOGRAPHY.fontFamily,
    gap: SPACING.md,
  } as React.CSSProperties,

  agentCardContent: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.md,
    flex: 1,
  } as React.CSSProperties,

  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: RADIUS.md,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: TYPOGRAPHY.weight600,
    fontSize: TYPOGRAPHY.textSm,
    flexShrink: 0,
  } as React.CSSProperties,

  agentInfo: {
    textAlign: "left" as const,
    minWidth: 0,
  } as React.CSSProperties,

  agentName: {
    margin: 0,
    fontSize: TYPOGRAPHY.textSm,
    fontWeight: TYPOGRAPHY.weight500,
    color: COLORS.textPrimary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  statusLine: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "4px",
  } as React.CSSProperties,

  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: RADIUS.full,
    flexShrink: 0,
  } as React.CSSProperties,

  statusText: {
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textTertiary,
    textTransform: "capitalize" as const,
  } as React.CSSProperties,

  lastSeen: {
    margin: 0,
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textTertiary,
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  } as React.CSSProperties,

  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  } as React.CSSProperties,

  emptyIcon: {
    fontSize: "48px",
    margin: 0,
  } as React.CSSProperties,

  emptyText: {
    fontSize: TYPOGRAPHY.textSm,
    color: COLORS.textTertiary,
    margin: 0,
    marginTop: SPACING.lg,
  } as React.CSSProperties,

  loadingState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  } as React.CSSProperties,

  loadingText: {
    color: COLORS.textTertiary,
    fontSize: TYPOGRAPHY.textSm,
    margin: 0,
    animation: "pulse 1.5s ease-in-out infinite",
  } as React.CSSProperties,
} as const;
