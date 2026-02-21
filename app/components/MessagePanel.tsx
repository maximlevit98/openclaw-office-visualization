"use client";

import React, { useRef, useEffect, useState } from "react";
import { Session, Message } from "@/lib/types";
import { COLORS, TYPOGRAPHY, SPACING, TRANSITIONS, RADIUS, SHADOWS } from "@/lib/design-tokens";
import { FormattedMessage } from "./FormattedMessage";

interface MessagePanelProps {
  currentSession: Session | undefined;
  messages: Message[];
  selectedSession: string | null;
  onSendMessage: (content: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  isSending: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function MessagePanel({
  currentSession,
  messages,
  selectedSession,
  onSendMessage,
  onRefresh,
  isSending,
  inputRef,
}: MessagePanelProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
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
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.sessionTitle}>
            {currentSession?.label || "No session selected"}
          </h2>
          {currentSession?.status && (
            <span style={styles.badge}>
              {currentSession.status === "active" ? "🟢" : "⚪"}{" "}
              {currentSession.status}
            </span>
          )}
        </div>
        <button
          style={styles.refreshButton}
          onClick={onRefresh}
          disabled={isSending || isLoading}
          title="Refresh messages"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Messages Area */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>💬</p>
            <p style={styles.emptyText}>No messages yet</p>
            <p style={styles.emptySubtext}>
              Start a conversation or send a command
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
          // Group consecutive messages from the same role
          const isGroupStart =
            idx === 0 || messages[idx - 1].role !== msg.role;
          const isGroupEnd =
            idx === messages.length - 1 ||
            messages[idx + 1].role !== msg.role;

          return (
            <MessageBubble
              key={idx}
              message={msg}
              isGroupStart={isGroupStart}
              isGroupEnd={isGroupEnd}
            />
          );
        })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <div style={styles.footer}>
        <div style={styles.inputGroup}>
          <textarea
            ref={inputRef}
            style={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Cmd+/ to focus, Shift+Enter for newline)"
            disabled={isSending || isLoading}
            rows={3}
          />
          <button
            style={{
              ...styles.sendButton,
              opacity: input.trim() && !isSending ? 1 : 0.5,
              cursor:
                input.trim() && !isSending ? "pointer" : "not-allowed",
            }}
            onClick={handleSend}
            disabled={!input.trim() || isSending}
          >
            {isSending ? "⏳ Sending..." : "Send"}
          </button>
        </div>
        {isSending && (
          <p style={styles.statusText}>Waiting for response...</p>
        )}
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isGroupStart?: boolean;
  isGroupEnd?: boolean;
}

function MessageBubble({ message, isGroupStart = true, isGroupEnd = true }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

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
          color: isUser ? COLORS.bgPrimary : COLORS.textPrimary,
          borderBottom: isUser
            ? "none"
            : `1px solid ${COLORS.borderDefault}`,
          borderTopLeftRadius: isUser || !isGroupStart ? RADIUS.md : RADIUS.md,
          borderTopRightRadius: !isUser || !isGroupStart ? RADIUS.md : RADIUS.md,
          borderBottomLeftRadius: isUser || !isGroupEnd ? RADIUS.md : RADIUS.md,
          borderBottomRightRadius: !isUser || !isGroupEnd ? RADIUS.md : RADIUS.md,
        }}
      >
        {message.toolName && (
          <p style={styles.toolName}>🔧 {message.toolName}</p>
        )}
        <div style={styles.messageContent}>
          <FormattedMessage content={message.content} isUser={isUser} />
        </div>
        {message.timestamp && isGroupEnd && (
          <p
            style={{
              ...styles.messageTimestamp,
              color: isUser
                ? "rgba(255,255,255,0.7)"
                : COLORS.textTertiary,
            }}
          >
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
    backgroundColor: COLORS.bgPrimary,
    borderRight: `1px solid ${COLORS.borderDefault}`,
  } as React.CSSProperties,

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.lg,
    borderBottom: `1px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSurface,
    gap: SPACING.lg,
  } as React.CSSProperties,

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.md,
  } as React.CSSProperties,

  sessionTitle: {
    fontSize: TYPOGRAPHY.textLg,
    fontWeight: TYPOGRAPHY.weight600,
    margin: 0,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  badge: {
    fontSize: TYPOGRAPHY.textXs,
    backgroundColor: COLORS.bgPrimary,
    color: COLORS.textSecondary,
    padding: `${SPACING.xs} ${SPACING.sm}`,
    borderRadius: RADIUS.full,
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  refreshButton: {
    padding: `${SPACING.sm} ${SPACING.md}`,
    backgroundColor: COLORS.accentPrimary,
    color: COLORS.bgPrimary,
    border: "none",
    borderRadius: RADIUS.sm,
    cursor: "pointer",
    fontSize: TYPOGRAPHY.textSm,
    fontWeight: TYPOGRAPHY.weight500,
    transition: `all ${TRANSITIONS.fast}`,
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
  } as React.CSSProperties,

  emptyIcon: {
    fontSize: "48px",
    margin: 0,
  } as React.CSSProperties,

  emptyText: {
    fontSize: TYPOGRAPHY.textLg,
    fontWeight: TYPOGRAPHY.weight500,
    color: COLORS.textPrimary,
    margin: 0,
    marginTop: SPACING.lg,
  } as React.CSSProperties,

  emptySubtext: {
    fontSize: TYPOGRAPHY.textSm,
    color: COLORS.textTertiary,
    margin: 0,
    marginTop: SPACING.sm,
  } as React.CSSProperties,

  messageBubbleContainer: {
    display: "flex",
    marginBottom: SPACING.sm,
  } as React.CSSProperties,

  messageBubble: {
    maxWidth: "75%",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    wordWrap: "break-word" as const,
    whiteSpace: "pre-wrap" as const,
    boxShadow: SHADOWS.card,
  } as React.CSSProperties,

  messageContent: {
    margin: 0,
    fontSize: TYPOGRAPHY.textSm,
    lineHeight: "1.5",
  } as React.CSSProperties,

  toolName: {
    margin: 0,
    marginBottom: SPACING.sm,
    fontSize: TYPOGRAPHY.textXs,
    fontWeight: TYPOGRAPHY.weight600,
    opacity: 0.8,
  } as React.CSSProperties,

  messageTimestamp: {
    margin: 0,
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.textXs,
  } as React.CSSProperties,

  systemMessage: {
    padding: SPACING.md,
    backgroundColor: COLORS.bgSurface,
    borderLeft: `3px solid ${COLORS.statusThinking}`,
    borderRadius: RADIUS.sm,
  } as React.CSSProperties,

  systemText: {
    margin: 0,
    fontSize: TYPOGRAPHY.textSm,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  } as React.CSSProperties,

  footer: {
    padding: SPACING.lg,
    borderTop: `1px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSurface,
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
    border: `1px solid ${COLORS.borderDefault}`,
    fontSize: TYPOGRAPHY.textSm,
    fontFamily: TYPOGRAPHY.fontFamily,
    backgroundColor: COLORS.bgPrimary,
    color: COLORS.textPrimary,
    resize: "none" as const,
    minHeight: "80px",
  } as React.CSSProperties,

  sendButton: {
    padding: `${SPACING.md} ${SPACING.lg}`,
    backgroundColor: COLORS.accentPrimary,
    color: COLORS.bgPrimary,
    border: "none",
    borderRadius: RADIUS.sm,
    fontWeight: TYPOGRAPHY.weight600,
    cursor: "pointer",
    transition: `all ${TRANSITIONS.fast}`,
    fontSize: TYPOGRAPHY.textSm,
  } as React.CSSProperties,

  statusText: {
    margin: 0,
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textTertiary,
    textAlign: "center" as const,
  } as React.CSSProperties,
} as const;
