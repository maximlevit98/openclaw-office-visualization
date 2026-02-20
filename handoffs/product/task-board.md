# Office Visualization — Task Board

> Updated: 2026-02-21 (Cycle 2)

## 🔴 Blocked
_(none)_

## 🟡 In Progress
_(none — awaiting role pickups)_

## 🟢 Ready (Phase 0)

### TASK-001: Document Gateway API Contract
- **Owner:** Backend Engineer
- **Phase:** 0
- **Priority:** 🔥 Critical path — blocks all data-dependent work
- **Description:** Investigate OpenClaw Gateway RPC methods and WebSocket events. Document request/response shapes for: sessions list, session history, send message, presence stream.
- **Output:** `handoffs/backend/api-contract.md`
- **Acceptance Criteria:**
  - All four endpoints documented with method names, params, and response schemas
  - Example payloads included
  - WebSocket event format specified (connection, subscription, event shape)
- **Blockers:** None (Gateway is running and accessible)
- **Producer note:** Keep the adapter thin — don't over-abstract.

### TASK-002: Design System Foundations
- **Owner:** Designer
- **Phase:** 0
- **Priority:** High — blocks all frontend component work
- **Description:** Define color palette (warm neutrals — not corporate blue, per Producer), typography scale, spacing tokens, and component sketches for: session list item, chat message bubble, agent card.
- **Output:** `handoffs/design/design-tokens.md` + `handoffs/design/components/`
- **Acceptance Criteria:**
  - Tokens defined as CSS custom properties or design-token JSON
  - Sketches/wireframes for 3 core components (session item, message bubble, agent card)
  - Light theme only for MVP
  - Visual direction aligns with "The Bullpen" concept (warm, newsroom feel)
- **Blockers:** None

### TASK-003: Scaffold Frontend App
- **Owner:** Frontend Engineer
- **Phase:** 0
- **Priority:** High — unblocks all frontend implementation
- **Description:** Initialize project with chosen framework (recommend Vite + React or SvelteKit, per Producer). Set up dev server, folder structure, linting, and a "hello world" route.
- **Output:** `handoffs/frontend/scaffold-notes.md` + working dev server
- **Acceptance Criteria:**
  - `npm run dev` starts local server
  - Project structure documented
  - Framework choice justified in scaffold notes
- **Blockers:** None
- **Note:** Can start in parallel with TASK-001 and TASK-002

## ✅ Done

### TASK-000: Product Spec, Roadmap & Task Board
- **Owner:** Product
- **Completed:** 2026-02-21
- **Output:** `spec.md`, `roadmap.md`, `task-board.md`

## Backlog (Phase 1+)

### TASK-004: Implement Gateway Adapter (Sessions + History + Send)
- **Owner:** Backend Engineer
- **Phase:** 1
- **Depends on:** TASK-001
- **Description:** Build server-side adapter that calls Gateway RPC, keeps token server-side, exposes clean API to frontend.
- **Acceptance Criteria:**
  - Server-side endpoints for sessions list, session history, send message
  - Gateway token never exposed to client
  - Error handling for Gateway unavailability

### TASK-005: Session Sidebar UI
- **Owner:** Frontend Engineer
- **Phase:** 1
- **Depends on:** TASK-002, TASK-003, TASK-004
- **Description:** Render session list with agent name, last message preview, timestamp. Selection loads chat.
- **Acceptance Criteria:**
  - Sessions sorted by last activity
  - Selecting a session loads history in chat panel
  - Filters as second pass within Phase 1

### TASK-006: Chat Panel UI
- **Owner:** Frontend Engineer
- **Phase:** 1
- **Depends on:** TASK-002, TASK-003, TASK-004
- **Description:** Render messages chronologically. Tool events collapsible inline.
- **Acceptance Criteria:**
  - Messages rendered with sender, timestamp, content
  - Tool events collapsible from day one
  - Auto-scroll with scroll-lock on user scroll-up

### TASK-007: Message Send
- **Owner:** Frontend Engineer
- **Phase:** 1
- **Depends on:** TASK-004
- **Description:** Input bar sends plain text via Gateway adapter.
- **Acceptance Criteria:**
  - Message appears in chat after send
  - Input clears on successful send
  - Basic error feedback on failure

### TASK-008: Agent Office Panel
- **Owner:** Frontend Engineer
- **Phase:** 2
- **Depends on:** TASK-002, Backend presence stream
- **Description:** Grid of agent cards with live status. Click navigates to session.
- **Acceptance Criteria:**
  - 5+ agents displayed with avatar, name, role, status badge
  - Status updates within 2s
  - Click card → loads agent's most recent session
