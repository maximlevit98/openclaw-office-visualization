# Bug Triage — Debugger

> Last updated: 2026-02-21 01:32 (Cycle 1)

## Status: No open bugs

No implementation exists yet — tester has filed only pre-implementation observations.

## Observation Analysis

### OBS-1: Gateway SDK docs pending — LOW
**Root cause:** SDK method signatures unconfirmed; BFF event translation layer can't be finalized.
**Impact:** Integration mismatches at BFF ↔ Gateway boundary.
**Action:** No fix needed now. Will become blocking when backend implements WS connection. Monitor.

### OBS-2: SSE missed-event recovery undefined — MEDIUM (upgraded from LOW)
**Root cause:** No API endpoint supports `since`-based replay beyond the 60s/100-event ring buffer. If a browser disconnects for >60s, it has no way to request missed events—only a full `/api/sessions` re-fetch, which misses intermediate messages.
**Impact:** Users returning from sleep/background tab could see stale chat history until they manually switch sessions.
**Action:** Backend should add `?since=<ts>` param to `/api/sessions/:key/history` or accept `Last-Event-ID` in the SSE reconnect that triggers a longer replay. Flag to backend team.

### OBS-3: Viewport meta — INFO
**Root cause:** Mobile deferred, but missing viewport meta causes zoom issues on tablets.
**Impact:** Cosmetic only for Phase 3.
**Action:** Frontend should add `<meta name="viewport" ...>` in RootLayout. Trivial fix.

## Next Cycle
- Re-read bugs.md for any new entries once implementation begins.
