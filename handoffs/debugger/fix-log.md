# Fix Log — Cycle 1
> Generated: 2026-02-21 01:50 AM (Europe/Moscow) | Status: All proposed fixes pending implementation

---

## FIX-001: Confirm Gateway SDK API Contract
**Issue:** OBS-1 | **Severity:** LOW | **Owner:** Backend Lead

### Fix Plan
1. Finalize gateway RPC method signatures:
   - `subscribeToEvents(sessionFilter?, agentFilter?)` → yields events matching filter
   - `listSessions()` → returns Session[]
   - `getSessionHistory(sessionKey, limit?, offset?)` → returns Message[]
2. Document expected event payloads with examples (async, sync, error cases)
3. Publish updated API contract to handoffs/backend/gateway-rpc.md
4. Frontend + BFF can then stub → integrate with confidence

### Verification
- [ ] gateway-rpc.md exists and matches BFF expectations
- [ ] BFF event-model.md updated with confirmed shapes
- [ ] No "TBD" or "subject to SDK confirmation" in event types
- [ ] Integration test: BFF receives gateway event → translates → sends SSE with correct shape

### Timeline
- Target: Before BFF implementation begins
- Blocker for: BFF translation layer, frontend SSE handler

---

## FIX-002: Implement SSE Gap Recovery Endpoint
**Issue:** OBS-2 | **Severity:** LOW | **Owner:** BFF

### Fix Plan
1. Add `since` (ISO 8601 timestamp) query parameter to:
   - `GET /api/sessions` → return only sessions updated after `since`
   - `GET /api/sessions/:key/history` → return only messages after `since`
2. BFF: On client reconnect, check elapsed time vs buffer window
   - If `elapsed <= 60s`: trust `Last-Event-ID`, client will receive buffered events
   - If `elapsed > 60s`: client must call `GET /api/sessions?since=<lastSeenTs>` + `GET /api/sessions/:key/history?since=<lastSeenTs>`
3. Document in API contract: "Query parameters `since` are optional; omit to fetch all"

### Verification
- [ ] `GET /api/sessions?since=2026-02-21T00:00:00Z` returns only modified sessions
- [ ] `GET /api/sessions/:key/history?since=2026-02-21T00:05:00Z` returns only newer messages
- [ ] Browser SSE reconnect logic tests gap scenarios (30s, 60s, 120s)
- [ ] No duplicate messages after gap recovery

### Timeline
- Target: Before frontend integration test
- Blocker for: Frontend reconnect logic, end-to-end testing

---

## FIX-003: Add Viewport Meta Tag to RootLayout
**Issue:** OBS-3 | **Severity:** INFO | **Owner:** Frontend

### Fix Plan
1. Open `app/layout.tsx` (RootLayout component)
2. Add to `<head>`:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
   ```
3. Ensure 3-column grid scales gracefully (optional: add tablet breakpoint for future mobile phase)
4. Test on tablet viewport (768px width)

### Verification
- [ ] Viewport meta tag present in app/layout.tsx head
- [ ] No horizontal scroll on 768px width (tablet portrait)
- [ ] Zoom works (user can pinch-zoom if needed)
- [ ] Desktop 3-column layout unaffected

### Timeline
- Target: During frontend scaffolding (before component implementation)
- Not a blocker; fix is trivial, prevents poor UX

---

## Summary
| Fix | Status | Owner | Timeline | Blocker? |
|---|---|---|---|---|
| FIX-001 (Gateway SDK) | Pending | Backend | Pre-BFF | Yes |
| FIX-002 (Gap Recovery) | Pending | BFF | Pre-Integration Test | Yes |
| FIX-003 (Viewport Meta) | Pending | Frontend | Scaffolding | No |
