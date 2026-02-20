# Office Visualization — Product Spec

> Last updated: 2026-02-21 (Cycle 2)

## Overview
A dashboard that visualizes OpenClaw agents as office teammates with avatars, live statuses, and an integrated chat sidebar. Connects to OpenClaw Gateway via WebSocket + RPC. Visual direction: **"The Bullpen"** — warm newsroom/open-office metaphor (see `producer/concepts.md`).

## Users
- OpenClaw operator (single user, tailnet-only access)

## Core Screens

### 1. Session Sidebar (Left)
- List of active sessions, sorted by last activity
- Filter by: agent, status, keyword
- Unread indicator per session
- Click to load chat in main panel

### 2. Chat Panel (Center)
- Chronological message list (user + agent messages)
- Tool-call events rendered inline (**collapsible from day one** — per Producer)
- Message input bar at bottom; sends via Gateway RPC
- Auto-scroll on new messages; scroll-lock when user scrolls up
- No rich formatting in MVP — plain text send only

### 3. Agent Office Panel (Right)
- Grid of agent avatar cards
- Each card: avatar image, name, role label, live status badge
- Cards should feel like **desk nameplates** — avatar, name, role, status lamp (per Producer)
- Statuses: `idle` | `thinking` | `tool` | `error` | `offline`
- Click card → jump to that agent's most recent session in chat panel ("walk up to their desk" interaction)

## Data Contract (Gateway)
- **Sessions list** — RPC call, returns `{key, agentId, lastMessage, updatedAt}`
- **Session history** — RPC call with `sessionKey`, returns messages array
- **Send message** — RPC call with `sessionKey` + `message`
- **Presence stream** — WebSocket subscription, pushes `{agentId, status}` events

> Exact RPC method names and WS event shapes TBD by Backend Engineer — document in `handoffs/backend/api-contract.md`.

## Auth & Security
- **Gateway token stored server-side only** (env var or config file) — **non-negotiable** (Producer directive)
- UI served behind Tailscale; no public exposure by default
- No user auth layer in MVP (single operator assumed)

## Visual Direction
- **Theme:** "The Bullpen" — warm neutrals, not corporate blue (Producer directive)
- Light theme only for MVP
- Isometric spatial layout is **post-MVP** progressive enhancement; MVP uses flat card grid

## Responsive Layout
- **Desktop (≥1024px):** 3-column layout (sidebar | chat | office) — **primary target**
- **Tablet (768–1023px):** 2-column; office panel collapses to top bar with status dots
- **Mobile (<768px):** **Deferred** — desktop-first for a single-operator tailnet tool (Producer: NO-GO on mobile in Phase 3)

## MVP Scope
| Feature | In MVP | Post-MVP |
|---|---|---|
| Session list + filters | ✅ | |
| Chat history rendering | ✅ | |
| Message send (plain text) | ✅ | |
| Agent cards with live status | ✅ | |
| Tool-call collapsible events | ✅ | |
| Agent avatar upload/config | | ✅ |
| Notifications / sound alerts | | ✅ |
| Dark mode | | ✅ |
| Multi-user auth | | ✅ |
| Mobile layout | | ✅ |

## Acceptance Criteria (MVP)
1. Session list loads and updates in real-time without refresh.
2. Selecting a session shows full message history with correct ordering.
3. Sending a message from the input bar delivers via Gateway and appears in chat.
4. At least 5 agents displayed with correct avatars and live status badges.
5. Status changes (idle→thinking→tool→idle) reflect within 2 seconds.
6. Gateway token never exposed to browser (verified in code review).
7. Layout is usable on desktop viewport (≥1024px).

---

## Current Phase (Cycle 3)

**Phase 0: Foundation** is nearing completion:
- ✅ **Backend:** API contract documented (endpoint specs, SSE events, retry policy)
- ✅ **Designer:** Visual direction + component specs delivered ("The Bullpen" warm palette)
- 🟡 **Frontend:** App scaffold in progress (expected within 1 day)

**Phase 0 Exit Gate:** Once Frontend scaffold is running, all three phase-0 tasks complete. Phase 1 (Core Data Flow) will begin immediately.

**Owner Assignments:**
- **Product:** Continuous cycle monitoring, phase gate reviews, risk tracking
- **Backend Engineer:** TASK-004 (Phase 1) — implement Gateway adapter, BFF route handlers, SSE fan-out
- **Designer:** TASK-008 (Phase 2) — agent card design refinements, tablet responsive spec
- **Frontend Engineer:** TASK-003 (Cycle 3) → TASK-005/006/007 (Phase 1) — scaffold, sidebar, chat, input, office panel (parallel with Backend)

**No blockers.** All roles have clear outputs and acceptance criteria.
