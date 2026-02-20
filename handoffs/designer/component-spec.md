# Component Spec — MVP Components

> Last updated: 2026-02-21 (Cycle 2 — initial delivery)
>
> Tokens reference: `designer/visual-direction.md`

---

## 1. Session Sidebar

### Layout
- Fixed left column, `280px` wide on desktop
- Full viewport height, scrollable content area
- Background: `--bg-sidebar`
- Right border: `1px solid --border-default`

### Structure
```
┌─────────────────────────┐
│ ◎ OpenClaw Office  [txt]│  ← header (app title + filter input)
│─────────────────────────│
│ 🔍 Filter sessions...   │  ← search/filter bar
│─────────────────────────│
│ ● Agent Name            │  ← session row (repeats)
│   Last message preview… │
│   2m ago                │
│─────────────────────────│
│ ● Agent Name            │
│   Last message preview… │
│   15m ago               │
└─────────────────────────┘
```

### Session Row
- Padding: `12px 16px`
- Hover: background → `--bg-primary`
- Selected: background → `--bg-surface`, left border `3px solid --accent-primary`
- **Agent name:** `--text-sm`, weight 600, color `--text-primary`
- **Preview:** `--text-sm`, weight 400, color `--text-secondary`, single line, ellipsis overflow
- **Timestamp:** `--text-xs`, color `--text-tertiary`, right-aligned
- **Unread dot:** `8px` circle, `--unread-dot`, positioned left of agent name
- **Status dot:** `8px` circle, uses `--status-*` tokens, positioned right of agent name

### Filter Bar
- Input field: `--bg-surface`, `--radius-sm`, `--border-default`
- Placeholder: "Filter by agent or keyword…"
- Padding: `8px 12px`, margin `12px 16px`

### Tablet (768–1023px)
- Collapses to `64px` icon strip: avatar thumbnails only, tooltip on hover
- Tap expands to full sidebar as overlay

---

## 2. Chat Panel

### Layout
- Center column, flexible width (`1fr`)
- Background: `--bg-primary`
- Bordered left and right: `1px solid --border-subtle`

### Structure
```
┌──────────────────────────────────┐
│ Agent Name · role · ●status      │  ← chat header
│──────────────────────────────────│
│                                  │
│  [agent avatar] Agent message…   │  ← message bubble
│                                  │
│         User message…  [you]     │  ← user message, right-aligned
│                                  │
│  [agent avatar] ▶ tool: web_se…  │  ← collapsible tool event
│                                  │
│──────────────────────────────────│
│ Type a message…          [Send]  │  ← input bar
└──────────────────────────────────┘
```

### Chat Header
- Height: `56px`, padding `0 20px`
- Agent name: `--text-lg`, weight 600
- Role label: `--text-sm`, color `--text-secondary`
- Status badge: inline dot + label text (`--text-xs`)
- Bottom border: `1px solid --border-default`

### Message Bubbles
- **Agent messages:** left-aligned, no background (flat), `--text-base`
  - Avatar: `32px` circle, left of message, top-aligned
  - Name + timestamp row above message: name `--text-sm` weight 600, timestamp `--text-xs --text-tertiary`
- **User messages:** right-aligned, background `--accent-primary` at 8% opacity, `--radius-md` padding `10px 14px`
- Vertical spacing between messages: `16px` (same sender), `24px` (different sender)
- Max width: `680px` (prevents unreadable long lines)

### Tool-Call Events
- Collapsed by default (Producer directive)
- Collapsed state: single row, `--bg-sidebar` background, `--radius-sm`
  - Icon: `▶` chevron (rotates 90° when expanded)
  - Label: tool name in `--font-mono --text-xs`, truncated
  - Duration badge: `--text-xs --text-tertiary`
- Expanded state: reveals formatted input/output in `--font-mono --text-xs`
  - Background: `--bg-sidebar`, padding `12px`, `--radius-sm`
  - Max height: `300px`, scrollable
- Transition: `200ms ease-in-out`

### Input Bar
- Sticky bottom, padding `12px 20px`
- Background: `--bg-surface`
- Top border: `1px solid --border-default`
- Input: full width minus send button, `--radius-sm`, `--text-sm`, min-height `40px`
- Send button: `--accent-primary` background, white text, `--radius-sm`, `40px` height
- Disabled state when empty: button opacity 0.5

### Tablet
- Takes full remaining width after sidebar icon strip

---

## 3. Agent Cards (Office Panel)

### Panel Layout
- Right column, `300px` wide on desktop
- Background: `--bg-primary`
- Left border: `1px solid --border-default`
- Padding: `20px`
- Header: "The Bullpen" in `--text-xl`, weight 600, margin-bottom `20px`
- Cards arranged in vertical stack (single column), `12px` gap

### Card — Anatomy
```
┌───────────────────────────┐
│  ┌────┐                   │
│  │ AV │  Agent Name       │  ← avatar + name
│  └────┘  Role Label       │  ← role
│          ● Idle           │  ← status badge
└───────────────────────────┘
```

- Size: full panel width, auto height
- Background: `--bg-surface`
- Border: `1px solid --border-default`
- Radius: `--radius-md`
- Padding: `16px`
- Shadow: `--shadow-card`
- Hover: `--shadow-hover`, translate Y `-1px`, cursor pointer
- Click: navigates to agent's most recent session in chat panel

### Card — Avatar
- Size: `48px × 48px`, `--radius-full`
- Fallback: colored circle with initials (`--text-lg`, weight 600, white text)
- Fallback bg: hash agent name to one of 6 warm hues
- Float left, margin-right `12px`

### Card — Text
- **Name:** `--text-lg`, weight 600, `--text-primary`
- **Role:** `--text-sm`, weight 400, `--text-secondary`
- **Status:** `--text-xs`, weight 500, color matches status token

### Card — Status Badge
- Dot: `10px` circle, filled with `--status-*` color
- Label: status name, `--text-xs`, same color as dot
- Dot + label are inline, `6px` gap

### Status-Specific Behaviors

| Status | Dot Color | Animation | Card Border | Notes |
|---|---|---|---|---|
| `idle` | `--status-idle` | None | Default | Calm, ready state |
| `thinking` | `--status-thinking` | Soft pulse (2s, opacity 0.6→1) | `1px solid --status-thinking` at 30% | "Light is on" |
| `tool` | `--status-tool` | None | Default | Steady working |
| `error` | `--status-error` | None | `1px solid --status-error` at 40% | Needs attention |
| `offline` | `--status-offline` | None | Default | Card opacity `0.6` — "empty chair" |

### Tablet (768–1023px) — Status Strip
- Office panel collapses to horizontal strip at top of chat panel
- Height: `52px`, horizontal scroll if needed
- Each agent: `36px` avatar + `10px` status dot (overlapping bottom-right), no text
- Hover tooltip: "Agent Name · status"
- Background: `--bg-sidebar`
- Bottom border: `1px solid --border-default`

---

## 4. Responsive Breakpoints Summary

| Breakpoint | Sidebar | Chat | Office Panel |
|---|---|---|---|
| ≥1024px (desktop) | `280px` fixed | `1fr` flex | `300px` fixed |
| 768–1023px (tablet) | `64px` icon strip | `1fr` flex | `52px` top status strip |
| <768px (mobile) | **Deferred** | **Deferred** | **Deferred** |

---

## 5. Interaction Notes

- **Session click** → loads chat history in center panel, highlights sidebar row
- **Agent card click** → finds agent's most recent session, selects it (equivalent to sidebar click)
- **Tool-call click** → toggles expand/collapse
- **Send** → on Enter key or Send button click; Shift+Enter for newline
- **Auto-scroll** → chat scrolls to bottom on new messages unless user has scrolled up (show "↓ New messages" pill to jump back)

---

## Open Items for Frontend

- [ ] Confirm avatar image format/path convention with Backend
- [ ] Determine tool-call event shape from `handoffs/backend/api-contract.md` (pending)
- [ ] Finalize "new messages" pill positioning and animation
