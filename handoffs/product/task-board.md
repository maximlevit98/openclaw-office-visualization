# Office Visualization — Execution Task Board

> Updated: 2026-02-21 04:04 (Cycle 4 — Execution Focused)

## 🚀 PHASE 1: CORE DATA FLOW (READY FOR INTEGRATION)

**Goal:** Verify real gateway integration end-to-end; ship Phase 1.

### Current Status
- ✅ **Phase 0 Complete:** Scaffold (✅), API contract (✅), design tokens (✅)
- ✅ **Phase 1 Code Complete:** Gateway adapter (✅), API routes (✅), frontend UI (✅), types (✅)
- 🟡 **Phase 1 Validation:** Integration tests + acceptance criteria needed
- 🔴 **Single Blocker:** `GATEWAY_TOKEN` env var (config, not code — required to test)

---

## 🟡 IN PROGRESS (THIS CYCLE)

### TASK-010 — Backend Gateway Adapter
- **Status:** ✅ **DONE** — Code review passed
- **Evidence:** 
  - `lib/gateway-adapter.ts` — Real RPC calls to `/api/sessions`, `/api/sessions/{key}/history`, `/api/sessions/{key}/send`, `/api/agents`
  - Retry logic + timeout (3 retries, 100ms–2000ms backoff)
  - Token server-side only (confirmed via `import 'server-only'`)
- **Verified:** `npm run build` → Success (486ms, zero errors)

---

### TASK-011 — Frontend API Integration
- **Status:** ✅ **DONE** — Code review passed
- **Evidence:**
  - `app/page.tsx` — Fetches from `/api/sessions`, `/api/agents`, `/api/sessions/{key}/history`
  - Fallback to mock data if API fails (graceful degradation)
  - Optimistic updates for message send
  - Auto-select first session on load
  - `components/MessagePanel.tsx` — Renders real messages with timestamps
  - `components/Sidebar.tsx` — Session list with selection + loading state
  - `components/OfficePanel.tsx` — Agent list with status
  - `lib/types.ts` — Session, Message, Agent types defined and exported
- **Verified:** `npm run build` → Success (7 routes, 108 kB First Load JS)

---

### TASK-012 — Phase 1 Integration Test & Acceptance Verification
- **Owner:** Tester + Debugger (THIS CYCLE)
- **Phase:** 1 acceptance gate
- **Priority:** 🔥 CRITICAL — gates Phase 1 exit
- **Files to Update/Create:**
  - `__tests__/integration-phase1.test.ts` — E2E flow tests (create if missing)
  - `handoffs/tester/test-report.md` — Acceptance criteria checklist
  - `handoffs/debugger/risk-check.md` — Security + integration risks

**7 MVP Acceptance Criteria (All Must Pass):**
1. Session list loads from gateway API (not mock)
2. Selecting session shows real message history in order
3. Sending message delivers via `/api/sessions/{key}/send` + appears in chat
4. At least 3 agents display with status
5. Gateway token never exposed to client (string grep of build output)
6. No 401/403/network errors in console (valid auth)
7. Layout usable on desktop (≥1024px)

**Blockers:** 
  - `GATEWAY_TOKEN` env var (required to test real data flow)
  - Gateway running on `localhost:7070` (or `NEXT_PUBLIC_GATEWAY_URL` set)

**Target Completion:** 2 hours (after token + gateway config)

**Unblock Instructions:**
```bash
# 1. Get token
openclaw gateway status
# Copy token from output

# 2. Set config
echo "GATEWAY_TOKEN=<paste_token>" > .env.local
echo "NEXT_PUBLIC_GATEWAY_URL=http://localhost:7070" >> .env.local

# 3. Verify build still works
npm run build

# 4. Start dev server
npm run dev &
sleep 2

# 5. Manual test
curl -s http://localhost:3000/api/sessions | jq '.[] | {key, label}' | head -3
# Should print real session objects

# 6. Open browser + test all 7 criteria
# Document results in handoffs/tester/test-report.md

# 7. Security audit
strings .next/static/**/*.js | grep "GATEWAY_TOKEN"
# Should return nothing (token not in client)
```

**Sign-Off:** Once all 7 criteria verified + test-report.md committed → Phase 1 DONE

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

### TASK-002: Design System
- **Owner:** Designer
- **Completed:** 2026-02-21 01:20 (Cycle 2)
- **Output:** `component-spec.md`, `visual-direction.md`

### TASK-003: App Scaffold & BFF + Real API Implementation
- **Owner:** Backend + Frontend Engineers
- **Completed:** 2026-02-21 03:20 (Cycle 3–4)
- **Output:** 
  - Next.js 15 full-stack app
  - All 5 API routes + real gateway integration
  - 4 components (Sidebar, MessagePanel, OfficePanel, not SessionList)
  - Type-safe adapter + error handling
- **Status:** ✅ Builds successfully (486ms), zero TypeScript errors, ready for testing

### TASK-004: Robustness & Error Handling
- **Owner:** Backend + Debugger
- **Completed:** 2026-02-21 03:20 (Cycle 4)
- **Output:** 
  - Retry logic (3 attempts, exponential backoff 100ms–2000ms)
  - Timeout handling (5s default, 2s health check)
  - Fallback to mock data on API failure (graceful degradation)
  - Error propagation with proper HTTP status codes
- **Evidence:** `lib/gateway-adapter.ts` (lines 15–80), `app/api/*/route.ts` (try-catch)

---

## Phase 1 Critical Path

```
TASK-010 (Backend)    ──→  Real gateway adapter ✅ DONE
TASK-011 (Frontend)   ──→  UI wired to real API ✅ DONE
         ↓
TASK-012 (QA)         ──→  Acceptance criteria verification (THIS CYCLE)
         ↓
[Phase 1 Exit Gate]   ──→  All 7 criteria verified + signed off
         ↓
Phase 2: Agent Office Panel + Live Presence
```

**Current Position:** Code complete. Waiting on:
1. `GATEWAY_TOKEN` environment variable
2. Gateway running on accessible port
3. QA to run integration tests
4. Product to sign off on Phase 1 gate

**Unblock Order (Sequential but Fast):**
1. Ops: Provide `GATEWAY_TOKEN` + confirm gateway URL
2. QA: Run all 7 acceptance criteria manually
3. QA: Document in `test-report.md`
4. Product: Review + sign off Phase 1

---

## How to Run Locally (Phase 1 Verification)

### Prerequisites (First Time Only)
```bash
# 1. Get gateway token
openclaw gateway status
# Copy GATEWAY_TOKEN from output

# 2. Create .env.local
cat > .env.local <<EOF
GATEWAY_TOKEN=<paste_token_from_step_1>
NEXT_PUBLIC_GATEWAY_URL=http://localhost:7070
EOF

# 3. Install dependencies
npm install
```

### Development Flow
```bash
# Start dev server
npm run dev
# Opens http://localhost:3000

# In another terminal, verify API
curl -s http://localhost:3000/api/sessions | jq '.[] | {key, label}' | head -3
```

### Verification Commands (Phase 1 Testing)
```bash
# Build verification
npm run build
# Expected: "Compiled successfully in ~480ms"

# Type check
npx tsc --noEmit
# Expected: "clean"

# API test (needs GATEWAY_TOKEN in .env.local)
curl -s http://localhost:3000/api/sessions | jq .
# Expected: real session array, not empty

# Security audit (token not in client)
strings .next/static/**/*.js | grep "GATEWAY_TOKEN"
# Expected: no output
```

### Manual Acceptance Checklist (7 Criteria)
- [ ] **1.** Sessions load without page refresh (api/sessions called on mount)
- [ ] **2.** Selecting session loads history in order
- [ ] **3.** Sending message appears in chat (optimistic + fetch confirm)
- [ ] **4.** 3+ agents visible in right panel
- [ ] **5.** No 401/403 errors in browser console
- [ ] **6.** Token never exposed (string grep clean)
- [ ] **7.** Layout usable on desktop ≥1024px

**Document in:** `handoffs/tester/test-report.md`

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
