"use client";

import { useState, useRef, useEffect } from "react";
import { Message, Session } from "@/lib/types";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, TRANSITIONS } from "@/lib/design-tokens";
import { formatTimestamp } from "@/lib/utils";

interface MessagePanelProps {
  currentSession: Session | undefined;
  messages: Message[];
  selectedSession: string | null;
  onSendMessage: (content: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
  isSending?: boolean;
  isRefreshing?: boolean;
}

export function MessagePanel({
  currentSession,
  messages,
  selectedSession,
  onSendMessage,
  onRefresh,
  isSending = false,
  isRefreshing = false,
}: MessagePanelProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scrolledUp, setScrolledUp] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
      setScrolledUp(false); // Auto-scroll after refresh
    } catch (err) {
      console.error("Failed to refresh:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-scroll to bottom when messages change (unless user scrolled up)
  useEffect(() => {
    if (listRef.current && !scrolledUp) {
      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
        }
      });
    }
  }, [messages, scrolledUp]);

  // Track if user has scrolled up
  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setScrolledUp(!atBottom);
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedSession) return;

    const message = input.trim();
    setInput("");
    setSending(true);

    try {
      await onSendMessage(message);
      setScrolledUp(false); // Auto-scroll after send
    } catch (err) {
      // Restore input on error
      setInput(message);
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }

    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (not Shift+Enter)
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const isLoading = isSending || sending;

  return (
    <section style={styles.panel}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.title}>{currentSession?.label || "Chat"}</h2>
          <p style={styles.role}>Session</p>
        </div>
        <div style={styles.headerRight}>
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={refreshing || isRefreshing}
              style={{
                ...styles.headerButton,
                ...(refreshing || isRefreshing ? styles.buttonDisabled : {}),
              }}
              title="Refresh messages"
            >
              ↻
            </button>
          )}
          <div style={styles.statusBadge}>
            <div
              style={{
                ...styles.statusDot,
                backgroundColor: selectedSession ? COLORS.statusIdle : COLORS.statusOffline,
              }}
            />
            <span style={styles.statusLabel}>
              {selectedSession ? "Active" : "Idle"}
            </span>
          </div>
        </div>
      </div>

      <div 
        style={styles.messagesList} 
        ref={listRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div style={styles.emptyMessages}>
            <p style={styles.emptyText}>💬 No messages yet</p>
            <p style={styles.emptySubtext}>Send a message to get started</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const sameSender = prevMsg && prevMsg.role === msg.role;
            const isUserMsg = msg.role === "user";

            return (
              <div
                key={idx}
                style={{
                  ...styles.message,
                  ...(msg.role === "user"
                    ? styles.messageUser
                    : msg.role === "system"
                      ? styles.messageSystem
                      : styles.messageAssistant),
                  ...(sameSender ? styles.messageConsecutive : styles.messageGroupStart),
                }}
              >
                {!sameSender && !isUserMsg && (
                  <div style={styles.messageMeta}>
                    <span style={styles.messageName}>{msg.role}</span>
                    {msg.timestamp && (
                      <span style={styles.messageTime}>
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    )}
                  </div>
                )}
                {!sameSender && isUserMsg && msg.timestamp && (
                  <div style={styles.messageMetaRight}>
                    <span style={styles.messageTime}>
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>
                )}
                <p style={styles.messageContent}>{msg.content}</p>
                {msg.toolName && (
                  <span style={styles.toolTag}>{msg.toolName}</span>
                )}
              </div>
            );
          })
        )}
        {isLoading && (
          <div style={styles.message}>
            <span style={styles.messageName}>system</span>
            <p style={styles.messageContent}>
              <span style={styles.typingDots}>●●●</span>
            </p>
          </div>
        )}
      </div>

      {scrolledUp && messages.length > 0 && (
        <div
          style={styles.newMessagesPill}
          onClick={() => {
            if (listRef.current) {
              listRef.current.scrollTop = listRef.current.scrollHeight;
              setScrolledUp(false);
            }
          }}
        >
          ↓ New messages
        </div>
      )}

      <div style={styles.inputContainer}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Shift+Enter for newline)"
          style={{
            ...styles.input,
            ...(isLoading ? styles.inputDisabled : {}),
          }}
          disabled={isLoading || !selectedSession}
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading || !selectedSession}
          style={{
            ...styles.sendButton,
            ...((!input.trim() || isLoading || !selectedSession)
              ? styles.sendButtonDisabled
              : {}),
          }}
          aria-label="Send message"
        >
          Send
        </button>
      </div>
    </section>
  );
}

const styles = {
  panel: {
    display: "flex",
    flexDirection: "column" as const,
    backgroundColor: COLORS.bgPrimary,
    overflow: "hidden" as const,
    borderLeft: `1px solid ${COLORS.borderSubtle}`,
    borderRight: `1px solid ${COLORS.borderSubtle}`,
  } as React.CSSProperties,

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.xl,
    borderBottom: `1px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSurface,
    height: "56px",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,

  headerLeft: {
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    flex: 1,
  } as React.CSSProperties,

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.md,
    marginLeft: SPACING.lg,
  } as React.CSSProperties,

  headerButton: {
    width: "32px",
    height: "32px",
    padding: 0,
    backgroundColor: COLORS.bgSurface,
    border: `1px solid ${COLORS.borderDefault}`,
    borderRadius: RADIUS.sm,
    cursor: "pointer",
    fontSize: "14px",
    color: COLORS.textSecondary,
    transition: `all ${TRANSITIONS.fast}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as React.CSSProperties,

  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    color: COLORS.textTertiary,
  } as React.CSSProperties,

  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  role: {
    margin: `${SPACING.sm} 0 0 0`,
    fontSize: "14px",
    color: COLORS.textSecondary,
  } as React.CSSProperties,

  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.sm,
  } as React.CSSProperties,

  statusDot: {
    width: "10px",
    height: "10px",
    borderRadius: RADIUS.full,
    flexShrink: 0,
  } as React.CSSProperties,

  statusLabel: {
    fontSize: "12px",
    fontWeight: "500",
    color: COLORS.textSecondary,
    textTransform: "capitalize" as const,
  } as React.CSSProperties,

  messagesList: {
    flex: 1,
    overflowY: "auto" as const,
    padding: SPACING.xl,
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.lg,
  } as React.CSSProperties,

  message: {
    display: "flex",
    flexDirection: "column" as const,
    fontSize: "16px",
    lineHeight: 1.5,
  } as React.CSSProperties,

  messageUser: {
    alignSelf: "flex-end" as const,
    maxWidth: "65%",
    backgroundColor: `rgba(196, 90, 44, 0.08)`,
    padding: `${SPACING.md} ${SPACING.lg}`,
    borderRadius: RADIUS.md,
    color: COLORS.textPrimary,
    borderLeft: `3px solid ${COLORS.accentPrimary}`,
  } as React.CSSProperties,

  messageAssistant: {
    alignSelf: "flex-start" as const,
    maxWidth: "680px",
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  messageSystem: {
    alignSelf: "center" as const,
    maxWidth: "500px",
    color: COLORS.textTertiary,
    fontStyle: "italic" as const,
    fontSize: "13px",
    padding: `${SPACING.sm} ${SPACING.md}`,
    backgroundColor: `rgba(155, 149, 138, 0.05)`,
    borderRadius: RADIUS.sm,
  } as React.CSSProperties,

  messageGroupStart: {
    marginTop: SPACING.lg,
  } as React.CSSProperties,

  messageConsecutive: {
    marginTop: "2px",
  } as React.CSSProperties,

  messageMeta: {
    display: "flex",
    gap: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: "center",
  } as React.CSSProperties,

  messageMetaRight: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: SPACING.sm,
  } as React.CSSProperties,

  messageName: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    color: COLORS.textSecondary,
    letterSpacing: "0.02em",
  } as React.CSSProperties,

  messageTime: {
    fontSize: "12px",
    color: COLORS.textTertiary,
    marginLeft: "auto",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  messageContent: {
    margin: 0,
    wordWrap: "break-word" as const,
    whiteSpace: "pre-wrap" as const,
    lineHeight: 1.6,
    wordBreak: "break-word" as const,
    overflowWrap: "break-word" as const,
  } as React.CSSProperties,

  toolTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTop: `1px solid ${COLORS.borderSubtle}`,
    fontSize: "12px",
    fontWeight: "500",
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontMono,
    maxWidth: "100%",
    overflow: "hidden" as const,
    textOverflow: "ellipsis" as const,
  } as React.CSSProperties,

  typingDots: {
    fontSize: "14px",
    letterSpacing: "3px",
    animation: "pulse 1.4s infinite",
    color: COLORS.textSecondary,
    fontWeight: "500",
  } as React.CSSProperties,

  newMessagesPill: {
    position: "absolute" as const,
    bottom: "100px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: COLORS.accentPrimary,
    color: COLORS.bgSurface,
    padding: `${SPACING.sm} ${SPACING.lg}`,
    borderRadius: RADIUS.full,
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    zIndex: 10,
    boxShadow: SHADOWS.panel,
    animation: `fadeIn ${TRANSITIONS.fast}`,
  } as React.CSSProperties,

  emptyMessages: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    color: COLORS.textTertiary,
    padding: SPACING.xxxl,
  } as React.CSSProperties,

  emptyText: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "500",
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  emptySubtext: {
    margin: `${SPACING.lg} 0 0 0`,
    fontSize: "14px",
    color: COLORS.textTertiary,
    textAlign: "center" as const,
    maxWidth: "200px",
    lineHeight: 1.5,
  } as React.CSSProperties,

  inputContainer: {
    display: "flex",
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTop: `1px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSurface,
    alignItems: "flex-end",
  } as React.CSSProperties,

  input: {
    flex: 1,
    padding: `${SPACING.md} ${SPACING.md}`,
    borderRadius: RADIUS.sm,
    border: `1px solid ${COLORS.borderDefault}`,
    fontSize: "14px",
    fontFamily: TYPOGRAPHY.fontFamily,
    resize: "none" as const,
    minHeight: "40px",
    maxHeight: "120px",
    transition: `border-color ${TRANSITIONS.fast}, box-shadow ${TRANSITIONS.fast}`,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.bgSurface,
  } as React.CSSProperties,

  inputDisabled: {
    opacity: 0.6,
    backgroundColor: COLORS.bgSidebar,
    cursor: "not-allowed" as const,
    color: COLORS.textTertiary,
  } as React.CSSProperties,

  sendButton: {
    padding: `${SPACING.md} ${SPACING.lg}`,
    backgroundColor: COLORS.accentPrimary,
    color: COLORS.bgSurface,
    border: "none",
    borderRadius: RADIUS.sm,
    fontWeight: "500",
    fontSize: "14px",
    cursor: "pointer",
    transition: `all ${TRANSITIONS.fast}`,
    minWidth: "70px",
    height: "40px",
  } as React.CSSProperties,

  sendButtonHover: {
    backgroundColor: COLORS.accentHover,
    boxShadow: `0 2px 8px rgba(196, 90, 44, 0.2)`,
  } as React.CSSProperties,

  sendButtonDisabled: {
    backgroundColor: COLORS.borderDefault,
    cursor: "not-allowed" as const,
    opacity: 0.5,
  } as React.CSSProperties,
} as const;
