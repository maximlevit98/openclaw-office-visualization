/**
 * Smoke Test — Office Visualization MVP
 * Minimal test to verify core types and exports are functional
 */

import {
  listSessions,
  getSessionHistory,
  sendToSession,
  listAgents,
  healthCheck,
} from "../lib/gateway-adapter";

// Types validation
import type { Message, Session, Agent, APIResponse, DashboardState } from "../lib/types";

describe("Office Visualization MVP — Smoke Tests", () => {
  describe("Type definitions", () => {
    it("should export Message type", () => {
      const msg: Message = {
        role: "user",
        content: "Hello",
        timestamp: new Date().toISOString(),
      };
      expect(msg.role).toBe("user");
      expect(msg.content).toBe("Hello");
    });

    it("should export Session type", () => {
      const session: Session = {
        key: "test-session-1",
        label: "Test Session",
        kind: "main",
        status: "active",
        messages: [],
      };
      expect(session.key).toBe("test-session-1");
      expect(session.status).toBe("active");
    });

    it("should export Agent type", () => {
      const agent: Agent = {
        id: "agent-1",
        name: "Test Agent",
        status: "online",
        kind: "worker",
      };
      expect(agent.id).toBe("agent-1");
      expect(agent.status).toBe("online");
    });

    it("should export APIResponse type", () => {
      const response: APIResponse<{ test: string }> = {
        data: { test: "value" },
      };
      expect(response.data?.test).toBe("value");
    });

    it("should export DashboardState type", () => {
      const state: DashboardState = {
        sessions: [],
        agents: [],
        selectedSession: null,
        loading: false,
        error: null,
      };
      expect(state.sessions).toEqual([]);
      expect(state.loading).toBe(false);
    });
  });

  describe("Gateway adapter exports", () => {
    it("should export listSessions function", () => {
      expect(typeof listSessions).toBe("function");
    });

    it("should export getSessionHistory function", () => {
      expect(typeof getSessionHistory).toBe("function");
    });

    it("should export sendToSession function", () => {
      expect(typeof sendToSession).toBe("function");
    });

    it("should export listAgents function", () => {
      expect(typeof listAgents).toBe("function");
    });

    it("should export healthCheck function", () => {
      expect(typeof healthCheck).toBe("function");
    });
  });

  describe("Core imports", () => {
    it("should compile TypeScript without errors", () => {
      // If we got here, all imports and types resolved correctly
      expect(true).toBe(true);
    });
  });
});

// Simple expect-like assertion for Node.js (no jest needed)
const expect = (value: any) => ({
  toBe: (expected: any) => {
    if (value !== expected) {
      throw new Error(`Expected ${expected}, got ${value}`);
    }
  },
  toEqual: (expected: any) => {
    if (JSON.stringify(value) !== JSON.stringify(expected)) {
      throw new Error(
        `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`
      );
    }
  },
});

const describe = (title: string, fn: () => void) => {
  console.log(`\n✓ ${title}`);
  fn();
};

const it = (title: string, fn: () => void) => {
  try {
    fn();
    console.log(`  ✓ ${title}`);
  } catch (error) {
    console.error(`  ✗ ${title}`);
    console.error(`    ${error}`);
    throw error;
  }
};

// Run tests
if (require.main === module) {
  describe("Office Visualization MVP — Smoke Tests", () => {
    describe("Type definitions", () => {
      it("should export Message type", () => {
        const msg: Message = {
          role: "user",
          content: "Hello",
          timestamp: new Date().toISOString(),
        };
        expect(msg.role).toBe("user");
        expect(msg.content).toBe("Hello");
      });

      it("should export Session type", () => {
        const session: Session = {
          key: "test-session-1",
          label: "Test Session",
          kind: "main",
          status: "active",
          messages: [],
        };
        expect(session.key).toBe("test-session-1");
        expect(session.status).toBe("active");
      });

      it("should export Agent type", () => {
        const agent: Agent = {
          id: "agent-1",
          name: "Test Agent",
          status: "online",
          kind: "worker",
        };
        expect(agent.id).toBe("agent-1");
        expect(agent.status).toBe("online");
      });

      it("should export APIResponse type", () => {
        const response: APIResponse<{ test: string }> = {
          data: { test: "value" },
        };
        expect(response.data?.test).toBe("value");
      });

      it("should export DashboardState type", () => {
        const state: DashboardState = {
          sessions: [],
          agents: [],
          selectedSession: null,
          loading: false,
          error: null,
        };
        expect(state.sessions).toEqual([]);
        expect(state.loading).toBe(false);
      });
    });

    describe("Gateway adapter exports", () => {
      it("should export listSessions function", () => {
        expect(typeof listSessions).toBe("function");
      });

      it("should export getSessionHistory function", () => {
        expect(typeof getSessionHistory).toBe("function");
      });

      it("should export sendToSession function", () => {
        expect(typeof sendToSession).toBe("function");
      });

      it("should export listAgents function", () => {
        expect(typeof listAgents).toBe("function");
      });

      it("should export healthCheck function", () => {
        expect(typeof healthCheck).toBe("function");
      });
    });
  });
}
