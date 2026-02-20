# Producer Approval — Office Visualization

_Last updated: 2026-02-21_

## Active Direction
**Concept A: "The Bullpen"** — spatial office metaphor with expressive agent cards. See `concepts.md`.

---

## Phase 0: Foundation — **GO** ✅
All items approved. This is table-stakes scaffolding.

| Item | Decision | Rationale |
|---|---|---|
| Backend: API contract doc | GO | Blocks everything else. Top priority. |
| Designer: Design tokens + sketches | GO | Align on visual language before any frontend work. Request: lean into the "Bullpen" warmth — warm neutrals, not corporate blue. |
| Frontend: App scaffold | GO | Pick framework and get dev server running. Recommend Next.js or plain Vite+React — keep it simple. |
| Product: Spec + roadmap | GO (done) | Solid spec. No changes needed. |

## Phase 1: Core Data Flow — **GO** ✅
Approved to begin as soon as Phase 0 exits.

| Item | Decision | Rationale |
|---|---|---|
| Backend: Gateway adapter | GO | Sessions list + history + send. Keep the adapter thin — don't over-abstract. |
| Frontend: Session sidebar | GO | Start with a simple list; filters can come in a second pass within Phase 1. |
| Frontend: Chat panel | GO | Messages + tool events. Tool events should be collapsible from day one — don't bolt it on later. |
| Frontend: Message send | GO | Basic input bar. No rich formatting in MVP. |

## Phase 2: Agent Office Panel — **GO (conditional)** ⏳
Approved in principle. Final GO after Phase 1 exit criteria are met.

| Item | Decision | Rationale |
|---|---|---|
| Backend: Presence stream | GO | WebSocket presence is core to the concept. |
| Designer: Agent card design | GO | This is where "The Bullpen" identity lives. Cards should feel like desk nameplates — avatar, name, role, status lamp. |
| Frontend: Agent grid | GO | Simple responsive grid. Isometric layout is post-MVP. |
| Frontend: Card → session nav | GO | Essential for the "walk up to their desk" interaction. |

## Phase 3: Polish & Responsive — **NO-GO (premature)** 🚫
Not approved yet. Revisit after Phase 2 delivers.

| Item | Decision | Rationale |
|---|---|---|
| Mobile/tablet layout | NO-GO | Desktop-first for a single-operator tailnet tool. Mobile is nice-to-have, not blocking. |
| Scroll/loading/error UX | Deferred | Important but scope it during Phase 2, not now. |
| QA pass | Deferred | Meaningless until features exist. |

## Post-MVP — **NO-GO** 🚫
Backlog stays backlog. No work until MVP ships.

---

## Standing Notes
- **Token security is non-negotiable.** Gateway token must never touch the browser. Verify in Phase 1 code review.
- **Keep scope tight.** Every "quick addition" costs a cycle. If it's not on the roadmap, it waits.
- **Ship ugly, then polish.** Functional MVP > pixel-perfect vaporware.
