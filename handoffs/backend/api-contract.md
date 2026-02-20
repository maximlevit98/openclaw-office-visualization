# API Contract — Backend ↔ Frontend

> Last updated: 2026-02-21 (Cycle 1 — initial draft)

## Architecture

```
Browser ←→ BFF (Node server) ←→ OpenClaw Gateway (WS+RPC)
```

The BFF (backend-for-frontend) holds the gateway token and proxies all requests. The browser never talks to Gateway directly.

---

## REST Endpoints (BFF → Browser)

### `GET /api/sessions`

Returns active sessions list.

**Response:**
```json
{
  "sessions": [
    {
      "key": "session-abc123",
      "agentId": "backend",
      "label": "backend-main",
      "lastMessage": { "role": "assistant", "text": "Done.", "ts": "2026-02-21T00:15:00Z" },
      "updatedAt": "2026-02-21T00:15:00Z"
    }
  ]
}
```

**Query params:**
- `agentId` — filter by agent (optional)
- `status` — filter by status (optional)
- `limit` — max results (default 50)

---

### `GET /api/sessions/:sessionKey/history`

Returns message history for a session.

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-001",
      "role": "user" | "assistant" | "system" | "tool",
      "text": "Hello",
      "ts": "2026-02-21T00:10:00Z",
      "toolCall": null
    },
    {
      "id": "msg-002",
      "role": "tool",
      "text": null,
      "ts": "2026-02-21T00:10:01Z",
      "toolCall": {
        "name": "web_search",
        "input": "{\"query\":\"weather\"}",
        "output": "{\"results\":[...]}",
        "durationMs": 1200,
        "status": "success" | "error"
      }
    }
  ]
}
```

**Query params:**
- `limit` — max messages (default 100)
- `before` — cursor for pagination (message id)
- `includeTools` — boolean, default `true`

---

### `POST /api/sessions/:sessionKey/send`

Send a message into a session.

**Request:**
```json
{ "message": "Hello agent" }
```

**Response:**
```json
{ "ok": true }
```

Errors: `400` (empty message), `404` (session not found), `502` (gateway unreachable).

---

### `GET /api/agents`

Returns configured agents with metadata for office panel.

**Response:**
```json
{
  "agents": [
    {
      "id": "backend",
      "name": "Backend",
      "role": "Backend Engineer",
      "avatar": "/avatars/backend.png",
      "status": "idle"
    }
  ]
}
```

Avatar path convention: `/avatars/{agentId}.png`. Fallback to initials if missing (frontend handles).

---

## WebSocket — Server-Sent Events (SSE alternative)

### `GET /api/stream` (SSE)

Single SSE connection for all real-time updates. Preferred over WebSocket for simplicity.

**Event types:**

#### `presence`
```json
{ "type": "presence", "agentId": "backend", "status": "thinking", "ts": "2026-02-21T00:10:00Z" }
```
Statuses: `idle` | `thinking` | `tool` | `error` | `offline`

#### `message`
```json
{ "type": "message", "sessionKey": "session-abc123", "message": { "id": "msg-003", "role": "assistant", "text": "Here you go.", "ts": "..." } }
```

#### `session_update`
```json
{ "type": "session_update", "session": { "key": "...", "agentId": "...", "updatedAt": "..." } }
```

#### `tool_event`
```json
{ "type": "tool_event", "sessionKey": "session-abc123", "toolCall": { "name": "exec", "status": "running" | "success" | "error", "durationMs": null, "ts": "..." } }
```

---

## BFF ↔ Gateway Communication

The BFF uses the OpenClaw Gateway SDK/RPC:
- `sessions_list` → populates `/api/sessions`
- `sessions_history` → populates `/api/sessions/:key/history`
- `sessions_send` → backs `/api/sessions/:key/send`
- Gateway WebSocket subscription → fans out as SSE to browser

### Retry Policy
- RPC calls: 3 retries, exponential backoff (500ms, 1s, 2s), timeout 10s per attempt
- SSE reconnect: client uses `EventSource` built-in reconnect (server sends `retry: 3000`)
- Gateway WS reconnect: BFF reconnects with backoff (1s, 2s, 4s, max 30s), buffers events during reconnect window (max 100 events / 60s)

---

## Error Responses

All endpoints return:
```json
{ "error": "human-readable message", "code": "GATEWAY_UNAVAILABLE" | "SESSION_NOT_FOUND" | "INVALID_INPUT" }
```

HTTP status codes: `400`, `404`, `500`, `502` (gateway down).

---

## Open Items

- [ ] Confirm gateway RPC method signatures once SDK docs are available
- [ ] Decide on avatar upload endpoint (post-MVP)
- [ ] Rate limiting on `/send` (post-MVP, single user for now)
