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

interface OfficeStripProps {
  agents: Agent[];
  loading: boolean;
  onAgentClick?: (agentId: string) => void;
}

/**
 * Compact strip for tablet layouts.
 */
export function OfficeStrip({ agents, loading, onAgentClick }: OfficeStripProps) {
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.skeleton} />
        <div style={styles.skeleton} />
        <div style={styles.skeleton} />
      </div>
    );
  }

  const onlineAgents = agents.filter((a) => ["online", "busy", "active"].includes(a.status || ""));

  return (
    <div style={styles.container}>
      <span style={styles.label}>UNITS:</span>
      {onlineAgents.length === 0 ? (
        <span style={styles.noAgents}>NONE ONLINE</span>
      ) : (
        onlineAgents.map((agent) => (
          <AgentStripItem
            key={agent.id}
            agent={agent}
            onClick={() => onAgentClick?.(agent.id)}
          />
        ))
      )}
    </div>
  );
}

interface AgentStripItemProps {
  agent: Agent;
  onClick?: () => void;
}

function AgentStripItem({ agent, onClick }: AgentStripItemProps) {
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
    <button style={styles.agentItem} onClick={onClick} title={agent.name || agent.id}>
      <div
        style={{
          ...styles.avatar,
          backgroundColor: avatarColor,
        }}
      >
        <span style={styles.avatarLabel}>{initials}</span>
        <div
          style={{
            ...styles.statusDot,
            backgroundColor: statusColor,
          }}
        />
      </div>
      <span style={styles.agentLabel}>{agent.name || agent.id}</span>
    </button>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.md,
    padding: `${SPACING.md} ${SPACING.lg}`,
    backgroundColor: COLORS.bgSurface,
    borderBottom: `3px solid ${COLORS.borderDefault}`,
    overflow: "hidden",
    overflowX: "auto" as const,
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  label: {
    fontSize: TYPOGRAPHY.textXs,
    fontWeight: TYPOGRAPHY.weight600,
    color: COLORS.textSecondary,
    flexShrink: 0,
  } as React.CSSProperties,

  noAgents: {
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textTertiary,
  } as React.CSSProperties,

  agentItem: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.sm,
    padding: `${SPACING.sm} ${SPACING.md}`,
    backgroundColor: COLORS.bgPrimary,
    border: `3px solid ${COLORS.borderDefault}`,
    cursor: "pointer",
    transition: `transform ${TRANSITIONS.fast}, box-shadow ${TRANSITIONS.fast}`,
    fontSize: TYPOGRAPHY.textXs,
    fontFamily: TYPOGRAPHY.fontFamily,
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
    boxShadow: SHADOWS.card,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  avatar: {
    position: "relative" as const,
    width: "28px",
    height: "28px",
    border: `2px solid ${COLORS.borderDefault}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: TYPOGRAPHY.weight600,
    fontSize: TYPOGRAPHY.textXs,
    flexShrink: 0,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  avatarLabel: {
    position: "relative" as const,
    zIndex: 1,
    color: COLORS.textPrimary,
    fontSize: "9px",
    fontWeight: TYPOGRAPHY.weight600,
  } as React.CSSProperties,

  statusDot: {
    position: "absolute" as const,
    bottom: "-4px",
    right: "-4px",
    width: "10px",
    height: "10px",
    border: `2px solid ${COLORS.borderDefault}`,
  } as React.CSSProperties,

  agentLabel: {
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  skeleton: {
    width: "120px",
    height: "34px",
    border: `3px solid ${COLORS.borderSubtle}`,
    backgroundColor: COLORS.bgPrimary,
    animation: "pixelPulse 1.4s steps(2, end) infinite",
    flexShrink: 0,
  } as React.CSSProperties,
} as const;
