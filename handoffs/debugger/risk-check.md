# Risk Check — Cycle 4
> Updated: 2026-02-21 03:50 AM (Europe/Moscow) | Validation + error handling improvements

---

## Risk 1: Gateway SDK Integration Delay
**Issue:** OBS-1 | **Likelihood:** MEDIUM | **Impact:** MEDIUM (reduced by retry logic)

### Risk
If gateway SDK API contract is not finalized before BFF implementation starts, BFF code will be based on assumptions. When SDK is finally released, mismatches force BFF refactoring mid-sprint.

### Mitigation (Updated Cycle 3)
1. **Immediate:** Block BFF implementation start until gateway-rpc.md is locked
2. **Early:** Spike week 1: Gateway team publishes SDK with example events
3. **Design review:** Frontend + BFF review event shapes together before coding
4. **NEW:** Retry logic (FIX-ROBUST-1) makes brief integration hiccups tolerable
   - 3 retries + exponential backoff covers transient SDK/gateway issues
   - Reduces urgency of perfect API contract alignment day 1
   - Allows iterative refinement during integration week

### Detection
- If BFF starts coding before gateway-rpc.md is published → escalate
- If gateway SDK event shapes don't match event-model.md → find & fix in integration branch

### Fallback
- Stub gateway with mock events matching spec (allows parallel frontend work)
- Swap mock for real SDK when ready; should be drop-in if interfaces match
- Retry logic handles transient failures during swap

---

## Risk 2: SSE Reconnect Race Condition
**Issue:** OBS-2 | **Likelihood:** MEDIUM | **Impact:** MEDIUM

### Risk
If client SSE connection drops for >60s during active event stream:
1. Client reconnects but BFF buffer has expired
2. Client re-fetches `/api/sessions` and history
3. **Race:** If backend emits new event between step 2 fetch and step 3 reconnect, client never sees it

### Real Scenario
1. 00:00 — Client SSE connected, last event ID = 50
2. 00:90 — Client network drops (90s > 60s buffer window)
3. 00:91 — BFF has dropped events 0–50, buffer now has events 51+
4. 00:92 — Client reconnects, requests `GET /api/sessions?since=T`, re-fetches history
5. 00:93 — Backend emits new message (event 101) — *but client SSE just reopened without Last-Event-ID, so BFF starts from event 51*
6. **Result:** Client potentially misses event 101

### Mitigation
1. **Require:** `since` parameter on gap recovery endpoints (FIX-002)
2. **Test:** Inject network delay >60s in browser devtools, verify no message loss
3. **Monitor:** BFF logs reconnect events; track gap size + recovery time
4. **Design:** Browser SSE reconnect should block message input until recovery complete (show "syncing…")

### Detection
- End-to-end test: simulate 120s network disconnect, verify message appears after reconnect
- Monitoring: BFF metric `reconnect_gap_seconds` + `recovered_event_count`

### Fallback
- Accept "eventual consistency" — document in UI that long disconnects may miss events
- Provide manual "refresh" button for user to force re-sync if concerned

---

## Risk 3: Viewport Meta Tag Forgetting
**Issue:** OBS-3 | **Likelihood:** LOW | **Impact:** LOW

### Risk
RootLayout scaffolding forgets to add viewport meta tag. Tablet users see desktop layout with horizontal scroll or broken grid. Affects Phase 3 (mobile deferred to Phase 4, but tablets land on page anyway).

### Mitigation
1. **Checklist:** Add viewport meta to frontend scaffolding checklist
2. **Test:** Lighthouse audit on RootLayout; must include viewport meta
3. **Easy fix:** 1-line change in app/layout.tsx; include in FIX-003

### Detection
- Code review: RootLayout must have viewport meta before merge
- Regression test: Lighthouse audit in CI

### Fallback
- Hot-fix during Phase 3 UAT if missed during scaffolding

---

## Risk 4: Spec Drift During Implementation
**Issue:** All | **Likelihood:** MEDIUM | **Impact:** HIGH

### Risk
Component-map.md, event-model.md, and backend API contract are written before implementation. During development, engineers discover gaps, edge cases, or performance issues that force spec changes. Old handoff docs become stale, causing confusion.

### Mitigation
1. **Weekly sync:** Backend + BFF + Frontend 30-min standup on spec changes
2. **Handoff discipline:** Any spec change → update relevant .md file immediately
3. **Versioning:** Add `Last-updated` timestamp to each handoff (already done)
4. **Review gate:** PR must reference which handoff doc was updated

### Detection
- Stale docs: Check if `Last-updated` is >1 week old (during active dev)
- Spec gaps: If PR changes behavior not mentioned in component-map.md or event-model.md → stop, update docs

### Fallback
- Post-implementation: Audit-and-fix week to sync docs with actual code

---

## Risk 5: SSE Event Buffering Edge Cases
**Issue:** event-model.md | **Likelihood:** LOW | **Impact:** MEDIUM

### Risk
Event-model.md specifies 100 event / 60s buffer, but doesn't define behavior for:
- What if message is very large (e.g., 500KB tool output)?
- What if events arrive faster than 60s buffer can hold (e.g., burst of 150 events in 5s)?
- What if client has stale `Last-Event-ID` from crashed session?

### Mitigation
1. **Define:** BFF drops oldest events if buffer size exceeds 100 *or* 5MB (whichever first)
2. **Document:** Max event size (e.g., output truncated to 100KB for streaming events)
3. **Deduplication:** Client tracks `Last-Event-ID` per connection, not globally
4. **Test:** Stress test: send 500 events in 10s, verify no loss + buffer stays bounded

### Detection
- BFF metric: `buffer_overflow_events` (dropped due to size) + `buffer_overflow_time` (dropped due to age)
- Monitor: If overflow rate > 1% during load test → redesign buffer

### Fallback
- Accept buffer overflow, document in API: "Events may be dropped if buffer is full; use re-fetch on reconnect"

---

## Summary Table

| Risk | Issue | Likelihood | Impact | Owner | Mitigation |
|---|---|---|---|---|---|
| SDK integration delay | OBS-1 | MEDIUM | HIGH | Backend Lead | Block BFF until locked |
| SSE reconnect race | OBS-2 | MEDIUM | MEDIUM | BFF | Implement `since` param + test |
| Viewport meta forgotten | OBS-3 | LOW | LOW | Frontend | Add to checklist |
| Spec drift | All | MEDIUM | HIGH | Team Lead | Weekly sync + update gate |
| Buffer edge cases | event-model.md | LOW | MEDIUM | BFF | Define overflow policy |

---

---

## Cycle 4 Improvements (Validation & Error Handling)

### Risk Mitigation Added
- **Input Validation** — All parameters validated with bounds checking
- **Clear Error Messages** — 400/500 HTTP status codes distinguish error types
- **DoS Prevention** — Path params bounded, message size capped, limit constrained
- **Boundary Protection** — Timeout (0-3600s), message (1-10000 chars), limit (1-1000)

### Risk Reduction
| Risk | Before | After | Change |
|---|---|---|---|
| Invalid params reach gateway | HIGH | LOW | Validated before sending |
| Memory exhaustion from large messages | MEDIUM | LOW | 10KB max message size |
| Gateway overload from bad limits | MEDIUM | LOW | Limit capped at 1000 |
| Unclear error messages to clients | MEDIUM | LOW | Clear validation errors with 400 status |
| Path param attacks | MEDIUM | LOW | 256-char limit on session keys |

---

## Cycle 3 Improvements (Robustness)

### Risk Mitigation Added
- **Retry Logic** — All gateway calls now retry up to 3x on transient failures
- **Request Timeout** — 5-second timeout prevents indefinite hangs
- **Health Check Hardening** — 2-attempt health check with smart retry
- **Exponential Backoff** — Prevents thundering herd on brief outages

### Risk Reduction
| Risk | Before | After | Change |
|---|---|---|---|
| Gateway transient failure | HIGH | MEDIUM | Retries mask brief outages |
| Integration hiccups | MEDIUM | LOW | Retry logic + timeout = more tolerant |
| Indefinite hang risk | MEDIUM | LOW | 5s timeout bounds all requests |

---

## Approval
- [ ] Backend Lead: Confirms gateway SDK timeline
- [ ] BFF Lead: Confirms `since` param feasibility  
- [ ] Frontend Lead: Confirms viewport meta + handoff timeline
- [ ] QA Lead: Confirms test coverage for reconnect + buffer
- [ ] Ops Lead: Reviews retry config (maxRetries=3, timeoutMs=5000)
