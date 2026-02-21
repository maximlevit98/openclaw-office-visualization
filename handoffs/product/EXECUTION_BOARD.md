# 🚀 EXECUTION BOARD — Phase 1 (Cycle 4)

**Goal:** Ship real gateway integration for office-visualization MVP.  
**Timeline:** 6–8 hours (start now, target EOD)  
**Status:** 🟡 IN FLIGHT

---

## TOP 3 BACKEND TASKS

### ✅ BEFORE STARTING
```bash
# 1. Setup
echo "GATEWAY_TOKEN=<token_from_openclaw_gateway_status>" > .env.local

# 2. Verify current state
npm run build  # Should complete in 479ms with zero errors
npm run dev &  # Should start without crashing
sleep 2 && curl http://localhost:3000/api/sessions
# ^ Currently returns empty/mock data
```

### TASK-010 (BACKEND) — Real Gateway Adapter
**Owner:** Backend Engineer  
**Target:** 2 hours  
**Files:**
- `lib/gateway-adapter.ts` — Replace RPC call stubs with real implementation
- `app/api/stream/route.ts` — Implement SSE fan-out from gateway WebSocket

**Checklist:**
- [ ] `listSessions()` makes real `sessions_list` RPC call
- [ ] `getSessionHistory(key)` makes real `sessions_history` RPC call
- [ ] `sendToSession(key, msg)` makes real `sessions_send` RPC call
- [ ] `/api/stream` opens WS to gateway, translates events to SSE
- [ ] Retry logic + timeout working (already stubbed)
- [ ] **Test:** `curl http://localhost:3000/api/sessions` returns real sessions array

**Verify:**
```bash
npm run build
npm run dev &
sleep 2
curl -s http://localhost:3000/api/sessions | jq '.[] | {key, label}' | head -5
# Should print actual session objects, not empty
```

**Unblock:** Frontend TASK-011

---

### TASK-011 (FRONTEND) — Wire UI to Real API
**Owner:** Frontend Engineer  
**Target:** 3 hours  
**Files:**
- `app/page.tsx` — Replace mock data with real API calls
- `components/*.tsx` — Ensure all props come from real state
- `lib/types.ts` — Verify types match gateway responses

**Checklist:**
- [ ] Session list loads from `/api/sessions` (no mock)
- [ ] Selecting session loads history from `/api/sessions/:key/history`
- [ ] Message send goes to `/api/sessions/:key/send` + confirms delivery
- [ ] Tool events render (collapsed by default)
- [ ] Auto-scroll works; scroll-lock when user scrolls up
- [ ] **Test:** Send message in UI → appears in chat immediately

**Verify:**
```bash
npm run dev
# Open http://localhost:3000 in browser
# 1. Verify session list populated
# 2. Click session → history loads
# 3. Type & send message → appears in chat
# 4. No console errors (especially 401/403/network)
```

**Blocked by:** TASK-010

---

### TASK-012 (QA) — Phase 1 Acceptance Tests
**Owner:** Tester / Debugger  
**Target:** 1 hour (after Tasks 010+011)  
**Files:**
- `__tests__/integration-phase1.test.ts` — E2E test script
- `handoffs/tester/test-report.md` — Acceptance criteria checklist

**7 MVP Acceptance Criteria:**
```
1. [ ] Session list loads and updates without page refresh
2. [ ] Selecting session shows full message history in order
3. [ ] Sending message delivers via gateway and appears in chat
4. [ ] At least 5 agents display with correct avatars + status
5. [ ] Status changes (idle→thinking→tool→idle) reflect within 2s
6. [ ] Gateway token never exposed to client (code audit)
7. [ ] Layout usable on desktop (≥1024px)
```

**Verify:**
```bash
npm test __tests__/integration-phase1.test.ts
# All 7 criteria should pass
# Document results in test-report.md
```

**Blocked by:** TASK-011

---

## TOP 3 FRONTEND TASKS (Included Above)

See TASK-011 above.

---

## TOP 3 TESTER/QA TASKS (Included Above)

See TASK-012 above.

---

## CRITICAL UNBLOCK PATH

```
Frontend (TASK-011) waiting for Backend (TASK-010)
        ↑
        └─ Do TASK-010 first
           └─ Backend: Implement real gateway calls
           └─ Verify: curl test passes
           └─ Commit: git add -A && git commit -m "feat: real gateway integration"
           └─ Notify: Frontend that code is ready
                └─ Frontend: Pull, wire UI, test manually
                   └─ Commit: git add -A && git commit -m "feat: real API wiring"
                   └─ Notify: QA that UI is ready
                      └─ QA: Run acceptance tests
                         └─ Commit: results in test-report.md
                            └─ Gate: All 7 criteria pass?
                               └─ YES → Phase 2 approved
                               └─ NO → Debug + fix issues
```

**Parallelization:** All three tasks are sequential. Can't be parallelized because each depends on previous.

---

## ENVIRONMENT SETUP (One-Time)

```bash
# Get token
openclaw gateway status

# Create .env.local
cat > .env.local <<EOF
GATEWAY_TOKEN=<paste_token_here>
NEXT_PUBLIC_GATEWAY_URL=http://localhost:7070
EOF

# Install & verify
npm install
npm run build  # Should succeed
```

---

## QUICK COMMANDS (Copy/Paste Ready)

### Backend Starting Point
```bash
cd /Users/maxim/Documents/openclaw-office-visualization
# Edit lib/gateway-adapter.ts
# Replace listSessions() with real RPC call
npm run build
npm run dev &
sleep 2
curl http://localhost:3000/api/sessions | jq .
```

### Frontend Starting Point
```bash
cd /Users/maxim/Documents/openclaw-office-visualization
# Edit app/page.tsx
# Remove mock data, wire to /api/sessions
# Edit components to use real props
npm run dev
# Open http://localhost:3000 in browser
# Test session selection & message send
```

### QA Starting Point
```bash
cd /Users/maxim/Documents/openclaw-office-visualization
# Create __tests__/integration-phase1.test.ts
# Test all 7 acceptance criteria
npm test __tests__/integration-phase1.test.ts
# Document results in handoffs/tester/test-report.md
```

---

## GIT COMMIT TARGETS

After each task:

### Backend
```bash
git add lib/gateway-adapter.ts app/api/stream/route.ts
git commit -m "feat: implement real gateway adapter with RPC calls (TASK-010)"
git push
```

### Frontend
```bash
git add app/page.tsx components/
git commit -m "feat: wire UI components to real API endpoints (TASK-011)"
git push
```

### QA
```bash
git add __tests__/integration-phase1.test.ts handoffs/tester/
git commit -m "test: verify Phase 1 acceptance criteria (TASK-012)"
git push
```

---

## IF YOU GET STUCK

### Backend Issues
**Error:** `GATEWAY_TOKEN` not set  
→ Check `.env.local` exists and has token

**Error:** `connect ECONNREFUSED`  
→ Gateway not running; start it: `openclaw gateway start`

**Error:** RPC method not found  
→ Check gateway SDK docs for real method names (may differ from spec)

### Frontend Issues
**Error:** `Cannot read property of undefined`  
→ API is returning different shape than expected; check types.ts vs actual response

**Error:** `CORS error`  
→ Should not happen (same-origin); check BFF is proxying correctly

### QA Issues
**Error:** Tests fail  
→ Check Backend/Frontend are actually live (run both `npm run dev` in parallel)

**Error:** Criteria 6 (token exposed)  
→ Run: `strings .next/static/**/*.js | grep "GATEWAY_TOKEN"`  
→ Should return nothing. If it does, you have a security bug.

---

## PHASE 1 GATE CRITERIA

All of the following must be TRUE to exit Phase 1:

- ✅ Backend TASK-010 committed and verified with curl test
- ✅ Frontend TASK-011 committed and manual UI test passes
- ✅ QA TASK-012 committed with all 7 acceptance criteria signed off
- ✅ No security issues (token never in client)
- ✅ No TypeScript errors (`npm run build` clean)
- ✅ Git history shows all three commits

If any fail, debug and fix before proceeding to Phase 2.

---

## PHASE 2 (Next Cycle)

Once Phase 1 is ✅ done:
- **TASK-020:** Agent office panel with live presence
- **TASK-021:** Session sidebar filters
- **Target:** 2–3 hours
- **Gate:** 5+ agents visible with live status updates

---

**Last Updated:** 2026-02-21 03:04 (Europe/Moscow)  
**Duration to Complete:** 6–8 hours (from now)  
**Success Metric:** All 7 MVP acceptance criteria passing
