"use client";

import React from "react";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, getStatusColor, getStatusLabel } from "@/lib/design-tokens";

interface StatusBadgeProps {
  status?: string;
  size?: "sm" | "md" | "lg";
  variant?: "dot" | "inline" | "pill";
  className?: string;
}

/**
 * Reusable status badge component with semantic colors
 * Variants: dot (6px circle), inline (with label), pill (rounded badge)
 */
export function StatusBadge({
  status,
  size = "md",
  variant = "inline",
}: StatusBadgeProps) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);

  // Dot variant (just the colored circle)
  if (variant === "dot") {
    const sizeMap = { sm: "4px", md: "6px", lg: "8px" };
    return (
      <div
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          borderRadius: RADIUS.full,
          backgroundColor: color,
          display: "inline-block",
          flexShrink: 0,
        }}
        title={label}
      />
    );
  }

  // Pill variant (rounded badge with label)
  if (variant === "pill") {
    const paddingMap = {
      sm: `${SPACING.xs} ${SPACING.sm}`,
      md: `${SPACING.sm} ${SPACING.md}`,
      lg: `${SPACING.md} ${SPACING.lg}`,
    };
    const fontSizeMap = {
      sm: TYPOGRAPHY.textXs,
      md: TYPOGRAPHY.textSm,
      lg: TYPOGRAPHY.textBase,
    };

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: SPACING.sm,
          padding: paddingMap[size],
          backgroundColor: COLORS.bgSurface,
          color: COLORS.textPrimary,
          borderRadius: RADIUS.sm,
          fontSize: fontSizeMap[size],
          fontWeight: TYPOGRAPHY.weight500,
          border: `2px solid ${COLORS.borderDefault}`,
          boxShadow: SHADOWS.card,
          whiteSpace: "nowrap" as const,
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: RADIUS.sm,
            backgroundColor: color,
            border: `1px solid ${COLORS.borderDefault}`,
          }}
        />
        {label}
      </span>
    );
  }

  // Inline variant (text with dot)
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: SPACING.sm,
        fontSize: TYPOGRAPHY.textSm,
        color: COLORS.textPrimary,
        fontWeight: TYPOGRAPHY.weight500,
        backgroundColor: COLORS.bgSurface,
        border: `2px solid ${COLORS.borderDefault}`,
        boxShadow: SHADOWS.card,
        padding: `${SPACING.xs} ${SPACING.sm}`,
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: RADIUS.sm,
          backgroundColor: color,
          border: `1px solid ${COLORS.borderDefault}`,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}
