# Risk Check — Debugger

> Last updated: 2026-02-21 01:32 (Cycle 1)

## Active Risks

### RISK-1: Gateway SDK contract uncertainty — HIGH
**What:** BFF event model (event-model.md) defines 4 event types mapped from gateway WS events, but actual SDK shapes are unconfirmed.
**Impact:** Backend may need to rework the entire event translation layer once SDK is available.
**Mitigation:** Backend should code against an adapter/interface so the WS parsing layer is swappable.

### RISK-2: SSE reconnect data loss window — MEDIUM
**What:** 60s ring buffer is the only replay mechanism. Longer disconnects lose events silently.
**Impact:** Stale UI state after laptop sleep, network blips >60s, or tab backgrounding.
**Mitigation:** Add history `since` param; frontend re-fetches full session list + active session history on reconnect.

### RISK-3: Tool event deduplication fragile — LOW
**What:** Dedup key is `sessionKey + toolCall.name + toolCall.ts`. Two rapid calls to the same tool in the same second would collide.
**Impact:** Duplicate or swallowed tool events in chat view.
**Mitigation:** Add a unique `toolCallId` to tool_event payloads.

## Resolved Risks

_None._
