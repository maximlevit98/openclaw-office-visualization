# Producer Approval — Office Visualization

> Reviewed: 2026-02-21 01:25 MSK (Cycle 2)

## Visual Direction

| Concept | Verdict | Notes |
|---|---|---|
| A: "The Bullpen" | **GO ✅** | Active direction. Spatial metaphor nails the brief. MVP uses flat cards; isometric is post-MVP. |
| B: "Mission Control" | **NO-GO 🚫** | Parked. Too cold for "office teammates" framing. Revisit only if multi-user ops becomes a need. |
| C: "The Loft" | **NO-GO 🚫** | Parked. Friendly but toy-like. Keep as fallback if Bullpen feels overengineered. |

## Roadmap Phases

| Phase | Verdict | Notes |
|---|---|---|
| Phase 0: Foundation | **GO ✅** | In progress. Waiting on Backend (API contract), Designer (tokens), Frontend (scaffold). No blockers. |
| Phase 1: Core Data Flow | **GO ✅** | Approved to start as soon as Phase 0 exits. Keep gateway adapter thin — no over-abstraction. |
| Phase 2: Agent Office Panel | **GO (conditional) ⏳** | Approved in principle. Final GO after Phase 1 ships and we verify data flow is stable. |
| Phase 3: Polish | **NO-GO 🚫** | Premature. Mobile is deferred. Revisit after Phase 2. |
| Post-MVP | **NO-GO 🚫** | Backlog. No work until MVP ships and we get real usage feedback. |

## Standing Directives

1. **Gateway token server-side only** — non-negotiable. Must be verified in code review before any deploy.
2. **Tool-call events collapsible from day one** — don't ship a wall of noise.
3. **Desktop-first** — single operator on tailnet. Mobile is a distraction right now.
4. **Warm neutrals, not corporate blue** — "The Bullpen" palette. Designer owns specifics.
5. **Thin adapter pattern** — Backend should wrap Gateway RPC simply. No ORM-like layers.

## Next Review Gate

After Phase 0 exit criteria are met (API contract + scaffold + design tokens all delivered).
