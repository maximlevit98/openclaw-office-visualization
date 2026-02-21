#!/usr/bin/env node
/**
 * Smoke Test — Office Visualization MVP
 * Verifies core exports and basic functionality
 * Run with: node __tests__/smoke.mts
 */

import {
  listSessions,
  getSessionHistory,
  sendToSession,
  listAgents,
  healthCheck,
} from "../lib/gateway-adapter.js";

import type {
  Message,
  Session,
  Agent,
  APIResponse,
  DashboardState,
} from "../lib/types.js";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | boolean): void {
  try {
    const result = fn();
    if (result === false) throw new Error("Assertion failed");
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error}`);
    failed++;
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

// === Type Validation Tests ===
console.log("\n📋 Type Definitions\n");

test("Message type is valid", () => {
  const msg: Message = {
    role: "user",
    content: "Hello",
    timestamp: new Date().toISOString(),
  };
  assert(msg.role === "user", "role should be 'user'");
  assert(msg.content === "Hello", "content should match");
});

test("Session type is valid", () => {
  const session: Session = {
    key: "test-session-1",
    label: "Test Session",
    kind: "main",
    status: "active",
    messages: [],
  };
  assert(session.key === "test-session-1", "key should match");
  assert(session.status === "active", "status should be 'active'");
  assert(Array.isArray(session.messages), "messages should be an array");
});

test("Agent type is valid", () => {
  const agent: Agent = {
    id: "agent-1",
    name: "Test Agent",
    status: "online",
    kind: "worker",
  };
  assert(agent.id === "agent-1", "id should match");
  assert(agent.status === "online", "status should be 'online'");
});

test("APIResponse type is valid", () => {
  const response: APIResponse<{ test: string }> = {
    data: { test: "value" },
    error: undefined,
  };
  assert(response.data?.test === "value", "data should be accessible");
});

test("DashboardState type is valid", () => {
  const state: DashboardState = {
    sessions: [],
    agents: [],
    selectedSession: null,
    loading: false,
    error: null,
  };
  assert(state.sessions.length === 0, "sessions should be empty array");
  assert(state.loading === false, "loading should be false");
});

// === Gateway Adapter Tests ===
console.log("\n🔌 Gateway Adapter\n");

test("listSessions is exported", () => {
  assert(typeof listSessions === "function", "listSessions should be a function");
});

test("getSessionHistory is exported", () => {
  assert(
    typeof getSessionHistory === "function",
    "getSessionHistory should be a function"
  );
});

test("sendToSession is exported", () => {
  assert(
    typeof sendToSession === "function",
    "sendToSession should be a function"
  );
});

test("listAgents is exported", () => {
  assert(typeof listAgents === "function", "listAgents should be a function");
});

test("healthCheck is exported", () => {
  assert(typeof healthCheck === "function", "healthCheck should be a function");
});

// === Summary ===
console.log(`\n${"=".repeat(50)}`);
console.log(`Tests passed: ${passed}`);
console.log(`Tests failed: ${failed}`);
console.log(`${"=".repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
