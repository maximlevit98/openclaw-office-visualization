/**
 * Design Tokens — "8-Bit Office"
 * Hard edges, chunky shadows, and retro arcade palette.
 */

export const COLORS = {
  // Base
  bgPrimary: "#d7f7b0",
  bgSurface: "#f6f4cf",
  bgSidebar: "#cde56f",
  borderDefault: "#1a2238",
  borderSubtle: "#34436e",
  textPrimary: "#141b2d",
  textSecondary: "#2d3a63",
  textTertiary: "#4f5c86",

  // Status
  statusIdle: "#5ad26a",
  statusThinking: "#ffd166",
  statusTool: "#1ec8ff",
  statusError: "#ff3f71",
  statusOffline: "#8a95b0",
  statusOnline: "#23f0c7",
  statusBusy: "#ff8d3b",

  // Accent
  accentPrimary: "#ff5f2e",
  accentHover: "#ff8448",
  unreadDot: "#ff2056",
};

export const TYPOGRAPHY = {
  fontFamily: "'Press Start 2P', 'VT323', 'Courier New', monospace",
  fontMono: "'VT323', 'Courier New', monospace",

  // Size / line-height
  textXs: "10px",
  textSm: "12px",
  textBase: "14px",
  textLg: "16px",
  textXl: "20px",

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
  sm: "0px",
  md: "2px",
  lg: "4px",
  full: "9999px",
};

export const SHADOWS = {
  card: "3px 3px 0 0 rgba(20, 27, 45, 0.42)",
  panel: "5px 5px 0 0 rgba(20, 27, 45, 0.52)",
  hover: "7px 7px 0 0 rgba(20, 27, 45, 0.62)",
};

export const TRANSITIONS = {
  fast: "120ms steps(2, end)",
  normal: "180ms steps(2, end)",
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
    case "online":
    case "active":
      return COLORS.statusOnline;
    case "busy":
      return COLORS.statusBusy;
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
  "#23f0c7", // aqua
  "#ff5f2e", // orange
  "#ffd166", // yellow
  "#7b6cff", // violet
  "#3f88ff", // blue
  "#ff3f71", // pink-red
];

export function getAvatarColor(name?: string): string {
  if (!name) return avatarFallbackColors[0];
  const hash = Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return avatarFallbackColors[hash % avatarFallbackColors.length];
}

/**
 * Helper: Get status label
 */
export function getStatusLabel(status?: string): string {
  if (!status) return "Unknown";
  switch (status.toLowerCase()) {
    case "online":
    case "active":
      return "Online";
    case "busy":
      return "Busy";
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
