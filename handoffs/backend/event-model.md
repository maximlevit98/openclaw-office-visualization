# Event Model — Real-Time Streaming

> Last updated: 2026-02-21 (Cycle 1 — initial draft)

## Overview

The BFF maintains a persistent WebSocket connection to the OpenClaw Gateway and translates gateway events into a simplified SSE stream for the browser.

```
Gateway (WS) → BFF (translate + filter) → Browser (SSE)
```

---

## Gateway → BFF Events

The BFF subscribes to gateway events via WebSocket. Expected raw event shapes (subject to SDK confirmation):

| Gateway Event | Maps To | Notes |
|---|---|---|
| Session activity | `session_update` | New session or updated timestamp |
| Agent status change | `presence` | Status transitions |
| New message in session | `message` | Both user and assistant messages |
| Tool invocation start/end | `tool_event` | Name, status, duration |

---

## BFF → Browser SSE Events

### Event: `presence`
Fired on agent status transitions.

```
event: presence
data: {"type":"presence","agentId":"backend","status":"thinking","ts":"2026-02-21T00:10:00Z"}
```

**Status lifecycle:**
```
offline → idle → thinking → tool → idle
                    ↘ error → idle
```

- `idle`: agent is online, no active work
- `thinking`: model inference in progress
- `tool`: executing a tool call
- `error`: last operation failed (auto-clears to idle after 30s or next activity)
- `offline`: no heartbeat received for >5 minutes

### Event: `message`
New message appended to a session.

```
event: message
data: {"type":"message","sessionKey":"session-abc","message":{"id":"msg-003","role":"assistant","text":"Done.","ts":"2026-02-21T00:10:05Z","toolCall":null}}
```

### Event: `tool_event`
Tool call lifecycle updates (for collapsible tool events in chat).

```
event: tool_event
data: {"type":"tool_event","sessionKey":"session-abc","toolCall":{"name":"web_search","status":"running","input":"{\"query\":\"...\"}","output":null,"durationMs":null,"ts":"2026-02-21T00:10:01Z"}}
```

Followed by a completion event:
```
event: tool_event
data: {"type":"tool_event","sessionKey":"session-abc","toolCall":{"name":"web_search","status":"success","input":"{\"query\":\"...\"}","output":"{\"results\":[...]}","durationMs":1200,"ts":"2026-02-21T00:10:02Z"}}
```

### Event: `session_update`
Session metadata changed (new session created, or activity timestamp updated).

```
event: session_update
data: {"type":"session_update","session":{"key":"session-abc","agentId":"backend","label":"main","updatedAt":"2026-02-21T00:10:05Z"}}
```

---

## Reconnection & Buffering

### Browser → BFF (SSE)
- `retry: 3000` header sent on connect (browser auto-reconnects)
- BFF tracks `Last-Event-ID`; replays missed events from a 60-second ring buffer (max 100 events)
- On reconnect, client should also re-fetch `/api/sessions` to reconcile state

### BFF → Gateway (WebSocket)
- Reconnect with exponential backoff: 1s → 2s → 4s → 8s → 16s → 30s (cap)
- During disconnect: BFF marks all agents as `offline` after 10s of failed reconnect
- On reconnect: full state refresh (re-fetch sessions list + agent statuses), then resume streaming

---

## Deduplication

- Each SSE event includes a unique `id` field (monotonic counter) for `Last-Event-ID` tracking
- Messages are deduplicated by `message.id` on the client side
- Tool events are deduplicated by `sessionKey + toolCall.name + toolCall.ts`

---

## Keepalive

BFF sends SSE comment (`: keepalive`) every 30 seconds to prevent proxy/browser timeout.
