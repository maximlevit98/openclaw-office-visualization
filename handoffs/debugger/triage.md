# Triage Report — Cycle 1
> Generated: 2026-02-21 01:50 AM (Europe/Moscow)

## Summary
Pre-implementation analysis. No active bugs, but three spec observations flagged by QA that require clarification before development.

---

## Issue: OBS-1 — Gateway SDK API Contract Unconfirmed
**Severity:** LOW | **Status:** OPEN | **Phase:** Design

### Root Cause
Frontend plan assumes gateway RPC method signatures (e.g., `subscribeToEvents`, `listSessions`) but SDK is not yet finalized. This is normal pre-implementation, but mismatches will cascade into BFF integration.

### Impact Path
1. BFF spec (event-model.md) defines gateway event types as "subject to SDK confirmation"
2. Frontend (component-map.md) expects SSE events with specific shapes (presence, message, tool_event, session_update)
3. If gateway SDK changes event structure, BFF translation layer must adapt
4. Late changes = integration delays + potential client-side refactoring

### Evidence
- event-model.md Table "Gateway → BFF Events": explicitly marked "subject to SDK confirmation"
- No implementation yet, so risk is **deferred** but real

---

## Issue: OBS-2 — SSE Reconnect Gap Recovery Missing
**Severity:** LOW | **Status:** OPEN | **Phase:** Backend/Frontend Integration

### Root Cause
Event-model.md specifies:
- BFF buffers max 100 events / 60s during WS reconnect
- Browser should "re-fetch on reconnect if gap > buffer window"

**But:** No API contract endpoint supports this. Session list (`/api/sessions`) and message history (`/api/sessions/:key/history`) have no `since` parameter to fetch events after a specific timestamp.

### Impact Path
1. Client SSE disconnects for 90+ seconds
2. Client reconnects, BFF has no buffered events (window elapsed)
3. Client re-fetches `/api/sessions` and `/api/sessions/:key/history` (full state)
4. **Gap:** If backend processed new events during the 90s, client may miss them (race condition)

### Evidence
- event-model.md: "re-fetch on reconnect if gap > buffer window" (no implementation detail)
- component-map.md hooks: `useSessions`, `useHistory` — no temporal filtering
- No contract for "events since timestamp" in BFF API spec

---

## Issue: OBS-3 — Mobile Viewport Meta Not Mentioned
**Severity:** INFO | **Status:** DEFERRED | **Phase:** Frontend

### Root Cause
Spec explicitly defers mobile to Phase 4, but RootLayout (app/layout.tsx) should include proper viewport meta tag to avoid unexpected scaling on tablet browsers that land on the page.

### Impact Path
1. Tablet browser viewport defaults to 980px without meta tag
2. 3-column desktop layout breaks on tablet (columns too narrow)
3. User sees horizontal scroll or unexpected layout shift
4. Deferred as non-critical, but quick fix prevents poor UX

### Evidence
- component-map.md: "Mobile explicitly deferred but no viewport meta mentioned"
- RootLayout (app/layout.tsx) — will include meta setup but detail not yet documented

---

## Next Steps
1. **Gateway SDK**: Confirm `subscribeToEvents` and event shapes → update event-model.md
2. **SSE Gap Recovery**: Define `since` parameter for `/api/sessions` and `/api/sessions/:key/history`
3. **Viewport Meta**: Add `<meta name="viewport" content="width=device-width, initial-scale=1" />` to RootLayout
