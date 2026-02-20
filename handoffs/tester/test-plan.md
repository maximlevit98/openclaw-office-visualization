# Test Plan — Office Visualization MVP

> Last updated: 2026-02-21 (Cycle 1 — initial plan, pre-implementation)

## Scope

Testing against the 7 acceptance criteria from `product/spec.md` plus security, API contract, and responsive layout.

## Test Categories

### TC-1: Session List (Acceptance Criteria #1)
- **TC-1.1** Session list loads on page open with correct data shape (`key`, `agentId`, `label`, `lastMessage`, `updatedAt`)
- **TC-1.2** New session appears without page refresh (via SSE `session_update`)
- **TC-1.3** Session list sorts by `updatedAt` descending
- **TC-1.4** Filter by agent name works with debounce
- **TC-1.5** Filter by keyword works
- **TC-1.6** Unread indicator appears for sessions with new messages

### TC-2: Chat History (Acceptance Criteria #2)
- **TC-2.1** Selecting a session loads full message history in correct chronological order
- **TC-2.2** Messages display correct role (user/assistant/system/tool)
- **TC-2.3** Tool call events render inline and are **collapsible, collapsed by default**
- **TC-2.4** Tool call shows name, input, output, duration, status
- **TC-2.5** Auto-scroll on new messages
- **TC-2.6** Scroll-lock when user scrolls up; "new messages" pill appears
- **TC-2.7** Pagination works (loading older messages via `before` cursor)

### TC-3: Message Send (Acceptance Criteria #3)
- **TC-3.1** Typing + Enter sends message via `POST /api/sessions/:key/send`
- **TC-3.2** Shift+Enter inserts newline (does not send)
- **TC-3.3** Sent message appears optimistically in chat
- **TC-3.4** Empty message is rejected (400)
- **TC-3.5** Send to nonexistent session returns 404

### TC-4: Agent Office Panel (Acceptance Criteria #4)
- **TC-4.1** At least 5 agents display with avatar, name, role, status badge
- **TC-4.2** Missing avatar falls back to initials
- **TC-4.3** Click agent card → navigates to agent's most recent session
- **TC-4.4** Cards have hover lift effect

### TC-5: Live Status Updates (Acceptance Criteria #5)
- **TC-5.1** Status change via SSE `presence` event reflects on agent card within 2s
- **TC-5.2** All statuses render correctly: idle, thinking, tool, error, offline
- **TC-5.3** SSE reconnects automatically on disconnect
- **TC-5.4** Missed events during disconnect recovered by re-fetch

### TC-6: Security (Acceptance Criteria #6)
- **TC-6.1** Gateway token not present in any client-side JS bundle
- **TC-6.2** Gateway token not in any HTTP response to browser
- **TC-6.3** `lib/gateway.ts` uses `import 'server-only'`
- **TC-6.4** BFF endpoints don't expose raw gateway errors with sensitive info

### TC-7: Layout (Acceptance Criteria #7)
- **TC-7.1** Desktop (≥1024px): 3-column layout renders correctly
- **TC-7.2** Tablet (768–1023px): sidebar collapses to icon strip, office panel to top strip
- **TC-7.3** No horizontal overflow at any supported breakpoint

### TC-8: API Contract Compliance
- **TC-8.1** `GET /api/sessions` response matches contract schema
- **TC-8.2** `GET /api/sessions/:key/history` response matches contract schema
- **TC-8.3** `POST /api/sessions/:key/send` request/response matches contract
- **TC-8.4** `GET /api/agents` response matches contract schema
- **TC-8.5** `GET /api/stream` SSE events match documented event types
- **TC-8.6** Error responses follow `{ error, code }` shape with correct HTTP codes
- **TC-8.7** Retry policy: 3 retries with exponential backoff on RPC failures

### TC-9: Error & Edge Cases
- **TC-9.1** Gateway unreachable → appropriate error state in UI
- **TC-9.2** SSE disconnected → reconnect indicator shown
- **TC-9.3** Empty states: no sessions, no messages, no agents
- **TC-9.4** Loading skeletons appear during fetch

## Test Approach

- **Unit tests:** Zustand stores, hooks, utility functions (Jest/Vitest)
- **Component tests:** React Testing Library for key interactions
- **API tests:** Contract validation against BFF endpoints (supertest or similar)
- **Manual testing:** Live gateway integration, visual layout, SSE behavior
- **Security audit:** Static analysis of client bundle for token leakage

## Current Status

⏳ **Blocked — no implementation exists yet.** All test cases are defined against the spec; execution begins when code is delivered.
