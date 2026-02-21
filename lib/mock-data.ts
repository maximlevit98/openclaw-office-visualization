/**
 * Mock data generator for testing UI without a real backend
 * Provides realistic scenarios for sessions, agents, and messages
 */

import { Session, Message, Agent } from "./types";

export function generateMockSessions(): Session[] {
  return [
    {
      key: "main-session-001",
      label: "Main Session",
      kind: "main",
      activeMinutes: 127,
      status: "active",
    },
    {
      key: "agent-run-fetch-news",
      label: "Fetch Latest News",
      kind: "background",
      activeMinutes: 8,
      status: "active",
    },
    {
      key: "agent-run-deploy-backend",
      label: "Deploy Backend v2.0",
      kind: "background",
      activeMinutes: 3,
      status: "active",
    },
    {
      key: "archived-1",
      label: "Code Review Session",
      kind: "main",
      activeMinutes: 0,
      status: "idle",
    },
  ];
}

export function generateMockMessages(): Message[] {
  return [
    {
      role: "user",
      content: "Can you summarize the latest product updates?",
      timestamp: new Date(Date.now() - 300000).toISOString(),
    },
    {
      role: "assistant",
      content:
        "I'll fetch the latest product updates for you. Let me check the changelog and release notes.",
      timestamp: new Date(Date.now() - 290000).toISOString(),
    },
    {
      role: "system",
      content: "Tool: fetch_changelog invoked",
      toolName: "fetch_changelog",
      timestamp: new Date(Date.now() - 280000).toISOString(),
    },
    {
      role: "assistant",
      content: `Here are the latest updates from v2.1.0 (released 2 days ago):

• New message streaming API for real-time chat updates
• Improved error handling with automatic retry logic
• Performance optimization: 30% faster session startup
• Added support for custom agent middleware

Key improvements:
- WebSocket connections now support binary frames
- Memory usage reduced by 15% under heavy load
- Added rate limiting for API endpoints`,
      timestamp: new Date(Date.now() - 270000).toISOString(),
    },
    {
      role: "user",
      content: "What's the performance improvement like?",
      timestamp: new Date(Date.now() - 200000).toISOString(),
    },
    {
      role: "assistant",
      content:
        "The performance improvements are quite significant. Session initialization is now 30% faster due to optimized connection pooling. Memory usage under peak load decreased by 15%, which helps with scalability.",
      timestamp: new Date(Date.now() - 190000).toISOString(),
    },
    {
      role: "system",
      content: "Tool: bench_mark_session completed in 1.2s",
      toolName: "bench_mark_session",
      timestamp: new Date(Date.now() - 180000).toISOString(),
    },
    {
      role: "user",
      content: "Create a summary document please",
      timestamp: new Date(Date.now() - 120000).toISOString(),
    },
    {
      role: "assistant",
      content: "I'm creating a summary document now...",
      timestamp: new Date(Date.now() - 110000).toISOString(),
    },
    {
      role: "system",
      content: "Tool: create_document → saved to docs/v2.1-summary.md",
      toolName: "create_document",
      timestamp: new Date(Date.now() - 100000).toISOString(),
    },
    {
      role: "assistant",
      content:
        "✓ Summary document created successfully at docs/v2.1-summary.md. The document includes all major features, performance improvements, and migration notes.",
      timestamp: new Date(Date.now() - 90000).toISOString(),
    },
  ];
}

export function generateMockAgents(): Agent[] {
  return [
    {
      id: "frontend",
      name: "Frontend Agent",
      status: "online",
      kind: "ui",
      lastSeen: new Date(Date.now() - 60000).toISOString(),
    },
    {
      id: "backend",
      name: "Backend Agent",
      status: "online",
      kind: "api",
      lastSeen: new Date(Date.now() - 30000).toISOString(),
    },
    {
      id: "deploy",
      name: "Deploy Agent",
      status: "busy",
      kind: "infra",
      lastSeen: new Date(Date.now() - 5000).toISOString(),
    },
    {
      id: "tester",
      name: "QA Agent",
      status: "idle",
      kind: "test",
      lastSeen: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "docs",
      name: "Documentation Agent",
      status: "offline",
      kind: "docs",
      lastSeen: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}

/**
 * Simulate agent status changes for testing
 */
export function simulateAgentStatusChange(agent: Agent): Agent {
  const statuses: Array<"online" | "idle" | "offline" | "busy"> = [
    "online",
    "idle",
    "busy",
    "offline",
  ];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

  return {
    ...agent,
    status: randomStatus,
    lastSeen: new Date().toISOString(),
  };
}

/**
 * Generate a mock tool event message
 */
export function generateToolEventMessage(
  toolName: string,
  result: string
): Message {
  return {
    role: "system",
    content: `Tool: ${toolName} → ${result}`,
    toolName,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate a realistic user message
 */
export function generateUserMessage(content: string): Message {
  return {
    role: "user",
    content,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate a realistic assistant response
 */
export function generateAssistantMessage(content: string): Message {
  return {
    role: "assistant",
    content,
    timestamp: new Date().toISOString(),
  };
}
