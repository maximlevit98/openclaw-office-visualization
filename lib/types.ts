/**
 * Type definitions for OpenClaw Office Dashboard
 */

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  toolName?: string;
}

export interface Session {
  key: string;
  label?: string;
  kind?: string;
  activeMinutes?: number;
  messages?: Message[];
  status?: "active" | "idle" | "offline";
  unreadCount?: number;
}

export interface Agent {
  id: string;
  name?: string;
  status?: "online" | "idle" | "offline" | "busy";
  kind?: string;
  lastSeen?: string;
}

export interface APIResponse<T> {
  data?: T;
  error?: string;
  details?: string;
}

export interface DashboardState {
  sessions: Session[];
  agents: Agent[];
  selectedSession: string | null;
  loading: boolean;
  error: string | null;
}
