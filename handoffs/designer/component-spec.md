# Component Spec — MVP Components

> Last updated: 2026-02-21 (Cycle 3 — Phase 1 refinement)  
> **Implementation Status:** ✅ Cycle 3 Code Implementation Complete
>
> Producer-approved "The Bullpen" concept. Tokens reference: `designer/visual-direction.md`
>
> **Scope:** Desktop (≥1024px) and Tablet (768–1023px) responsive behavior. Mobile deferred.
>
> **Code Status (Cycle 3 Implementation):**
> - ✅ Design tokens (`lib/design-tokens.ts`): Complete — 8 base colors + 5 status + 3 accents + typography + spacing + radius
> - ✅ CSS custom properties (`app/layout.tsx`): Complete — `:root` variables + responsive breakpoints + animations
> - ✅ Sidebar component: Complete — Desktop fixed 280px + Tablet 64px icon strip + overlay modal
> - ✅ Message panel: Complete — Warm palette, auto-scroll, new messages pill, collapsible tool events (TODO), Shift+Enter for newline
> - ✅ Office panel: Complete — Desktop card grid (desk nameplates) + Tablet 52px top status strip, all 5 status states with animations
> - ✅ Responsive layout: Complete — 3-col desktop, 2-col+strip tablet, grid-based architecture
> - 🟡 Tool-call collapsible: Spec complete, component structure ready, expand/collapse logic deferred to backend integration
> - 🟡 Filter sidebar: UI ready, search filter input implemented in SessionList component

---

## 1. Session Sidebar

### Desktop (≥1024px)

#### Layout
- Fixed left column, `280px` wide
- Full viewport height (`100vh`), scrollable overflow
- Background: `--bg-sidebar`
- Right border: `1px solid --border-default`
- Z-index: base (no overlay)

#### Header
- Padding: `16px`
- Border-bottom: `1px solid --border-default`
- Title: "OpenClaw Office" (or logo), `--text-lg`, weight 600, color `--text-primary`
- Optional: app mode/status text (`--text-xs`, color `--text-secondary`)

#### Filter Bar
- Margin: `12px 16px`
- Input field: `--bg-surface`, `--radius-sm`, `1px solid --border-default`
- Padding: `10px 12px`
- Placeholder: "Filter sessions…" color `--text-tertiary`
- Interaction: Focus border → `--border-default` (no glow, subtle)

#### Session Row
- Padding: `12px 16px`
- Margin-bottom: `4px`
- Border-left: `3px solid transparent` (space for selected state)
- Hover:
  - Background: `--bg-primary`
  - Transition: `150ms ease-out`
  - Cursor: pointer
- Selected (active):
  - Background: `--bg-surface`
  - Border-left: `3px solid --accent-primary`
- **Row content (flex, gap 8px):**
  - Unread dot: `8px` circle, `--unread-dot`, only if unread count > 0
  - Agent name: `--text-sm` weight 600, `--text-primary`, flex: 1, text-overflow ellipsis
  - Status dot: `8px` circle, `--status-*` color, right-most
- **Metadata row (below name):**
  - Preview text: `--text-sm` weight 400, `--text-secondary`, single line, max-width `220px`, ellipsis
  - Timestamp: `--text-xs`, `--text-tertiary`, right-aligned, same line as preview if space allows

#### Structure Diagram
```
┌─────────────────────────┐
│ OpenClaw Office         │ ← header
├─────────────────────────┤
│ 🔍 Filter sessions…     │ ← filter input
├─────────────────────────┤
│ ● Agent X           ○   │ ← session row (unread, status)
│   Last message... 2m ago│
│                         │
│ ◆ Agent Y           ◆   │ ← selected row (unread, status thinking)
│   Thinking about... 8s  │
│                         │
│ • Agent Z           ×   │ ← status idle, error state
│   Error occurred... 1m  │
└─────────────────────────┘
```

### Tablet (768–1023px) — Icon Strip

#### Layout
- Sidebar collapses to `64px` fixed vertical strip (left edge)
- Background: `--bg-sidebar`
- Right border: `1px solid --border-default`
- Scrollable if >5 agents
- Clicking → expands to full sidebar as **modal overlay** (z-index: 100, semi-transparent bg)

#### Icon Strip Row
- Size: `56px × 56px` (centered in 64px column), `--radius-md`
- Avatar image: `48px × 48px`, centered, `--radius-full`
- Status dot: `12px` circle, positioned bottom-right (overlapping), filled `--status-*` color
- Unread dot: `10px` circle, `--unread-dot`, positioned top-right (overlapping) if unread
- Hover:
  - Background: `--bg-primary` (subtle highlight)
  - Tooltip appears (see **Tooltip** section below)
  - Transition: `150ms ease-out`
- Click: 
  - Selected row gets border `2px solid --accent-primary`
  - Expands sidebar overlay

#### Tooltip (Tablet + Desktop hover)
- Appears on hover (150ms delay)
- Content: "Agent Name · Status Label"
- Positioning: right of cursor, 8px gap from icon
- Background: `--text-primary`, text color white, `--text-xs`, padding `6px 10px`, `--radius-sm`
- Fade-in: `150ms ease-out`
- Max width: `180px`

---

## 2. Chat Panel

### Desktop (≥1024px) + Tablet Layout

#### Overall Layout
- Center column, flexible width (`1fr`)
- Background: `--bg-primary`
- Left border: `1px solid --border-subtle`
- Right border: `1px solid --border-subtle` (on desktop; hidden on tablet when office strip is visible)
- Display: flex column, overflow hidden

#### Chat Header
- Height: `56px`
- Padding: `0 20px`
- Border-bottom: `1px solid --border-default`
- Background: `--bg-surface`
- Display: flex, align-items center, gap 12px

**Header content:**
- **Agent name:** `--text-lg` weight 600, `--text-primary`, flex-shrink 0
- **Divider:** bullet `·`, `--text-tertiary`
- **Role label:** `--text-sm` weight 400, `--text-secondary`
- **Status badge:** flex-grow 0
  - Dot: `10px` circle, filled `--status-*` color
  - Text: `--text-xs` weight 500, same color as dot
  - Gap between dot and text: `4px`

#### Message Area
- Flex: 1 (grow to fill)
- Overflow-y: auto
- Padding: `20px`
- Background: `--bg-primary`

**Auto-scroll behavior:**
- Scrolls to bottom on new message (if user not scrolled up)
- When user scrolls up: show "New messages ↓" pill (see **New Messages Pill** below)
- Click pill or scroll-down → jump to latest, dismiss pill

#### Message Groups

**Agent message:**
- Margin-bottom: `24px` (if different agent follows)
- Display: flex, gap 12px, align-items flex-start

Components:
- Avatar: `32px × 32px`, `--radius-full`, image or initials fallback
- Message bubble container (flex: 1):
  - **Meta row (above message):** agent name `--text-sm` weight 600 + spacer + timestamp `--text-xs --text-tertiary`
  - **Message text:** `--text-base` weight 400, `--text-primary`, line-height 1.5
  - Max width: `680px` (prevents long lines)
  - No background, flat styling

**User message:**
- Align-self: flex-end
- Max width: `60%` (or 520px on desktop)
- Margin-bottom: `16px` (same sender), `24px` (different sender)
- Padding: `10px 14px`
- Background: `--accent-primary` at 8% opacity (`rgba(196, 90, 44, 0.08)`)
- Border-radius: `--radius-md`
- Text: `--text-base` weight 400, `--text-primary`
- Timestamp: `--text-xs --text-tertiary`, below message, right-aligned

#### Tool-Call Events (Collapsible)

Default state: **COLLAPSED** (Producer directive — "collapsible from day one")

**Collapsed state:**
- Height: `40px`
- Padding: `10px 12px`
- Background: `--bg-sidebar`
- Border: `1px solid --border-default`
- Border-radius: `--radius-sm`
- Margin: `16px 0`
- Display: flex, align-items center, gap 8px
- Cursor: pointer
- Hover: background → `--bg-primary`, transition `150ms ease-out`

Components:
- **Chevron icon:** `▶` character, `--text-secondary`, `--text-xs`, width 12px, rotates 90° when expanded
- **Tool name:** `--font-mono --text-xs` weight 500, `--text-secondary`, truncated (max 200px)
- **Duration:** `--text-xs --text-tertiary`, margin-left auto, no-wrap

Collapsed example: `▶ web_search · 1.2s`

**Expanded state:**
- Transition: height + max-height `200ms ease-in-out`, chevron rotate
- Max-height: `320px`
- Overflow-y: auto
- Padding: `12px`
- Background: `--bg-sidebar`
- Border: `1px solid --border-subtle`
- Border-radius: `--radius-sm`

Content (inside expanded):
- Two columns: Input (left) | Output (right), gap 16px, each flex: 1
- Or stack on narrow widths

**Input section:**
- Label: "Input" `--text-xs` weight 600, `--text-secondary`, margin-bottom 6px
- Content: `--font-mono --text-xs` weight 400, `--text-primary`, line-height 1.4
- Word-break: break-word

**Output section:**
- Label: "Output" `--text-xs` weight 600, `--text-secondary`, margin-bottom 6px
- Content: `--font-mono --text-xs` weight 400, `--text-primary`, line-height 1.4
- Word-break: break-word

#### New Messages Pill

When user scrolls up and new messages arrive:
- Position: sticky, bottom of viewport + 12px, centered horizontally
- Background: `--accent-primary`, text white
- Padding: `8px 16px`
- Border-radius: `--radius-full`
- Font: `--text-xs` weight 500
- Text: "↓ New messages"
- Cursor: pointer
- Animation: fade-in `150ms ease-out`
- Click: scroll to bottom, fade-out, dismiss
- Auto-dismiss: after 8 seconds if user doesn't interact

#### Input Bar (Sticky Bottom)

- Height: auto (min 52px with padding)
- Padding: `12px 20px`
- Background: `--bg-surface`
- Border-top: `1px solid --border-default`
- Display: flex, gap 8px, align-items flex-end

Components:
- **Text input:** 
  - Flex: 1
  - Min-height: `40px`
  - Max-height: `120px` (grows with text, scrollable overflow)
  - Padding: `10px 12px`
  - Font: `--text-sm`, `--font-family`
  - Border: `1px solid --border-default`
  - Border-radius: `--radius-sm`
  - Placeholder: "Type a message…" color `--text-tertiary`
  - Focus: border → `--border-default` (no glow)
  - Resize: none (height handled by JS)

- **Send button:**
  - Width: `40px`
  - Height: `40px`
  - Flex-shrink: 0
  - Background: `--accent-primary`
  - Color: white
  - Border-radius: `--radius-sm`
  - Font: `--text-sm` weight 500
  - Border: none
  - Cursor: pointer
  - Text: "Send" or icon (arrow ↗)
  - Hover: background → `--accent-hover`, transition `150ms ease-out`
  - Disabled (empty input): opacity 0.5, cursor not-allowed
  - **Keyboard:** Enter = send, Shift+Enter = newline

### Tablet (768–1023px)

- Chat panel takes remaining width after `64px` sidebar icon strip
- Header and input unchanged
- Message max-width: `560px` (slightly narrower than desktop)
- Tool-call expanded content: stack Input above Output (single column, not side-by-side)

---

## 3. Agent Cards (Office Panel)

### Desktop (≥1024px)

#### Panel Layout
- Right column, fixed `300px` wide
- Full viewport height (`100vh`), scrollable overflow
- Background: `--bg-primary`
- Left border: `1px solid --border-default`
- Padding: `20px`
- Z-index: base

#### Panel Header
- Margin-bottom: `20px`
- Text: "The Bullpen" (or "Office")
- Font: `--text-xl` weight 600, `--text-primary`
- Optional: subtitle or session count below

#### Card Grid
- Layout: vertical stack (single column), full panel width
- Gap: `12px` between cards
- Overflow: scroll (if >6 agents)

#### Card — Anatomy (Desk Nameplate)

**Visual concept:** Avatar, name, role, status lamp (inspired by desk nameplates — show who you are, what you do, if you're available).

```
┌────────────────────────────┐
│  ┌────┐  Agent Name        │
│  │ AV │  Product Designer  │
│  └────┘  ● Thinking        │
└────────────────────────────┘
```

**Card structure:**
- Display: grid, 2 columns (avatar column + text column), gap 12px
- Width: full panel width
- Height: auto
- Background: `--bg-surface`
- Border: `1px solid --border-default`
- Border-radius: `--radius-md`
- Padding: `16px`
- Shadow: `--shadow-card`
- Cursor: pointer
- Transition: all `150ms ease-out`

**Hover state:**
- Shadow: `--shadow-hover`
- Transform: translateY `-1px`

**Click:**
- Background: slight tint (e.g., `--accent-primary` at 3% opacity)
- Finds agent's most recent session, loads in chat panel
- Sidebar highlights corresponding session row

#### Card — Avatar (Column 1)
- Size: `48px × 48px`
- Border-radius: `--radius-full`
- Object-fit: cover
- Fallback (initials):
  - Background: hash agent name to one of 6 warm hues (e.g., sage, amber, blue, red, gray, terracotta)
  - Display: flex, align-items center, justify-content center
  - Font: `--text-lg` weight 600, white text
  - Example colors: `#8B9E7C`, `#D4A843`, `#5B8ABF`, `#C45D4E`, `#B5AFA6`, `#C45A2C`

**Palette for fallback (warm, diverse):**
```
const fallbackColors = [
  '#8B9E7C', // sage (idle feel)
  '#D4A843', // amber (thinking feel)
  '#5B8ABF', // blue (tool feel)
  '#C45D4E', // red (error feel)
  '#B5AFA6', // gray (offline feel)
  '#C45A2C', // terracotta (accent warm)
];

function getAvatarColor(agentName) {
  const hash = agentName.charCodeAt(0) + agentName.charCodeAt(agentName.length - 1);
  return fallbackColors[hash % fallbackColors.length];
}
```

#### Card — Text (Column 2)

Layout: flex column, justify-content flex-start, gap 4px

**Agent Name:**
- Font: `--text-lg` weight 600, `--text-primary`
- Max-width: `160px` (avoid overflow, truncate with ellipsis if needed)

**Role Label:**
- Font: `--text-sm` weight 400, `--text-secondary`
- Max-width: `160px`

**Status Badge:**
- Display: flex, align-items center, gap 6px
- Dot: `10px` circle, filled `--status-*` color
- Text: `--text-xs` weight 500, color matches status token (e.g., `--status-thinking` text is `#D4A843`)
- Status options: "Idle", "Thinking", "Using tool", "Error", "Offline"

#### Status-Specific Card Behaviors

| Status | Dot Color | Text Label | Card Border | Dot Animation | Notes |
|---|---|---|---|---|---|
| `idle` | `--status-idle` `#8B9E7C` | "Idle" | `1px solid --border-default` | None | Calm state, ready to chat. Card normal opacity. |
| `thinking` | `--status-thinking` `#D4A843` | "Thinking" | `1px solid --status-thinking` (30% opacity) | Soft pulse (2s, dot opacity 0.6→1) | "Light is on" — engaging brain. Subtle border glow. |
| `tool` | `--status-tool` `#5B8ABF` | "Using tool" | `1px solid --border-default` | None | Steady work. Card normal opacity. |
| `error` | `--status-error` `#C45D4E` | "Error" | `1px solid --status-error` (40% opacity) | None | Needs attention. Visible border urgency. Card opacity 0.95 (slight dim to hint "problematic"). |
| `offline` | `--status-offline` `#B5AFA6` | "Offline" | `1px solid --border-default` | None | Empty chair. Card opacity 0.6. Text also slightly dim. |

**Implementation detail:**
- Thinking pulse: `@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }` applied to status dot
- Card dim (error/offline): `opacity: 0.95` or `0.6` respectively
- Border glow (thinking): box-shadow can supplement or replace border color

### Tablet (768–1023px) — Status Strip (Top Bar)

#### Layout
- Office panel collapses entirely
- Status strip appears as horizontal bar **above** chat panel (or at top of viewport)
- Height: `52px`
- Background: `--bg-sidebar`
- Border-bottom: `1px solid --border-default`
- Padding: `8px 20px`
- Display: flex, overflow-x auto, gap 8px, align-items center

#### Strip Agent Item
- Display: flex flex-direction column, align-items center, justify-content center
- Width: `auto`, flex-shrink 0
- Padding: `0 4px`

Components:
- **Avatar:** `36px × 36px`, `--radius-full`, image or initials fallback (same rules as desktop)
- **Status dot:** `12px` circle, positioned bottom-right (overlapping by 2px), filled `--status-*` color
- **Unread indicator:** `10px` circle, `--unread-dot`, positioned top-right (overlapping by 2px), shown if session unread

Example visual:
```
┌─────────────────────────────────────┐
│ AV●  AV◆  AV  AV  AV  AV    [scroll]│  ← avatar + status dots
└─────────────────────────────────────┘
```

#### Interaction
- **Hover:** tooltip appears, "Agent Name · status", positioned above strip
- **Click:** loads agent's most recent session in chat panel, highlights status dot with border
- **Horizontal scroll:** if >6 agents, becomes scrollable (snap-to-edges behavior optional)

**Tooltip (same as sidebar):**
- Content: "Agent Name · Thinking"
- Background: `--text-primary` (dark), text white
- Font: `--text-xs` weight 500
- Padding: `6px 10px`
- Border-radius: `--radius-sm`
- Positioned: above cursor, 8px gap, centered on agent
- Appears on hover (100ms delay), disappears when mouse leaves

---

## 4. Responsive Breakpoints Summary

| Breakpoint | Sidebar | Chat | Office Panel | Notes |
|---|---|---|---|---|
| ≥1024px (desktop) | `280px` fixed, full sidebar | `1fr` flex | `300px` fixed | **Primary target.** 3-column layout. All features visible. |
| 768–1023px (tablet) | `64px` icon strip (tap → overlay) | `1fr` flex | `52px` top status strip | Office panel becomes horizontal avatar bar. Sidebar toggles to overlay. |
| <768px (mobile) | **Deferred Phase 4+** | **Deferred Phase 4+** | **Deferred Phase 4+** | **Desktop-first tool.** Mobile design not in Phase 0/1 scope. |

**Viewport rule:** Use `@media (max-width: 1023px)` for tablet breakpoint, `@media (max-width: 767px)` for mobile (if future).

---

---

## 5. Interaction Model

### Navigation & Selection

**Session Sidebar Click**
- Loads chat history in center panel
- Highlights sidebar row: selected state (background `--bg-surface`, left border `3px solid --accent-primary`)
- Updates chat header to show selected agent name + role + status

**Agent Card Click (Desktop or Tablet Strip)**
- Finds agent's most recent session
- Equivalent to sidebar click — loads chat, highlights session row
- On tablet: status dot gets visual indicator (e.g., border highlight)
- Interaction model: "walk up to their desk" (from brief)

### Message Interaction

**Send Message**
- Trigger: Enter key OR Send button click
- Shift+Enter: inserts newline (no send)
- Disabled when input is empty (button opacity 0.5, cursor not-allowed)
- Input clears after successful send (via Gateway RPC)
- Message appears in chat with correct sender (user = "You" label)

**Auto-Scroll Behavior**
- Chat scrolls to bottom when new message arrives **unless** user has manually scrolled up
- When scrolled up: "New messages ↓" pill appears (bottom-center of chat)
- Click pill or scroll down → jumps to latest message, dismisses pill
- Pill auto-dismisses after 8 seconds if untouched

### Tool-Call Expansion

**Collapsed → Expanded**
- Click/tap anywhere on collapsed tool-call row
- Chevron rotates 90° (right → down)
- Height expands with `200ms ease-in-out` transition
- Input + Output sections reveal with syntax highlighted (if supported, else plain mono)
- Can scroll if content exceeds `320px` max-height

**Expanded → Collapsed**
- Click chevron or tool-call row again
- Chevron rotates back (down → right)
- Height collapses `200ms ease-in-out`
- Content hidden

### Filters & Search (Sidebar)

**Filter Input**
- Type to search sessions by agent name or message preview text
- Real-time filtering: updates session list as you type
- Case-insensitive match
- Clear icon (optional): click to reset filter

---

## 6. Animation Reference

| Element | Trigger | Duration | Easing | Details |
|---|---|---|---|---|
| Status dot pulse | status = thinking | 2s, repeating | ease-in-out | Opacity 0.6 → 1 → 0.6 |
| Card hover lift | mouse hover | 150ms | ease-out | Transform Y -1px, shadow upgrade |
| Tool-call expand | click | 200ms | ease-in-out | Height + chevron rotate |
| Border glow fade | status change | 150ms | ease-out | Border opacity 0 → target |
| Tooltip fade-in | hover (100ms delay) | 150ms | ease-out | Opacity 0 → 1 |
| New messages pill | message arrival | 150ms | ease-out | Fade-in; auto-dismiss 8s or click |
| Input focus | focus | 150ms | ease-out | Border color transition |

---

## 7. Accessibility & Semantic Notes

- **ARIA labels** on buttons: "Send message", "Toggle tool details", etc.
- **Color not alone:** Status indication uses dot + text label (not color only)
- **Focus indicators:** All interactive elements have visible focus ring (can use border or outline)
- **Semantic HTML:** Use `<button>`, `<input>`, `<article>` for messages, nav roles for sidebar
- **Keyboard nav:** Tab through sessions, send on Enter, Esc to close tooltips/overlays
- **Reduced motion:** Respect `prefers-reduced-motion` media query (disable animations, keep static states)

---

## 8. Open Items for Frontend

### Dependency: Backend API Contract

- [ ] **Tool-call event shape:** Confirm structure from `handoffs/backend/api-contract.md` (pending from Backend)
  - Expected: `{ toolName, input, output, duration, timestamp }`
- [ ] **Avatar image URL format:** Confirm path/URL convention for agent avatars (default fallback color system provided above)
- [ ] **RPC method names:** Exact names for `sessions_list`, `session_history`, `send_message`, WebSocket event names

### Implementation Checklist

- [ ] CSS custom property tokens (palette + typography + spacing) — reference `visual-direction.md`
- [ ] Responsive layout grid (3-col desktop, 2-col+strip tablet, deferred mobile)
- [ ] Session sidebar: list, filter, selection highlight
- [ ] Chat panel: message rendering, auto-scroll, new messages pill, tool-call collapse/expand
- [ ] Agent office panel: card grid + status badges (desktop), status strip (tablet)
- [ ] Input bar: multi-line text, send on Enter, Shift+Enter for newline, disabled state
- [ ] Tooltips: hover delay 100ms, position logic
- [ ] Status animations: thinking pulse, card opacity states, border color transitions
- [ ] Keyboard interaction: Tab nav, Enter to send, Esc to close overlays

---

## 9. Design Handoff Notes

**For Product Manager:**
- MVP gate (Phase 0) requires: sidebar, chat, office panel, 5+ agents, live status, send message working
- Tablet responsive fully designed; mobile deferred to Phase 4+
- All component states documented (idle/thinking/tool/error/offline)
- Warm "Bullpen" aesthetic approved by Producer; no dark mode in Phase 0

**For Frontend Engineer:**
- Use token names consistently (CSS vars or export from design system JSON)
- Tablet breakpoint at 768px; primary target desktop ≥1024px
- Tool-call events are collapsible by default — important UX directive from Producer
- Thinking status gets soft pulse animation; error/offline get visual dimming
- Message auto-scroll logic needed (scroll lock until user scrolls down)

**For Backend Engineer:**
- Confirm API contract (RPC methods, WebSocket event shapes) — documented in `handoffs/backend/api-contract.md`
- Avatar URL format and fallback strategy
- Session list sort: most recent activity first
- Presence updates must stream without page refresh (WebSocket or SSE)
