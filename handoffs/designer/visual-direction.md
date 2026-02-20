# Visual Direction — "The Bullpen"

> Last updated: 2026-02-21 (Cycle 3 — approved by Producer, refined for Phase 1)

## Theme

**"The Bullpen"** — Warm newsroom / open-office metaphor.

Agents are coworkers at desks, not rows in a table. The UI should feel like glancing across the bullpen — you instantly see who's busy, who's free, who's in trouble. Interaction model: "walk up to their desk" (click agent card → jump to their chat session).

**Approved by Producer (Cycle 3).** MVP uses flat avatar cards with expressive status badges; isometric spatial enhancement deferred to post-MVP.

## Palette

### Base (Warm Neutrals)

| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#FAF8F5` | Page background — warm off-white, not clinical |
| `--bg-surface` | `#FFFFFF` | Cards, panels, elevated surfaces |
| `--bg-sidebar` | `#F3F0EB` | Sidebar background — slightly warm tint |
| `--border-default` | `#E5E0D8` | Dividers, card borders |
| `--border-subtle` | `#EDE9E3` | Lighter separators |
| `--text-primary` | `#1A1816` | Headings, names |
| `--text-secondary` | `#6B635A` | Labels, timestamps, metadata |
| `--text-tertiary` | `#9E958A` | Placeholders, disabled text |

### Status Palette

| Token | Hex | Usage |
|---|---|---|
| `--status-idle` | `#8B9E7C` | Muted sage green — desk lamp off |
| `--status-thinking` | `#D4A843` | Warm amber — "burning the midnight oil" |
| `--status-tool` | `#5B8ABF` | Calm blue — hands on the keyboard |
| `--status-error` | `#C45D4E` | Brick red — something's wrong |
| `--status-offline` | `#B5AFA6` | Warm gray — empty chair |

### Accent

| Token | Hex | Usage |
|---|---|---|
| `--accent-primary` | `#C45A2C` | Warm terracotta — primary actions, links |
| `--accent-hover` | `#A8492A` | Darkened accent on hover |
| `--unread-dot` | `#C45A2C` | Unread indicator (matches accent) |

## Typography

| Token | Value | Usage |
|---|---|---|
| `--font-family` | `'Inter', system-ui, sans-serif` | Body text |
| `--font-mono` | `'JetBrains Mono', monospace` | Tool calls, code blocks |
| `--text-xs` | `12px / 1.4` | Timestamps, status labels |
| `--text-sm` | `14px / 1.5` | Message body, sidebar items |
| `--text-base` | `16px / 1.5` | Chat messages |
| `--text-lg` | `18px / 1.4` | Agent names on cards |
| `--text-xl` | `24px / 1.3` | Panel headings |

## Spacing Scale

4px base: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64`

## Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `6px` | Buttons, inputs, badges |
| `--radius-md` | `10px` | Cards, panels |
| `--radius-lg` | `16px` | Modals, overlays |
| `--radius-full` | `9999px` | Avatars, status dots |

## Shadows

| Token | Value |
|---|---|
| `--shadow-card` | `0 1px 3px rgba(26, 24, 22, 0.06), 0 1px 2px rgba(26, 24, 22, 0.04)` |
| `--shadow-panel` | `0 4px 12px rgba(26, 24, 22, 0.08)` |
| `--shadow-hover` | `0 4px 16px rgba(26, 24, 22, 0.12)` |

## Motion

- **General transitions:** `150ms ease-out` for interactive states (hover, focus)
- **Status thinking pulse:** `--status-thinking` gets a soft 2s pulse animation (dot opacity 0.6 → 1 → 0.6)
- **Tool-call expand/collapse:** `200ms ease-in-out` height + chevron rotation
- **Card hover lift:** translate Y `-1px` with shadow upgrade
- **No motion** for status-idle/offline (calm, static appearance)
- **New messages pill:** fade-in `150ms`, auto-dismiss or click-to-scroll

## Iconography

Minimal, intentional. No icon library in MVP.

- **Status dots:** Small filled circles (`8–10px`), color-coded to status
- **Tool-call chevron:** `▶` chevron (rotates 90° when expanded)
- **Search filter:** Magnifying glass `🔍` in placeholder text (no icon needed)
- **Unread indicator:** Solid dot (`8px`, `--unread-dot`)
- **New messages pill:** Text "↓ New messages" with optional chevron icon

## Layout Philosophy

### Desktop (≥1024px) — Primary Target
Three clean columns. Sidebar is utility (narrow, scannable). Chat is the workspace (wide, focused). Office panel is the "glance view" (medium, visual).

- **Sidebar** (280px): Session list + filter, scroll-friendly
- **Chat** (1fr): Messages + tool events, main interaction focus
- **Office** (300px): Agent cards, status-at-a-glance, navigation shortcut

### Tablet (768–1023px)
Office panel compresses to a horizontal status strip at top. Sidebar can collapse to icon strip (tap to expand as overlay).

- **Sidebar** (64px icon strip → overlay): Avatar thumbnails with tooltips
- **Chat** (1fr): Full remaining width
- **Office** (52px top strip): Horizontal scrolling avatar grid with status dots

### Mobile (<768px)
**Deferred per Producer.** No design work or responsive spec in Phase 0/1. Desktop-first single-operator tool assumption.

## Mood

Think: a well-lit co-working space on a Saturday morning. Wooden desks, warm lighting, paper coffee cups.

**Not sterile, not playful — productive and inviting.** The UI should whisper, not shout. Status changes are visible at a glance, errors draw attention gently (warm red, not harsh), thinking is encouraging (warm amber, like a lamp on at night). The whole interface feels like you're in a room with these agents — visible, approachable, collaborative.

---

## Usage in Code

Reference tokens as CSS custom properties:

```css
background: var(--bg-primary);
border: 1px solid var(--border-default);
color: var(--text-primary);
transition: all 150ms ease-out;
```

Store palette as CSS variables in a `:root` block or CSS module. Ensure token names are consistent across Figma, code comments, and pull request reviews.
