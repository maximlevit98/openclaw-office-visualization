# Bug Log — Office Visualization MVP

> Last updated: 2026-02-21 (Cycle 1)

## Open Bugs

_None — no implementation to test yet._

## Spec Observations (Pre-Implementation)

### OBS-1: Gateway SDK docs pending — LOW
The API contract and implementation plan both note that gateway RPC method signatures are unconfirmed. Frontend plans to stub, but mismatches may surface during integration.

### OBS-2: SSE missed-event recovery undefined — LOW
The API contract mentions BFF buffers max 100 events / 60s during WS reconnect, but there's no documented strategy for what happens if the client SSE disconnects and misses events beyond the buffer window. Frontend plan mentions "re-fetch on reconnect if gap > buffer window" but no contract endpoint supports this (e.g., no `since` parameter on session list or history).

### OBS-3: Mobile explicitly deferred but no viewport meta mentioned — INFO
Spec says mobile is NO-GO for Phase 3, but implementation plan should ensure viewport meta tag is set correctly to avoid unexpected scaling on tablet.

## Closed Bugs

_None._
