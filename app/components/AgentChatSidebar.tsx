"use client";

import React, { useMemo, useState } from "react";
import { Agent, Session } from "@/lib/types";
import {
  COLORS,
  SHADOWS,
  SPACING,
  TRANSITIONS,
  TYPOGRAPHY,
  getStatusColor,
  getAvatarColor,
} from "@/lib/design-tokens";
import { findSessionForAgent, toSearchIndex } from "@/lib/session-mapping";
import { Locale, getLocaleButtonLabel, getStatusLabel } from "@/lib/i18n";

interface AgentChatSidebarProps {
  agents: Agent[];
  sessions: Session[];
  selectedSession: string | null;
  onSelectSession: (sessionKey: string) => void;
  loading: boolean;
  error: string | null;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

interface AgentSessionRow {
  agent: Agent;
  session?: Session;
}

const STATUS_RANK: Record<string, number> = {
  online: 0,
  busy: 1,
  idle: 2,
  offline: 3,
};

const TEXT = {
  en: {
    title: "AGENT CHATS",
    alert: "ALERT",
    search: "SEARCH AGENT (CMD+K)",
    linking: "LINKING CHANNELS...",
    noAgents: "NO AGENTS FOUND",
    noSession: "NO CHAT SESSION",
    openChat: (name: string) => `Open ${name} chat`,
    unmapped: (name: string) => `${name}: no mapped session`,
    language: "LANG",
  },
  ru: {
    title: "ЧАТЫ АГЕНТОВ",
    alert: "АЛЕРТ",
    search: "ПОИСК АГЕНТА (CMD+K)",
    linking: "ПОДКЛЮЧАЮ КАНАЛЫ...",
    noAgents: "АГЕНТЫ НЕ НАЙДЕНЫ",
    noSession: "НЕТ ЧАТ-СЕССИИ",
    openChat: (name: string) => `Открыть чат ${name}`,
    unmapped: (name: string) => `${name}: сессия не найдена`,
    language: "ЯЗЫК",
  },
} as const;

export function AgentChatSidebar({
  agents,
  sessions,
  selectedSession,
  onSelectSession,
  loading,
  error,
  searchInputRef,
  locale,
  onLocaleChange,
}: AgentChatSidebarProps) {
  const [query, setQuery] = useState("");
  const t = TEXT[locale];

  const rows = useMemo((): AgentSessionRow[] => {
    const normalizedQuery = toSearchIndex(query);
    const mapped = agents.map((agent) => ({
      agent,
      session: findSessionForAgent(agent, sessions),
    }));

    const filtered = normalizedQuery
      ? mapped.filter(({ agent, session }) =>
          toSearchIndex(
            agent.id,
            agent.name,
            agent.kind,
            session?.key,
            session?.label,
            session?.kind
          ).includes(normalizedQuery)
        )
      : mapped;

    return filtered.sort((a, b) => {
      const aRank = STATUS_RANK[a.agent.status || "offline"] ?? 99;
      const bRank = STATUS_RANK[b.agent.status || "offline"] ?? 99;
      if (aRank !== bRank) return aRank - bRank;

      const aName = a.agent.name || a.agent.id;
      const bName = b.agent.name || b.agent.id;
      return aName.localeCompare(bName);
    });
  }, [agents, sessions, query]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{t.title}</h2>
        <div style={styles.headerControls}>
          <div style={styles.langWrap}>
            <span style={styles.langLabel}>{t.language}</span>
            <div style={styles.langButtons}>
              <button
                type="button"
                style={{
                  ...styles.langButton,
                  ...(locale === "en" ? styles.langButtonActive : null),
                }}
                onClick={() => onLocaleChange("en")}
              >
                {getLocaleButtonLabel("en")}
              </button>
              <button
                type="button"
                style={{
                  ...styles.langButton,
                  ...(locale === "ru" ? styles.langButtonActive : null),
                }}
                onClick={() => onLocaleChange("ru")}
              >
                {getLocaleButtonLabel("ru")}
              </button>
            </div>
          </div>
          <span style={styles.counter}>{rows.length}</span>
        </div>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          {t.alert}: {error}
        </div>
      )}

      <div style={styles.searchWrap}>
        <input
          ref={searchInputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.search}
          aria-label={t.search}
          style={styles.searchInput}
        />
      </div>

      <div style={styles.list}>
        {loading ? (
          <p style={styles.placeholder}>{t.linking}</p>
        ) : rows.length === 0 ? (
          <p style={styles.placeholder}>{t.noAgents}</p>
        ) : (
          rows.map(({ agent, session }) => {
            const isSelected = session?.key === selectedSession;
            const statusColor = getStatusColor(agent.status);
            const avatarColor = getAvatarColor(agent.name || agent.id);
            const isDisabled = !session;
            const agentName = agent.name || agent.id;

            return (
              <button
                key={agent.id}
                type="button"
                disabled={isDisabled}
                onClick={() => session && onSelectSession(session.key)}
                style={{
                  ...styles.row,
                  ...(isSelected ? styles.rowSelected : null),
                  ...(isDisabled ? styles.rowDisabled : null),
                }}
                title={session ? t.openChat(agentName) : t.unmapped(agentName)}
              >
                <div style={styles.rowLeft}>
                  <div style={{ ...styles.avatar, backgroundColor: avatarColor }}>
                    {getInitials(agentName)}
                  </div>
                  <div style={styles.rowMeta}>
                    <p style={styles.agentName}>{agentName}</p>
                    <p style={styles.sessionName}>
                      {session?.label || session?.key || t.noSession}
                    </p>
                  </div>
                </div>
                <div style={styles.rowRight}>
                  <span style={{ ...styles.statusDot, backgroundColor: statusColor }} />
                  <span style={styles.statusText}>{getStatusLabel(agent.status, locale)}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function getInitials(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const styles = {
  container: {
    borderBottom: `3px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSidebar,
    boxShadow: SHADOWS.panel,
    display: "flex",
    flexDirection: "column" as const,
    minHeight: "260px",
    maxHeight: "330px",
  } as React.CSSProperties,

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
    padding: SPACING.md,
    borderBottom: `3px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSurface,
  } as React.CSSProperties,

  title: {
    margin: 0,
    fontSize: TYPOGRAPHY.textSm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weight600,
  } as React.CSSProperties,

  headerControls: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.sm,
  } as React.CSSProperties,

  langWrap: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  } as React.CSSProperties,

  langLabel: {
    fontSize: "9px",
    color: COLORS.textSecondary,
  } as React.CSSProperties,

  langButtons: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  } as React.CSSProperties,

  langButton: {
    minWidth: "34px",
    padding: "3px 6px",
    border: `2px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgPrimary,
    color: COLORS.textPrimary,
    fontSize: "9px",
    boxShadow: SHADOWS.card,
  } as React.CSSProperties,

  langButtonActive: {
    backgroundColor: COLORS.accentPrimary,
    boxShadow: SHADOWS.hover,
  } as React.CSSProperties,

  counter: {
    fontSize: TYPOGRAPHY.textXs,
    padding: `${SPACING.xs} ${SPACING.sm}`,
    backgroundColor: COLORS.accentPrimary,
    color: COLORS.textPrimary,
    border: `2px solid ${COLORS.borderDefault}`,
    boxShadow: SHADOWS.card,
  } as React.CSSProperties,

  errorBanner: {
    margin: SPACING.md,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.textXs,
    border: `2px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.statusError,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  searchWrap: {
    padding: SPACING.md,
    borderBottom: `3px solid ${COLORS.borderDefault}`,
  } as React.CSSProperties,

  searchInput: {
    width: "100%",
    padding: `${SPACING.sm} ${SPACING.md}`,
    border: `2px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSurface,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.textXs,
    boxShadow: SHADOWS.card,
  } as React.CSSProperties,

  list: {
    padding: SPACING.md,
    overflowY: "auto" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.sm,
  } as React.CSSProperties,

  placeholder: {
    margin: 0,
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textSecondary,
  } as React.CSSProperties,

  row: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
    padding: SPACING.sm,
    border: `2px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSurface,
    boxShadow: SHADOWS.card,
    cursor: "pointer",
    transition: `transform ${TRANSITIONS.fast}, box-shadow ${TRANSITIONS.fast}`,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  rowSelected: {
    backgroundColor: COLORS.accentPrimary,
    boxShadow: SHADOWS.hover,
  } as React.CSSProperties,

  rowDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  } as React.CSSProperties,

  rowLeft: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.sm,
    minWidth: 0,
    flex: 1,
  } as React.CSSProperties,

  avatar: {
    width: "30px",
    height: "30px",
    border: `2px solid ${COLORS.borderDefault}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "9px",
    fontWeight: TYPOGRAPHY.weight600,
    flexShrink: 0,
  } as React.CSSProperties,

  rowMeta: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
    minWidth: 0,
  } as React.CSSProperties,

  agentName: {
    margin: 0,
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textPrimary,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  } as React.CSSProperties,

  sessionName: {
    margin: 0,
    fontSize: "9px",
    color: COLORS.textSecondary,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  } as React.CSSProperties,

  rowRight: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    flexShrink: 0,
  } as React.CSSProperties,

  statusDot: {
    width: "8px",
    height: "8px",
    border: `1px solid ${COLORS.borderDefault}`,
  } as React.CSSProperties,

  statusText: {
    fontSize: "9px",
    color: COLORS.textPrimary,
  } as React.CSSProperties,
} as const;
