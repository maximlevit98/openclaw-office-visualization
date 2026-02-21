"use client";

import { useState, useRef, useEffect } from "react";
import { Message, Session } from "@/lib/types";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, TRANSITIONS } from "@/lib/design-tokens";

interface MessagePanelProps {
  currentSession: Session | undefined;
  messages: Message[];
  selectedSession: string | null;
  onSendMessage: (content: string) => Promise<void>;
  isSending?: boolean;
}

export function MessagePanel({
  currentSession,
  messages,
  selectedSession,
  onSendMessage,
  isSending = false,
}: MessagePanelProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [scrolledUp, setScrolledUp] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
        <div>
          <h2 style={styles.title}>{currentSession?.label || "Chat"}</h2>
          <p style={styles.role}>Session</p>
        </div>
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
          messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                ...styles.message,
                ...(msg.role === "user"
                  ? styles.messageUser
                  : msg.role === "system"
                    ? styles.messageSystem
                    : styles.messageAssistant),
              }}
            >
              <div style={styles.messageMeta}>
                <span style={styles.messageName}>{msg.role}</span>
                {msg.timestamp && (
                  <span style={styles.messageTime}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              <p style={styles.messageContent}>{msg.content}</p>
              {msg.toolName && (
                <span style={styles.toolTag}>{msg.toolName}</span>
              )}
            </div>
          ))
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
  } as React.CSSProperties,

  statusLabel: {
    fontSize: "12px",
    fontWeight: "500",
    color: COLORS.textSecondary,
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
    maxWidth: "60%",
    backgroundColor: `rgba(196, 90, 44, 0.08)`,
    padding: `${SPACING.sm} ${SPACING.md}`,
    borderRadius: RADIUS.md,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  messageAssistant: {
    alignSelf: "flex-start" as const,
    maxWidth: "680px",
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  messageSystem: {
    alignSelf: "flex-start" as const,
    maxWidth: "680px",
    color: COLORS.textSecondary,
    fontStyle: "italic" as const,
  } as React.CSSProperties,

  messageMeta: {
    display: "flex",
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  } as React.CSSProperties,

  messageName: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    color: COLORS.textSecondary,
  } as React.CSSProperties,

  messageTime: {
    fontSize: "12px",
    color: COLORS.textTertiary,
    marginLeft: "auto",
  } as React.CSSProperties,

  messageContent: {
    margin: 0,
    wordWrap: "break-word" as const,
    whiteSpace: "pre-wrap" as const,
  } as React.CSSProperties,

  toolTag: {
    display: "inline-block",
    marginTop: SPACING.md,
    padding: `${SPACING.sm} ${SPACING.md}`,
    backgroundColor: COLORS.bgSidebar,
    borderRadius: RADIUS.sm,
    fontSize: "12px",
    fontWeight: "500",
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontMono,
    maxWidth: "100%",
    overflow: "auto",
  } as React.CSSProperties,

  typingDots: {
    fontSize: "18px",
    letterSpacing: "2px",
    animation: "pulse 1.5s infinite",
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
  } as React.CSSProperties,

  emptyText: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "500",
  } as React.CSSProperties,

  emptySubtext: {
    margin: `${SPACING.md} 0 0 0`,
    fontSize: "14px",
    color: COLORS.textSecondary,
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
    transition: `border-color ${TRANSITIONS.fast}`,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  inputDisabled: {
    opacity: 0.6,
    backgroundColor: COLORS.bgSidebar,
    cursor: "not-allowed" as const,
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

  sendButtonDisabled: {
    backgroundColor: COLORS.borderDefault,
    cursor: "not-allowed" as const,
    opacity: 0.5,
  } as React.CSSProperties,
} as const;
