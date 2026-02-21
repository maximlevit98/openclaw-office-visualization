"use client";

import React, { useRef, useEffect, useState } from "react";
import { Session, Message } from "@/lib/types";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  TRANSITIONS,
  RADIUS,
  SHADOWS,
} from "@/lib/design-tokens";
import { FormattedMessage } from "./FormattedMessage";
import { Locale, getStatusLabel } from "@/lib/i18n";

interface MessagePanelProps {
  currentSession: Session | undefined;
  messages: Message[];
  selectedSession: string | null;
  onSendMessage: (content: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  isSending: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  embedded?: boolean;
  locale: Locale;
}

const TEXT = {
  en: {
    noSession: "NO SESSION SELECTED",
    sync: "SYNC",
    empty: "CHAT://EMPTY",
    start: "START A NEW COMMAND",
    emptySub: "Type task details and press SEND",
    placeholder: "TYPE MESSAGE... (CMD+/ TO FOCUS)",
    sending: "SENDING...",
    send: "SEND",
    thinking: "AGENT IS THINKING...",
    tool: "TOOL",
    refreshTitle: "Refresh messages",
  },
  ru: {
    noSession: "СЕССИЯ НЕ ВЫБРАНА",
    sync: "СИНК",
    empty: "ЧАТ://ПУСТО",
    start: "НАЧНИТЕ НОВУЮ КОМАНДУ",
    emptySub: "Опишите задачу и нажмите ОТПРАВИТЬ",
    placeholder: "ВВЕДИТЕ СООБЩЕНИЕ... (CMD+/ ФОКУС)",
    sending: "ОТПРАВКА...",
    send: "ОТПРАВИТЬ",
    thinking: "АГЕНТ ДУМАЕТ...",
    tool: "ИНСТРУМЕНТ",
    refreshTitle: "Обновить сообщения",
  },
} as const;

export function MessagePanel({
  currentSession,
  messages,
  selectedSession,
  onSendMessage,
  onRefresh,
  isSending,
  inputRef,
  embedded = false,
  locale,
}: MessagePanelProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = TEXT[locale];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedSession) return;

    const message = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      await onSendMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isSending) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        ...styles.container,
        ...(embedded ? styles.containerEmbedded : null),
      }}
    >
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.sessionTitle}>{currentSession?.label || t.noSession}</h2>
          {currentSession?.status && <span style={styles.badge}>{getStatusLabel(currentSession.status, locale)}</span>}
        </div>
        <button
          style={{
            ...styles.refreshButton,
            opacity: isSending || isLoading ? 0.6 : 1,
            cursor: isSending || isLoading ? "not-allowed" : "pointer",
          }}
          onClick={onRefresh}
          disabled={isSending || isLoading}
          title={t.refreshTitle}
        >
          {t.sync}
        </button>
      </div>

      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>{t.empty}</p>
            <p style={styles.emptyText}>{t.start}</p>
            <p style={styles.emptySubtext}>{t.emptySub}</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isGroupStart = idx === 0 || messages[idx - 1].role !== msg.role;
            const isGroupEnd = idx === messages.length - 1 || messages[idx + 1].role !== msg.role;

            return (
              <MessageBubble
                key={idx}
                message={msg}
                isGroupStart={isGroupStart}
                isGroupEnd={isGroupEnd}
                locale={locale}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.footer}>
        <div style={styles.inputGroup}>
          <textarea
            ref={inputRef}
            style={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            disabled={isSending || isLoading}
            rows={3}
          />
          <button
            style={{
              ...styles.sendButton,
              opacity: input.trim() && !isSending ? 1 : 0.55,
              cursor: input.trim() && !isSending ? "pointer" : "not-allowed",
            }}
            onClick={handleSend}
            disabled={!input.trim() || isSending}
          >
            {isSending ? t.sending : t.send}
          </button>
        </div>
        {isSending && <p style={styles.statusText}>{t.thinking}</p>}
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isGroupStart?: boolean;
  isGroupEnd?: boolean;
  locale: Locale;
}

function MessageBubble({ message, isGroupEnd = true, locale }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const t = TEXT[locale];

  if (isSystem) {
    return (
      <div style={styles.systemMessage}>
        <p style={styles.systemText}>{message.content}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles.messageBubbleContainer,
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: isGroupEnd ? SPACING.md : SPACING.xs,
      }}
    >
      <div
        style={{
          ...styles.messageBubble,
          backgroundColor: isUser ? COLORS.accentPrimary : COLORS.bgSurface,
          color: COLORS.textPrimary,
          borderColor: isUser ? COLORS.borderDefault : COLORS.borderSubtle,
        }}
      >
        {message.toolName && (
          <p style={styles.toolName}>
            {t.tool}: {message.toolName}
          </p>
        )}
        <div style={styles.messageContent}>
          <FormattedMessage content={message.content} isUser={isUser} />
        </div>
        {message.timestamp && isGroupEnd && (
          <p style={styles.messageTimestamp}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100vh",
    backgroundColor: COLORS.bgSurface,
    borderRight: `3px solid ${COLORS.borderDefault}`,
    borderLeft: `3px solid ${COLORS.borderDefault}`,
  } as React.CSSProperties,

  containerEmbedded: {
    height: "100%",
    borderLeft: "none",
    borderRight: "none",
  } as React.CSSProperties,

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.lg,
    borderBottom: `3px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgPrimary,
    gap: SPACING.lg,
  } as React.CSSProperties,

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.md,
    minWidth: 0,
  } as React.CSSProperties,

  sessionTitle: {
    fontSize: TYPOGRAPHY.textSm,
    fontWeight: TYPOGRAPHY.weight600,
    margin: 0,
    color: COLORS.textPrimary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  badge: {
    fontSize: TYPOGRAPHY.textXs,
    backgroundColor: COLORS.statusOnline,
    color: COLORS.textPrimary,
    padding: `${SPACING.xs} ${SPACING.sm}`,
    border: `2px solid ${COLORS.borderDefault}`,
    whiteSpace: "nowrap" as const,
    boxShadow: SHADOWS.card,
  } as React.CSSProperties,

  refreshButton: {
    padding: `${SPACING.sm} ${SPACING.md}`,
    backgroundColor: COLORS.accentPrimary,
    color: COLORS.textPrimary,
    border: `2px solid ${COLORS.borderDefault}`,
    cursor: "pointer",
    fontSize: TYPOGRAPHY.textXs,
    fontWeight: TYPOGRAPHY.weight600,
    transition: `transform ${TRANSITIONS.fast}, box-shadow ${TRANSITIONS.fast}`,
    boxShadow: SHADOWS.card,
    flexShrink: 0,
  } as React.CSSProperties,

  messagesContainer: {
    flex: 1,
    overflow: "hidden",
    overflowY: "auto" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.md,
    padding: SPACING.lg,
  } as React.CSSProperties,

  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    border: `3px dashed ${COLORS.borderSubtle}`,
    backgroundColor: COLORS.bgPrimary,
    boxShadow: SHADOWS.card,
    padding: SPACING.xl,
    textAlign: "center" as const,
  } as React.CSSProperties,

  emptyIcon: {
    fontSize: TYPOGRAPHY.textSm,
    margin: 0,
    color: COLORS.textSecondary,
  } as React.CSSProperties,

  emptyText: {
    fontSize: TYPOGRAPHY.textSm,
    fontWeight: TYPOGRAPHY.weight600,
    color: COLORS.textPrimary,
    margin: 0,
    marginTop: SPACING.lg,
  } as React.CSSProperties,

  emptySubtext: {
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textSecondary,
    margin: 0,
    marginTop: SPACING.sm,
  } as React.CSSProperties,

  messageBubbleContainer: {
    display: "flex",
    marginBottom: SPACING.sm,
  } as React.CSSProperties,

  messageBubble: {
    maxWidth: "78%",
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    border: `3px solid ${COLORS.borderDefault}`,
    wordWrap: "break-word" as const,
    whiteSpace: "pre-wrap" as const,
    boxShadow: SHADOWS.card,
  } as React.CSSProperties,

  messageContent: {
    margin: 0,
    fontSize: TYPOGRAPHY.textSm,
    lineHeight: "1.7",
  } as React.CSSProperties,

  toolName: {
    margin: 0,
    marginBottom: SPACING.sm,
    fontSize: TYPOGRAPHY.textXs,
    fontWeight: TYPOGRAPHY.weight600,
    color: COLORS.textSecondary,
  } as React.CSSProperties,

  messageTimestamp: {
    margin: 0,
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textSecondary,
  } as React.CSSProperties,

  systemMessage: {
    padding: SPACING.md,
    backgroundColor: COLORS.statusThinking,
    border: `3px solid ${COLORS.borderDefault}`,
    boxShadow: SHADOWS.card,
  } as React.CSSProperties,

  systemText: {
    margin: 0,
    fontSize: TYPOGRAPHY.textSm,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  footer: {
    padding: SPACING.lg,
    borderTop: `3px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgPrimary,
    gap: SPACING.md,
    display: "flex",
    flexDirection: "column" as const,
  } as React.CSSProperties,

  inputGroup: {
    display: "flex",
    gap: SPACING.md,
  } as React.CSSProperties,

  textarea: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    border: `3px solid ${COLORS.borderDefault}`,
    fontSize: TYPOGRAPHY.textSm,
    fontFamily: TYPOGRAPHY.fontFamily,
    backgroundColor: COLORS.bgSurface,
    color: COLORS.textPrimary,
    resize: "none" as const,
    minHeight: "84px",
    boxShadow: SHADOWS.card,
  } as React.CSSProperties,

  sendButton: {
    padding: `${SPACING.md} ${SPACING.lg}`,
    backgroundColor: COLORS.accentPrimary,
    color: COLORS.textPrimary,
    border: `3px solid ${COLORS.borderDefault}`,
    borderRadius: RADIUS.sm,
    fontWeight: TYPOGRAPHY.weight600,
    cursor: "pointer",
    transition: `transform ${TRANSITIONS.fast}, box-shadow ${TRANSITIONS.fast}`,
    fontSize: TYPOGRAPHY.textXs,
    boxShadow: SHADOWS.card,
  } as React.CSSProperties,

  statusText: {
    margin: 0,
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textSecondary,
    textAlign: "center" as const,
    animation: "pixelPulse 1.2s steps(2, end) infinite",
  } as React.CSSProperties,
} as const;
