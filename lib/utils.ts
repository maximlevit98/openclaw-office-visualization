/**
 * Utility functions for the dashboard
 */

/**
 * Format a timestamp for display
 * @param timestamp ISO string or Date
 * @returns Formatted time string (e.g., "14:30" or "Yesterday")
 */
export function formatTimestamp(timestamp?: string): string {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Less than 1 minute ago
  if (diffMins < 1) {
    return "now";
  }

  // Less than 1 hour ago
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }

  // Less than 24 hours ago
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  // Yesterday
  if (diffDays === 1) {
    return "Yesterday";
  }

  // This week
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  // Format as date
  const monthDay = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${monthDay} ${time}`;
}

/**
 * Format a session duration
 * @param minutes Active minutes
 * @returns Formatted duration string
 */
export function formatDuration(minutes?: number): string {
  if (!minutes) return "";

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get status color based on status string
 */
export function getStatusColor(status?: string): string {
  switch (status) {
    case "online":
      return "#10b981"; // Green
    case "busy":
      return "#f59e0b"; // Amber
    case "idle":
      return "#6b7280"; // Gray
    case "offline":
      return "#ef4444"; // Red
    default:
      return "#9ca3af"; // Light gray
  }
}
