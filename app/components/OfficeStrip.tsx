"use client";

import React from "react";
import { Agent } from "@/lib/types";
import { COLORS, TYPOGRAPHY, SPACING, TRANSITIONS, RADIUS, getStatusColor, getAvatarColor } from "@/lib/design-tokens";

interface OfficeStripProps {
  agents: Agent[];
  loading: boolean;
  onAgentClick?: (agentId: string) => void;
}

/**
 * Horizontal office strip for tablet/responsive layouts
 * Shows agents as a horizontal scrollable list of compact cards
 */
export function OfficeStrip({
  agents,
  loading,
  onAgentClick,
}: OfficeStripProps) {
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.skeleton} />
        <div style={styles.skeleton} />
        <div style={styles.skeleton} />
      </div>
    );
  }

  const onlineAgents = agents.filter((a) =>
    ["online", "busy"].includes(a.status || "")
  );

  return (
    <div style={styles.container}>
      <span style={styles.label}>Agents:</span>
      {onlineAgents.length === 0 ? (
        <span style={styles.noAgents}>No agents online</span>
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
    <button
      style={styles.agentItem}
      onClick={onClick}
      title={agent.name || agent.id}
    >
      <div
        style={{
          ...styles.avatar,
          backgroundColor: avatarColor,
        }}
      >
        <span
          style={{
            position: "relative",
            zIndex: 1,
            color: COLORS.bgPrimary,
            fontSize: TYPOGRAPHY.textXs,
            fontWeight: TYPOGRAPHY.weight600,
          }}
        >
          {initials}
        </span>
        <div
          style={{
            position: "absolute",
            bottom: "-2px",
            right: "-2px",
            width: "8px",
            height: "8px",
            borderRadius: RADIUS.full,
            backgroundColor: statusColor,
            border: `2px solid ${COLORS.bgSurface}`,
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
    borderBottom: `1px solid ${COLORS.borderDefault}`,
    overflow: "hidden",
    overflowX: "auto" as const,
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  label: {
    fontSize: TYPOGRAPHY.textSm,
    fontWeight: TYPOGRAPHY.weight600,
    color: COLORS.textSecondary,
    flexShrink: 0,
  } as React.CSSProperties,

  noAgents: {
    fontSize: TYPOGRAPHY.textSm,
    color: COLORS.textTertiary,
  } as React.CSSProperties,

  agentItem: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.sm,
    padding: `${SPACING.sm} ${SPACING.md}`,
    backgroundColor: COLORS.bgPrimary,
    border: `1px solid ${COLORS.borderSubtle}`,
    borderRadius: RADIUS.md,
    cursor: "pointer",
    transition: `all ${TRANSITIONS.fast}`,
    fontSize: TYPOGRAPHY.textSm,
    fontFamily: TYPOGRAPHY.fontFamily,
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  } as React.CSSProperties,

  avatar: {
    position: "relative",
    width: "28px",
    height: "28px",
    borderRadius: RADIUS.sm,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: TYPOGRAPHY.weight600,
    fontSize: TYPOGRAPHY.textXs,
    flexShrink: 0,
    color: COLORS.bgPrimary,
  } as React.CSSProperties,

  agentLabel: {
    fontSize: TYPOGRAPHY.textSm,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  skeleton: {
    width: "120px",
    height: "36px",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.borderSubtle,
    animation: "pulse 1.5s ease-in-out infinite",
    flexShrink: 0,
  } as React.CSSProperties,
} as const;
