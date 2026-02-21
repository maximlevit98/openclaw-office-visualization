"use client";

import React from "react";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from "@/lib/design-tokens";
import { parseMarkdown, hasCodeBlock } from "@/lib/markdown";

interface FormattedMessageProps {
  content: string;
  isUser: boolean;
}

/**
 * Message component with markdown-like formatting support
 * Handles bold, italic, code blocks, and lists
 */
export function FormattedMessage({ content, isUser }: FormattedMessageProps) {
  const hasCode = hasCodeBlock(content);
  const segments = parseMarkdown(content);

  if (segments.length === 0) {
    return <p style={styles.text}>{content}</p>;
  }

  return (
    <div style={styles.container}>
      {segments.map((segment, idx) => {
        switch (segment.type) {
          case "bold":
            return (
              <strong key={idx} style={styles.bold}>
                {segment.content}
              </strong>
            );

          case "italic":
            return (
              <em key={idx} style={styles.italic}>
                {segment.content}
              </em>
            );

          case "code":
            return (
              <code key={idx} style={styles.inlineCode}>
                {segment.content}
              </code>
            );

          case "codeblock":
            return (
              <pre key={idx} style={styles.codeBlock}>
                <code>{segment.content}</code>
              </pre>
            );

          case "list":
            return (
              <div key={idx} style={styles.listItem}>
                <span style={styles.listBullet}>•</span>
                <span>{segment.content}</span>
              </div>
            );

          default:
            return (
              <span key={idx} style={styles.text}>
                {segment.content}
              </span>
            );
        }
      })}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: SPACING.sm,
  } as React.CSSProperties,

  text: {
    margin: 0,
    fontSize: TYPOGRAPHY.textSm,
    lineHeight: "1.5",
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
  } as React.CSSProperties,

  bold: {
    fontWeight: TYPOGRAPHY.weight600,
  } as React.CSSProperties,

  italic: {
    fontStyle: "italic",
    opacity: 0.9,
  } as React.CSSProperties,

  inlineCode: {
    backgroundColor: COLORS.bgPrimary,
    color: COLORS.accentPrimary,
    padding: `${SPACING.xs} ${SPACING.sm}`,
    borderRadius: RADIUS.sm,
    fontFamily: TYPOGRAPHY.fontMono,
    fontSize: "0.9em",
  } as React.CSSProperties,

  codeBlock: {
    backgroundColor: "#1E1E1E",
    color: "#D4D4D4",
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    overflow: "auto" as const,
    fontFamily: TYPOGRAPHY.fontMono,
    fontSize: TYPOGRAPHY.textSm,
    margin: 0,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  } as React.CSSProperties,

  listItem: {
    display: "flex",
    gap: SPACING.md,
    alignItems: "flex-start",
  } as React.CSSProperties,

  listBullet: {
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weight600,
    flexShrink: 0,
  } as React.CSSProperties,
} as const;
