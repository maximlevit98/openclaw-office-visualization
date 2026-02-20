# Office Visualization — Roadmap

> Last updated: 2026-02-21 (Cycle 2)

## Phase 0: Foundation ← CURRENT (Approved ✅)
**Goal:** Project scaffolding, data contract, design tokens.
- [ ] Backend: Document Gateway RPC/WS API contract → `handoffs/backend/api-contract.md`
- [ ] Designer: Design system tokens (warm neutrals palette, typography, spacing) + component sketches → `handoffs/design/`
- [ ] Frontend: Scaffold app (framework choice, project structure, dev server) → `handoffs/frontend/`
- [x] Product: Spec + roadmap + task board ✅

**Exit criteria:** API contract documented, app scaffold running, design tokens defined.
**Status:** Waiting on Backend, Designer, and Frontend deliverables. No blockers.

## Phase 1: Core Data Flow (Approved ✅)
**Goal:** Sessions list + chat history rendering with real data.
- [ ] Backend: Implement Gateway adapter (sessions list, session history, send message) — keep adapter thin (Producer)
- [ ] Frontend: Session sidebar with list + selection — filters in second pass within Phase 1
- [ ] Frontend: Chat panel rendering messages + tool events (collapsible from day one)
- [ ] Frontend: Message send input bar (plain text only)

**Exit criteria:** Can browse sessions, read history, and send a message through the UI.
**Gating:** Phase 0 exit criteria met.

## Phase 2: Agent Office Panel (Approved conditionally ⏳)
**Goal:** Agent cards with live presence.
- [ ] Backend: Presence/status WebSocket stream
- [ ] Designer: Agent card component design (desk nameplate feel)
- [ ] Frontend: Agent grid with avatar, name, role, status badge
- [ ] Frontend: Click-to-navigate from card to session

**Exit criteria:** 5+ agents visible with live status updates within 2s.
**Gating:** Phase 1 exit criteria met. Final GO from Producer after Phase 1 ships.

## Phase 3: Polish (NO-GO 🚫 — premature)
**Goal:** UX refinements. Mobile deferred.
- Scroll/loading/error UX — scope during Phase 2
- QA pass against all MVP acceptance criteria
- Mobile/tablet layout — **deferred** (not blocking MVP)

**Gating:** Revisit after Phase 2 delivers.

## Post-MVP (NO-GO 🚫 — backlog)
- Avatar upload/configuration UI
- Notification sounds
- Dark mode / theming
- Multi-user auth
- Session search / full-text
- Isometric spatial office layout
