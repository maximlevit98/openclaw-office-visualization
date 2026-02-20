# App Architecture — Frontend

> Last updated: 2026-02-21 (Cycle 1 — initial delivery)

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 14** (App Router) | BFF layer built-in via Route Handlers; RSC for initial loads |
| Language | **TypeScript** (strict) | Type safety across API contract |
| Styling | **Tailwind CSS** + CSS custom properties | Design tokens from `designer/visual-direction.md` map to CSS vars |
| State | **Zustand** | Lightweight, no boilerplate; good for real-time streaming state |
| Data fetching | **SWR** (REST) + **EventSource** (SSE) | SWR for initial loads + revalidation; native SSE for streaming |
| Testing | **Vitest** + **React Testing Library** | Fast, ESM-native |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              ← root layout (3-column grid shell)
│   ├── page.tsx                ← main dashboard (server component, initial data fetch)
│   ├── api/
│   │   ├── sessions/
│   │   │   ├── route.ts                  ← GET /api/sessions (proxy to Gateway)
│   │   │   └── [sessionKey]/
│   │   │       ├── history/route.ts      ← GET /api/sessions/:key/history
│   │   │       └── send/route.ts         ← POST /api/sessions/:key/send
│   │   ├── agents/route.ts              ← GET /api/agents
│   │   └── stream/route.ts             ← GET /api/stream (SSE endpoint)
├── components/
│   ├── sidebar/
│   │   ├── SessionSidebar.tsx
│   │   ├── SessionRow.tsx
│   │   └── FilterBar.tsx
│   ├── chat/
│   │   ├── ChatPanel.tsx
│   │   ├── ChatHeader.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ToolCallEvent.tsx
│   │   └── InputBar.tsx
│   ├── office/
│   │   ├── OfficePanel.tsx
│   │   ├── AgentCard.tsx
│   │   └── StatusBadge.tsx
│   └── shared/
│       ├── Avatar.tsx
│       └── StatusDot.tsx
├── stores/
│   ├── sessionStore.ts          ← sessions list, selected session, messages
│   ├── presenceStore.ts         ← agent statuses (fed by SSE)
│   └── agentStore.ts            ← agent metadata (name, role, avatar)
├── hooks/
│   ├── useSSE.ts                ← EventSource connection + reconnect
│   ├── useSessions.ts           ← SWR wrapper for sessions list
│   ├── useHistory.ts            ← SWR wrapper for session history
│   └── useAutoScroll.ts         ← scroll-lock / auto-scroll logic
├── lib/
│   ├── gateway.ts               ← server-only Gateway RPC client
│   ├── api.ts                   ← browser-side fetch helpers
│   └── tokens.ts                ← CSS custom property definitions
├── types/
│   └── index.ts                 ← shared TypeScript types (Session, Message, Agent, etc.)
└── styles/
    └── globals.css              ← Tailwind directives + CSS custom properties
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Browser                                                      │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Sidebar  │    │  Chat    │    │  Office  │              │
│  │ Component│    │ Component│    │ Component│              │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘              │
│       │               │               │                     │
│       └───────────┬───┴───────────────┘                     │
│                   │                                          │
│           ┌───────▼────────┐     ┌──────────────┐           │
│           │  Zustand Store │◄────│  useSSE hook │           │
│           │  (sessions,    │     │  (EventSource)│           │
│           │   presence,    │     └──────┬───────┘           │
│           │   agents)      │            │ SSE               │
│           └───────┬────────┘            │                   │
│                   │ REST                │                   │
└───────────────────┼─────────────────────┼───────────────────┘
                    │                     │
┌───────────────────┼─────────────────────┼───────────────────┐
│ BFF (Next.js Route Handlers)            │                   │
│                   │                     │                   │
│           ┌───────▼─────────────────────▼──┐                │
│           │     lib/gateway.ts             │                │
│           │  (server-only, holds token)    │                │
│           └───────────────┬────────────────┘                │
└───────────────────────────┼─────────────────────────────────┘
                            │ WS + RPC
                    ┌───────▼───────┐
                    │ OpenClaw      │
                    │ Gateway       │
                    └───────────────┘
```

### Initial Load
1. `page.tsx` (RSC) fetches sessions + agents via `lib/gateway.ts` server-side
2. Passes initial data as props to client components
3. Client hydrates Zustand stores with initial data
4. `useSSE` hook opens SSE connection to `/api/stream`

### Real-Time Updates
1. SSE delivers `presence`, `message`, `session_update`, `tool_event`
2. `useSSE` hook dispatches to appropriate Zustand store
3. Components re-render via Zustand selectors (minimal re-renders)

### Sending Messages
1. `InputBar` calls `POST /api/sessions/:key/send` via `lib/api.ts`
2. Optimistically appends message to local store
3. SSE confirms delivery with `message` event (reconcile by id)

## Security

- `lib/gateway.ts` is server-only (uses `import 'server-only'`)
- Gateway token read from `process.env.OPENCLAW_GATEWAY_TOKEN`
- All `/api/*` route handlers validate input before proxying
- No token or gateway URL exposed in client bundle

## Responsive Strategy

- CSS Grid on root layout: `grid-template-columns: 280px 1fr 300px`
- Tablet breakpoint via `@media (max-width: 1023px)`: sidebar → 64px, office → top strip
- Mobile: deferred (not in MVP)
