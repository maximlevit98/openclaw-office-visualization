# OpenClaw Office Visualization - Project Brief

Goal: build a custom dashboard that visualizes OpenClaw agents as office teammates with avatars, names, states, and a practical chat sidebar.

Core UX:
- Left sidebar with sessions/chats and filters.
- Main chat panel with messages and tool events.
- Agent office panel with avatar cards, role labels, and live states (idle/thinking/tool/error/offline).
- Mobile + desktop responsive layout.

Data source:
- OpenClaw Gateway (WebSocket + RPC) as the single source of truth.

Constraints:
- Keep gateway token server-side only.
- No open internet exposure by default; tailnet-only access is preferred.
- Build an MVP first, then visual polish.

MVP done criteria:
- Live session list and chat history render correctly.
- At least 5 configured agents displayed with avatars and statuses.
- Message send works from UI.
- Presence/status updates stream without page refresh.
