# Visual Direction — "The Bullpen"

> Last updated: 2026-02-21 (Cycle 2 — initial delivery)

## Theme

Warm newsroom / open-office. Agents are coworkers at desks, not rows in a table. The UI should feel like glancing across the bullpen — you instantly see who's busy, who's free, who's in trouble.

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

- Transitions: `150ms ease-out` for interactive states (hover, focus)
- Status badge pulse: `--status-thinking` gets a soft 2s pulse animation
- Tool-call expand/collapse: `200ms ease-in-out` height transition
- No motion for status-idle/offline (calm, static)

## Iconography

Minimal. Use small filled circles for status dots (no icon library in MVP). Tool-call chevron for expand/collapse. Magnifying glass for search filter.

## Layout Philosophy

- **Desktop:** Three clean columns. Sidebar is utility (narrow, scannable). Chat is the workspace (wide, focused). Office panel is the "glance view" (medium, visual).
- **Tablet:** Office panel compresses to a horizontal status strip at the top — one row of small avatars with status dots. Sidebar + chat remain.
- **Mobile:** Deferred per Producer. No design work needed yet.

## Mood

Think: a well-lit co-working space on a Saturday morning. Wooden desks, warm lighting, paper coffee cups. Not sterile, not playful — productive and inviting.
