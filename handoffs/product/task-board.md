# Office Visualization — Execution Task Board

> Updated: 2026-02-21 06:04 (Cycle 7 — Phase 2 Final Push)

## 🎯 PHASE 2: LIVE PRESENCE & POLISH (NEARLY DONE)

**Goal:** Ship final 2 tasks → Phase 2 EXIT GATE

### Current Status (Cycle 7)
- ✅ **Phase 1 Complete:** Shipped + producer approved
- ✅ **TASK-020b DONE:** Real SSE stream (committed 4aea0a2)
- 🟡 **TASK-020a READY:** usePresence hook (20 min)
- 🟡 **TASK-021a READY:** Session filter integration (15 min)
- 🎯 **Timeline:** 40 minutes to Phase 2 exit

---

## 🟡 IN PROGRESS (Cycle 7 — FINAL PUSH)

### ✅ TASK-020b: Real SSE Stream Handler
- **Status:** COMPLETE & COMMITTED (4aea0a2)
- **Delivered:** 
  - Real agent presence streaming (not heartbeat-only stub)
  - Fetches initial agent list on client connect
  - Broadcasts agent_status events with full agent data
  - 30-second heartbeat + proper cleanup
  - Error handling + logging
- **Verified:** Build 511ms, zero errors

---

### 🟡 TASK-020a: `usePresence()` React Hook (START NOW)
- **Owner:** Frontend Engineer
- **Status:** READY TO START
- **Time:** 20 minutes
- **File:** Create `hooks/usePresence.ts`
- **What:** React hook that connects to `/api/stream` SSE
  - EventSource("/api/stream") subscription
  - JSON parsing of incoming events
  - Updates agents when type === "agent_status"
  - Cleanup on unmount
  - Returns { agents, connected, error }
- **Code Template:** See `CYCLE_7_EXECUTION.md` (copy/paste ready)
- **Acceptance:**
  - [ ] Connects to SSE on mount
  - [ ] Parses JSON events correctly
  - [ ] Updates agent list in real-time
  - [ ] Closes on unmount (no leaks)
  - [ ] `npm run build` succeeds

---

### 🟡 TASK-021a: Session Filter Integration (START AFTER 020a)
- **Owner:** Frontend Engineer
- **Status:** READY TO START (SessionSearch component exists)
- **Time:** 15 minutes
- **What:** Wire existing SessionSearch component into Sidebar
  - Import SessionSearch in Sidebar.tsx
  - Pass sessions array + callbacks
  - Show filtered results
- **Code:** See `CYCLE_7_EXECUTION.md` (integration instructions)
- **Acceptance:**
  - [ ] SessionSearch renders in Sidebar
  - [ ] Search filters sessions by label/key
  - [ ] Selected session still works
  - [ ] `npm run build` succeeds
  - [ ] No console errors

---

## 🟢 Ready (Post Phase 2)

### TASK-030: Message Validation & Rate Limiting
- **Owner:** Backend Engineer
- **Phase:** 3 (hardening)
- **Files:** `app/api/sessions/[key]/send/route.ts`
- **Goal:** Add max message length, rate limiting, spam prevention
- **Blocking:** Phase 2 exit gate must pass first
- **Timeline:** 1–2 hours (Phase 3)

---

## ✅ PHASE 1 COMPLETE (All Shipped)

### TASK-000: Project Spec, Brief, Team Roles ✅
- **Completed:** Cycle 1–2
- **Output:** BRIEF.md, TEAM_ROLES.md, spec.md, roadmap.md

### TASK-001: Gateway API Contract ✅
- **Completed:** Cycle 2
- **Output:** api-contract.md, event-model.md, security-notes.md

### TASK-002: Design System ✅
- **Completed:** Cycle 2–5
- **Output:** component-spec.md, visual-direction.md, design-tokens.ts
- **Latest:** Cycle 5 styling refinement (colors, animations, focus states)

### TASK-003: App Scaffold & BFF + Real API ✅
- **Completed:** Cycle 3–4
- **Output:** Next.js 15, 5 API routes, real gateway integration
- **Status:** ✅ Build: 481ms | Tests: 48/48 passing | TypeScript: clean

### TASK-004: Robustness & Error Handling ✅
- **Completed:** Cycle 4–5
- **Output:** Retry logic, timeout handling, health endpoint
- **Status:** ✅ FIX-ROBUST-1, FIX-ROBUST-2, FIX-ROBUST-3 shipped

### TASK-010: Real Gateway Adapter ✅
- **Completed:** Cycle 4
- **Output:** `lib/gateway-adapter.ts` with real RPC calls + retry
- **Status:** ✅ Shipped and verified

### TASK-011: Frontend API Integration ✅
- **Completed:** Cycle 4
- **Output:** `app/page.tsx`, 3 components, real API wiring
- **Status:** ✅ Shipped and verified

### TASK-012: Phase 1 Acceptance Tests ✅
- **Completed:** Cycle 4 + producer approval at 04:10
- **Output:** 7 MVP criteria verified, test-report.md signed off
- **Status:** ✅ PHASE 1 APPROVED BY PRODUCER (commit 1ab6a05)

---

## Phase 2 Critical Path (THIS CYCLE)

```
TASK-020b (Backend)    ──→  Real SSE stream handler (THIS CYCLE)
         ↓
TASK-020a (Frontend)   ──→  usePresence() hook (THIS CYCLE)
         ↓
TASK-021a (Frontend)   ──→  Session filter UI (THIS CYCLE)
         ↓
[Phase 2 Exit Gate]    ──→  Live presence verified + manual test passes
         ↓
Phase 3: Message Validation & Rate Limiting
```

**Current Position (Cycle 6, 05:04):** Phase 1 shipped. Phase 2 ready to start NOW.

**Execution Order (Parallel where possible):**
1. **Backend:** TASK-020b (real SSE) — 45 min
2. **Frontend:** TASK-020a (hook) + TASK-021a (filters) — 45 min + 45 min
3. **Parallel:** Both teams work on their tasks (no blocking dependencies)
4. **Verify:** All 3 tasks + tests + build
5. **Commit:** 2–3 clean commits per above

**Total Time:** 2–3 hours → Phase 2 complete by ~07:00–08:00 AM Moscow

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
