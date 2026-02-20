# Component Map — Frontend

> Last updated: 2026-02-21 (Cycle 1 — initial delivery)

## Component Tree

```
<RootLayout>                          ← app/layout.tsx (CSS grid shell)
  <DashboardPage>                     ← app/page.tsx (RSC, initial data)
    ├── <SessionSidebar>              ← left column (280px)
    │   ├── <FilterBar />             ← search input
    │   └── <SessionRow />[]          ← repeating session items
    │       ├── <Avatar />            ← 32px agent avatar
    │       └── <StatusDot />         ← 8px status indicator
    │
    ├── <ChatPanel>                   ← center column (1fr)
    │   ├── <ChatHeader />            ← agent name + role + status
    │   │   └── <StatusBadge />
    │   ├── <MessageList>             ← scrollable message area
    │   │   ├── <MessageBubble />[]   ← user or agent message
    │   │   │   └── <Avatar />
    │   │   └── <ToolCallEvent />[]   ← collapsible tool call
    │   └── <InputBar />              ← sticky bottom input + send
    │
    └── <OfficePanel>                 ← right column (300px)
        └── <AgentCard />[]           ← vertical stack of agent cards
            ├── <Avatar />            ← 48px avatar
            └── <StatusBadge />       ← dot + label
```

## Component Inventory

| Component | File | Props | State Source | Notes |
|---|---|---|---|---|
| `RootLayout` | `app/layout.tsx` | children | — | 3-column CSS grid, font/theme setup |
| `DashboardPage` | `app/page.tsx` | — | Server fetch | RSC; passes initial data to client |
| `SessionSidebar` | `components/sidebar/SessionSidebar.tsx` | initialSessions | `sessionStore` | Subscribes to session list + selection |
| `FilterBar` | `components/sidebar/FilterBar.tsx` | — | local | Controlled input, debounced filter |
| `SessionRow` | `components/sidebar/SessionRow.tsx` | session, isSelected, onClick | — | Pure presentational + click handler |
| `ChatPanel` | `components/chat/ChatPanel.tsx` | initialMessages? | `sessionStore` | Loads history on session change |
| `ChatHeader` | `components/chat/ChatHeader.tsx` | agent, status | — | Pure presentational |
| `MessageList` | `components/chat/MessageList.tsx` | messages | `sessionStore` | Uses `useAutoScroll` |
| `MessageBubble` | `components/chat/MessageBubble.tsx` | message | — | Renders user vs agent styling |
| `ToolCallEvent` | `components/chat/ToolCallEvent.tsx` | toolCall | local (expanded) | Collapsible; default collapsed |
| `InputBar` | `components/chat/InputBar.tsx` | sessionKey, onSend | local | Shift+Enter for newline |
| `OfficePanel` | `components/office/OfficePanel.tsx` | initialAgents | `agentStore`, `presenceStore` | Merges agent metadata + live status |
| `AgentCard` | `components/office/AgentCard.tsx` | agent, status, onClick | — | Hover lift, status-specific border |
| `Avatar` | `components/shared/Avatar.tsx` | src, name, size | — | Image with initials fallback |
| `StatusDot` | `components/shared/StatusDot.tsx` | status, size? | — | Colored dot, optional pulse animation |
| `StatusBadge` | `components/office/StatusBadge.tsx` | status | — | Dot + text label |

## Zustand Stores

### `sessionStore`
```ts
interface SessionStore {
  sessions: Session[]
  selectedKey: string | null
  messages: Record<string, Message[]>  // keyed by sessionKey
  setSessions(s: Session[]): void
  selectSession(key: string): void
  addMessage(sessionKey: string, msg: Message): void
  updateSession(session: Partial<Session> & { key: string }): void
}
```

### `presenceStore`
```ts
interface PresenceStore {
  statuses: Record<string, AgentStatus>  // keyed by agentId
  setStatus(agentId: string, status: AgentStatus): void
}
```

### `agentStore`
```ts
interface AgentStore {
  agents: Agent[]
  setAgents(a: Agent[]): void
}
```

## Hooks

| Hook | Purpose |
|---|---|
| `useSSE` | Opens `EventSource` to `/api/stream`, dispatches events to stores, handles reconnect |
| `useSessions` | SWR fetch of `/api/sessions`, seeds `sessionStore` |
| `useHistory` | SWR fetch of `/api/sessions/:key/history`, conditional on selected session |
| `useAutoScroll` | Tracks scroll position; auto-scrolls on new messages; exposes `isScrolledUp` for "new messages" pill |

## Shared Types (`types/index.ts`)

```ts
type AgentStatus = 'idle' | 'thinking' | 'tool' | 'error' | 'offline'

interface Agent {
  id: string
  name: string
  role: string
  avatar: string | null
}

interface Session {
  key: string
  agentId: string
  label: string
  lastMessage: { role: string; text: string; ts: string } | null
  updatedAt: string
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  text: string | null
  ts: string
  toolCall: ToolCall | null
}

interface ToolCall {
  name: string
  input: string
  output: string
  durationMs: number | null
  status: 'running' | 'success' | 'error'
}

interface SSEEvent {
  type: 'presence' | 'message' | 'session_update' | 'tool_event'
  [key: string]: unknown
}
```
