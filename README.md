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

## Git Progress Discipline
Every commit and push must include an update to `PROJECT_STATUS.md` with:
- what was done (`## Сделано`)
- what is next (`## Следующий шаг`)

Hooks enforce this rule:
1. Run once after clone: `./scripts/setup-git-hooks.sh`
2. Commit and push as usual.
3. If `PROJECT_STATUS.md` is not updated, commit/push is blocked.

## Live Transparency
Use these commands to see what agents are doing and what budget they consume:

- `openclaw cron list` — scheduler + last run status
- `openclaw cron runs --id <job_id> --limit 1` — last result per agent loop
- `openclaw gateway usage-cost --json` — token/cost snapshot
- `./scripts/monitor-agents.sh 30` — live console monitor (refresh every 30s)

## Direct Agent Prompt Control
You can directly inspect and edit prompts used by cron agents:

- `./scripts/agent-prompts.sh list`
- `./scripts/agent-prompts.sh show product`
- `./scripts/agent-prompts.sh edit frontend`
- `./scripts/agent-prompts.sh set tester /tmp/tester-prompt.txt`
- `./scripts/agent-prompts.sh run producer`
- `./scripts/agent-prompts.sh last summary`

Supported aliases:
`designer backend frontend tester debugger product producer summary tg-morning tg-evening`

Web UI:
- Open `/control` in the office app (`http://127.0.0.1:3000/control`) to:
  - inspect active cron jobs,
  - edit prompts,
  - run jobs manually,
  - see last run summary and token usage.
