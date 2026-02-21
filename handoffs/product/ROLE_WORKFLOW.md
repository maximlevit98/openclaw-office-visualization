# Role Workflow (Continuous Mode)

## Pipeline Order (Hourly)
1. Designer
2. Backend
3. Frontend
4. Tester
5. Debugger
6. Product
7. Producer
8. Summary to Telegram

## Role Contracts

### Designer
- Input: `handoffs/product/EXECUTION_BOARD.md`
- Output: `handoffs/designer/component-spec.md`
- Rule: exactly one UI-focused code change.

### Backend
- Input: `handoffs/product/EXECUTION_BOARD.md`
- Output: `handoffs/backend/dev-log.md`
- Rule: exactly one API/backend code change.

### Frontend
- Input: `handoffs/product/EXECUTION_BOARD.md`
- Output: `handoffs/frontend/dev-log.md`
- Rule: exactly one UX/frontend code change.

### Tester
- Input: latest repo state
- Output: `handoffs/tester/test-report.md`, optional `handoffs/tester/bugs.md`
- Rule: execute `scripts/qa-gate.sh` and return PASS/FAIL.
- Gate includes: `npm run build`, `GET /` + `GET /control` on `127.0.0.1:3000`, and `.logs/launchd-dev-3000.err.log` runtime chunk scan.

### Debugger
- Input: `handoffs/tester/bugs.md`
- Output: `handoffs/debugger/fix-log.md`, `handoffs/debugger/triage.md`
- Rule: fix only one top bug, rerun `scripts/qa-gate.sh`, or report NO_OPEN_BUGS.

### Product
- Input: all handoff logs + git status/log
- Output: `handoffs/product/task-board.md`, `handoffs/product/cycle-summary.md`, `PROJECT_STATUS.md`
- Rule: commit/push only if tester is PASS.

### Producer
- Input: product/tester/debugger outputs
- Output: `handoffs/producer/approval.md`
- Rule: GO/NO_GO with evidence and blockers.

## Stop Conditions
- Build fails: stop and log first error line.
- Runtime smoke fails (`/` or `/control` not `200`): stop and log endpoint + code.
- Runtime chunk/react manifest errors in `.logs/launchd-dev-3000.err.log`: stop and log first hit.
- No safe change: log NO_CHANGE.
- Merge/conflict risk: stop and log BLOCKED.
