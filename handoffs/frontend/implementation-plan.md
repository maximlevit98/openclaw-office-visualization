# Implementation Plan — Frontend

> Last updated: 2026-02-21 (Cycle 1 — initial delivery)

## Phases

### Phase 1 — Scaffold & BFF (Day 1–2)

- [ ] `npx create-next-app` with TypeScript, Tailwind, App Router
- [ ] Define CSS custom properties from designer tokens in `globals.css`
- [ ] Set up project structure per `app-architecture.md`
- [ ] Implement `lib/gateway.ts` — server-only Gateway RPC client
  - Read token from `OPENCLAW_GATEWAY_TOKEN` env var
  - Wrap `sessions_list`, `sessions_history`, `sessions_send` calls
  - Retry policy: 3 retries, exponential backoff
- [ ] Implement BFF route handlers:
  - `GET /api/sessions` → proxy sessions list
  - `GET /api/sessions/:key/history` → proxy history
  - `POST /api/sessions/:key/send` → proxy send
  - `GET /api/agents` → return agent config (static JSON initially)
  - `GET /api/stream` → SSE endpoint (subscribe to Gateway WS, fan out)
- [ ] Verify token never leaks to client bundle (`import 'server-only'`)

### Phase 2 — Core Components (Day 3–5)

- [ ] Shared: `Avatar`, `StatusDot`, `StatusBadge`
- [ ] `RootLayout` — 3-column CSS grid
- [ ] `SessionSidebar` + `SessionRow` + `FilterBar`
  - Wire to `sessionStore` (Zustand)
  - SWR fetch via `useSessions`
  - Debounced filter (agent name / keyword)
- [ ] `ChatPanel` + `ChatHeader` + `MessageList` + `MessageBubble`
  - Wire to `sessionStore` for selected session + messages
  - SWR fetch via `useHistory` on session change
  - `useAutoScroll` — auto-scroll + scroll-lock detection
- [ ] `InputBar` — controlled textarea, Enter to send, Shift+Enter newline
  - `POST /api/sessions/:key/send`
  - Optimistic message append
- [ ] `ToolCallEvent` — collapsible, collapsed by default
  - Chevron rotation animation
  - Mono font for input/output

### Phase 3 — Office Panel & SSE (Day 6–7)

- [ ] `OfficePanel` + `AgentCard`
  - Fetch agents via `/api/agents`
  - Merge with `presenceStore` for live status
  - Card hover lift, status-specific border/opacity
  - Click → navigate to agent's most recent session
- [ ] `useSSE` hook
  - `EventSource` connection to `/api/stream`
  - Dispatch `presence` → `presenceStore.setStatus`
  - Dispatch `message` → `sessionStore.addMessage`
  - Dispatch `session_update` → `sessionStore.updateSession`
  - Dispatch `tool_event` → update tool call status in messages
  - Handle reconnect (EventSource auto-reconnect + manual fallback)
- [ ] Unread indicator on `SessionRow` (compare last-read timestamp)

### Phase 4 — Tablet Responsive & Polish (Day 8–9)

- [ ] Tablet breakpoint (768–1023px):
  - Sidebar → 64px icon strip, overlay expand on tap
  - Office panel → 52px top status strip with avatar dots
- [ ] "New messages" pill when scrolled up
- [ ] Loading skeletons for session list + chat history
- [ ] Empty states (no sessions, no messages, no agents)
- [ ] Error states (gateway unreachable, SSE disconnected)

### Phase 5 — Testing & Acceptance (Day 10)

- [ ] Unit tests: stores, hooks, utility functions
- [ ] Component tests: key interactions (select session, send message, toggle tool call)
- [ ] Manual testing against live Gateway
- [ ] Acceptance criteria verification (all 7 from spec)

## Dependencies

| Dependency | Status | Blocking |
|---|---|---|
| API contract (`backend/api-contract.md`) | ✅ Delivered | — |
| Component spec (`designer/component-spec.md`) | ✅ Delivered | — |
| Visual tokens (`designer/visual-direction.md`) | ✅ Delivered | — |
| Gateway SDK / RPC docs | ⏳ Pending | Phase 1 (can stub) |
| Agent config (names, roles, avatars) | ⏳ Pending | Phase 3 (can use defaults) |

## Risks

- **Gateway SDK not documented:** Mitigate by stubbing `lib/gateway.ts` with mock data; swap in real SDK when available.
- **SSE reliability:** EventSource has built-in reconnect but no buffering of missed events. May need to re-fetch on reconnect if gap > buffer window.
- **Agent config source unclear:** Start with static JSON file; move to Gateway-backed when available.

## Definition of Done

All items from product spec acceptance criteria:
1. ✅ Session list loads and updates real-time
2. ✅ Session selection shows correct history
3. ✅ Message send works end-to-end
4. ✅ 5+ agents with avatars and live status
5. ✅ Status changes reflect within 2s
6. ✅ Token never in browser
7. ✅ Desktop layout (≥1024px) is usable
