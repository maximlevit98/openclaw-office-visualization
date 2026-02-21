# Office Visualization — Execution Task Board

> Updated: 2026-02-21 03:04 (Cycle 4 — Execution Focused)

## 🚀 PHASE 1: CORE DATA FLOW (IN FLIGHT)

**Goal:** Sessions list + chat history rendering with live gateway data.

### Current Status
- ✅ **Phase 0 Complete:** Scaffold, API contract, design tokens all shipped
- 🟡 **Phase 1 In Progress:** Three parallel workstreams — Backend (BFF), Frontend (UI), QA (integration tests)
- 🔴 **Critical Blocker:** GATEWAY_TOKEN required for testing (blocking manual E2E, not code)

---

## 🟡 In Progress

### BACKEND — TASK-010: Implement Full Gateway Adapter with Real RPC Calls
- **Owner:** Backend Engineer
- **Phase:** 1 (core data flow)
- **Priority:** 🔥 CRITICAL — blocks all real testing
- **Files to Update:**
  - `lib/gateway-adapter.ts` — enhance with real RPC method calls
  - `app/api/stream/route.ts` — implement SSE fan-out from gateway WS
- **Acceptance Criteria:**
  - `listSessions()` calls real gateway RPC, returns actual session objects
  - `getSessionHistory(key)` returns real messages with correct ordering
  - `sendToSession(key, message)` delivers message to gateway
  - `GET /api/stream` opens WebSocket to gateway, forwards events as SSE
  - Retry logic + timeout handling in place (already stubbed)
  - **Test:** `curl -H "Authorization: Bearer $GATEWAY_TOKEN" http://localhost:3000/api/sessions` returns real data
- **Blockers:** Needs GATEWAY_TOKEN + running gateway (provide via `.env.local`)
- **Target Completion:** 2 hours
- **Commands:**
  ```bash
  # Setup
  echo "GATEWAY_TOKEN=<token>" > .env.local
  
  # Verify build
  npm run build
  
  # Test locally
  npm run dev &
  sleep 2
  curl -s http://localhost:3000/api/sessions | jq .
  ```

---

### FRONTEND — TASK-011: Wire Components to Real API Data
- **Owner:** Frontend Engineer
- **Phase:** 1 (core data flow)
- **Priority:** 🔥 CRITICAL — E2E integration blocker
- **Files to Update:**
  - `app/page.tsx` — replace mock data with real API fetches
  - `components/SessionList.tsx` — render from real sessions array
  - `components/MessagePanel.tsx` — render messages with tool events
  - `components/Sidebar.tsx` — add session filtering UI
  - `lib/types.ts` — ensure types match gateway responses
- **Acceptance Criteria:**
  - `npm run dev` starts without errors
  - Session list loads from `/api/sessions` (not mock)
  - Selecting a session loads real history from `/api/sessions/:key/history`
  - Message send hits `/api/sessions/:key/send` and confirms delivery
  - Tool call events render as collapsible (closed by default)
  - Auto-scroll works; scroll-lock on user scroll up
  - **Test:** Manually send message in UI → appears in chat
  - Mobile responsive NOT required (Phase 3)
- **Blockers:** Backend must have real gateway adapter working (TASK-010)
- **Target Completion:** 3 hours
- **Commands:**
  ```bash
  # Start dev server
  npm run dev
  
  # Manual test in browser: http://localhost:3000
  # 1. Observe session list loading
  # 2. Click session → verify history loads
  # 3. Type message → send → verify appears
  ```

---

### QA — TASK-012: Phase 1 Integration Test + Acceptance Criteria Verification
- **Owner:** Tester + Debugger
- **Phase:** 1 acceptance
- **Priority:** High — gates Phase 1 exit
- **Files to Create/Update:**
  - `__tests__/integration-phase1.test.ts` — end-to-end flow tests
  - `handoffs/tester/test-report.md` — final acceptance checklist
  - `handoffs/debugger/risk-check.md` — integration risks + mitigations
- **Acceptance Criteria (MVP):**
  1. ✅ Session list loads and updates without page refresh
  2. ✅ Selecting a session shows full message history in order
  3. ✅ Sending a message appears in chat and persists
  4. ✅ At least 5 agents display with live status (if gateway supports)
  5. ✅ Status changes reflect within 2 seconds
  6. ✅ Gateway token never exposed to client (code audit)
  7. ✅ Layout is usable on desktop (≥1024px)
- **Blockers:** Needs Backend (TASK-010) + Frontend (TASK-011) code to be runnable
- **Target Completion:** 1 hour (after Backend/Frontend done)
- **Commands:**
  ```bash
  # Run all tests
  npm test -- __tests__/integration-phase1.test.ts
  
  # Manual E2E checklist
  npm run dev
  # Open browser, test each acceptance criterion
  # Document results in test-report.md
  ```

---

## 🟢 Ready (Post Phase 1)

### FRONTEND — TASK-020: Agent Office Panel with Live Status
- **Owner:** Frontend Engineer
- **Phase:** 2 (agent presence)
- **Files:** `components/OfficePanel.tsx`, `hooks/usePresence.ts`
- **Blocking:** Phase 1 exit gate must pass first

### FRONTEND — TASK-021: Session Sidebar Filters
- **Owner:** Frontend Engineer
- **Phase:** 2 (polish)
- **Files:** `components/Sidebar.tsx`
- **Blocking:** Phase 1 exit gate must pass first

### BACKEND — TASK-030: Message Validation & Rate Limiting
- **Owner:** Backend Engineer
- **Phase:** 3 (hardening)
- **Files:** `app/api/sessions/[key]/send/route.ts`
- **Blocking:** Phase 2 exit gate must pass first

---

## ✅ Done

### TASK-000: Project Spec, Brief, Team Roles
- **Owner:** Product
- **Completed:** 2026-02-21 (Cycle 1–2)
- **Output:** BRIEF.md, TEAM_ROLES.md, spec.md, roadmap.md

### TASK-001: Gateway API Contract
- **Owner:** Backend Engineer
- **Completed:** 2026-02-21 (Cycle 2)
- **Output:** `handoffs/backend/api-contract.md`, `event-model.md`, `security-notes.md`

### TASK-002: Design System ("The Bullpen")
- **Owner:** Designer
- **Completed:** 2026-02-21 (Cycle 2)
- **Output:** `handoffs/designer/visual-direction.md`, `component-spec.md`

### TASK-003: App Scaffold & BFF Structure
- **Owner:** Frontend Engineer
- **Completed:** 2026-02-21 (Cycle 3)
- **Output:** Next.js 15 project, all API routes defined, components created
- **Status:** Builds successfully, zero TypeScript errors, 35/35 tests passing

### TASK-004: Robustness Improvements
- **Owner:** Debugger
- **Completed:** 2026-02-21 (Cycle 3)
- **Output:** Retry logic + timeout handling in gateway adapter
- **Evidence:** FIX-ROBUST-1 in fix-log.md

---

## Phase 1 Critical Path

```
TASK-010 (Backend)    ──→  Real gateway adapter + SSE
         ↓
TASK-011 (Frontend)   ──→  UI wired to real API
         ↓
TASK-012 (QA)         ──→  Acceptance criteria verified
         ↓
[Phase 1 Exit Gate]   ──→  All 7 acceptance criteria met
         ↓
Phase 2: Agent Office Panel + Presence Streaming
```

**Current Position:** Backend starting TASK-010; Frontend ready to start TASK-011 once Backend has code

**Unblock Order:**
1. Backend Engineer: Implement real RPC calls in `gateway-adapter.ts`
2. Frontend Engineer: Wire components to `/api/*` endpoints
3. Tester: Run acceptance criteria checklist
4. Product: Gate Phase 1 exit once all 7 criteria met

---

## How to Run Locally

### Prerequisites
1. Get gateway token: `openclaw gateway status`
2. Set environment:
   ```bash
   echo "GATEWAY_TOKEN=your_token_here" > .env.local
   ```
3. Ensure gateway is running on `localhost:7070` (or set `NEXT_PUBLIC_GATEWAY_URL`)

### Start Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Build for Production
```bash
npm run build
npm start
# Served on http://localhost:3000
```

### Run Tests
```bash
npm test
npm run build  # Full type check + bundle optimization
```

### Manual E2E Checklist
- [ ] Sessions load from gateway (not mock)
- [ ] Session selection shows real message history
- [ ] Sending a message works end-to-end
- [ ] Messages appear without page refresh
- [ ] Errors are handled gracefully
- [ ] Console shows no 401/403 errors (token valid)
- [ ] Token never logged or exposed

---

## Known Issues (OBS-*)

**OBS-1:** Gateway SDK API finalization pending → may need adapter tweaks  
**OBS-2:** SSE gap recovery needs `since` parameter (post-Phase 1)  
**OBS-3:** Mobile viewport deferred to Phase 4  

None of these block Phase 1.

---

## Contact

- **Product Lead:** Review phase gates, unblock dependencies
- **Backend:** TASK-010 owner — confirm RPC method names with gateway SDK
- **Frontend:** TASK-011 owner — test all user workflows
- **QA:** TASK-012 owner — verify acceptance criteria, document findings
