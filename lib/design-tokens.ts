/**
 * Design Tokens — "The Bullpen"
 * Approved palette from handoffs/designer/visual-direction.md
 * Cycle 3 — Phase 1 Implementation
 */

export const COLORS = {
  // Base (Warm Neutrals)
  bgPrimary: "#FAF8F5",
  bgSurface: "#FFFFFF",
  bgSidebar: "#F3F0EB",
  borderDefault: "#E5E0D8",
  borderSubtle: "#EDE9E3",
  textPrimary: "#1A1816",
  textSecondary: "#6B635A",
  textTertiary: "#9E958A",

  // Status Palette
  statusIdle: "#8B9E7C",
  statusThinking: "#D4A843",
  statusTool: "#5B8ABF",
  statusError: "#C45D4E",
  statusOffline: "#B5AFA6",

  // Accent
  accentPrimary: "#C45A2C",
  accentHover: "#A8492A",
  unreadDot: "#C45A2C",
};

export const TYPOGRAPHY = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', 'Monaco', monospace",

  // Size / line-height
  textXs: "12px / 1.4",
  textSm: "14px / 1.5",
  textBase: "16px / 1.5",
  textLg: "18px / 1.4",
  textXl: "24px / 1.3",

  // Weights
  weight400: 400,
  weight500: 500,
  weight600: 600,
};

export const SPACING = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  xxl: "24px",
  xxxl: "32px",
  huge: "48px",
};

export const RADIUS = {
  sm: "6px",
  md: "10px",
  lg: "16px",
  full: "9999px",
};

export const SHADOWS = {
  card: "0 1px 3px rgba(26, 24, 22, 0.06), 0 1px 2px rgba(26, 24, 22, 0.04)",
  panel: "0 4px 12px rgba(26, 24, 22, 0.08)",
  hover: "0 4px 16px rgba(26, 24, 22, 0.12)",
};

export const TRANSITIONS = {
  fast: "150ms ease-out",
  normal: "200ms ease-in-out",
};

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};

/**
 * Helper: Get status color for agent state
 */
export function getStatusColor(status?: string): string {
  if (!status) return COLORS.textSecondary;
  switch (status.toLowerCase()) {
    case "idle":
      return COLORS.statusIdle;
    case "thinking":
      return COLORS.statusThinking;
    case "tool":
      return COLORS.statusTool;
    case "error":
      return COLORS.statusError;
    case "offline":
      return COLORS.statusOffline;
    default:
      return COLORS.textSecondary;
  }
}

/**
 * Helper: Get fallback avatar color (6-hue warm palette)
 */
export const avatarFallbackColors = [
  "#8B9E7C", // sage
  "#D4A843", // amber
  "#5B8ABF", // blue
  "#C45D4E", // red
  "#B5AFA6", // gray
  "#C45A2C", // terracotta
];

export function getAvatarColor(name?: string): string {
  if (!name) return avatarFallbackColors[0];
  const hash = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
  return avatarFallbackColors[hash % avatarFallbackColors.length];
}

/**
 * Helper: Get status label
 */
export function getStatusLabel(status?: string): string {
  if (!status) return "Unknown";
  switch (status.toLowerCase()) {
    case "idle":
      return "Idle";
    case "thinking":
      return "Thinking";
    case "tool":
      return "Using tool";
    case "error":
      return "Error";
    case "offline":
      return "Offline";
    default:
      return status;
  }
}
