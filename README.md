# OpenClaw Office Visualization

Multi-agent project to build a custom OpenClaw control interface with:
- chat sidebar,
- office-style agent avatars/names/status,
- real-time session and presence updates.

## Team Agents
- producer
- product
- designer
- backend
- frontend
- tester
- debugger

## Artifacts
- `handoffs/` role outputs
- `specs/` formal specs
- `docs/` architecture/notes

## Automation
The OpenClaw cron pipeline runs role cycles hourly in sequence:
product -> producer -> designer -> backend -> frontend -> tester -> debugger

Owner summary is delivered hourly to Telegram (executive format).
