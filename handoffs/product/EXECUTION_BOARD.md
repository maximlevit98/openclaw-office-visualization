# AGENT EXECUTION BOARD — CONTROL PANEL

Updated: 2026-02-21 14:40 (local)
Scope: /Users/maxim/Documents/openclaw-office-visualization

## Goal
Ship a transparent Agent Control Panel where work is visible in real time:
- live activity feed,
- clear project/job ownership,
- reliable run details,
- stable RU/EN behavior across all pages.

## Workflow Rules (Mandatory)
1. One run = one small shippable change.
2. One run = exactly one check command:
   - Dev roles: `npm run build`
   - QA/Debugger: `scripts/qa-gate.sh` (build + runtime smoke + err log scan)
3. No file sprawl: edit only target code + own handoff log.
4. If no safe change: write `NO_CHANGE` with reason.
5. Product commits only after tester status is PASS.
6. No large rewrites without explicit task id.

## Active Sprint Tasks

### Product
- `PROD-301` Keep this board current with status `TODO/IN_PROGRESS/DONE`.
- `PROD-302` Update `PROJECT_STATUS.md` on each checkpoint commit.
- `PROD-303` Commit and push only if tester last run is PASS.

### Designer
- `DES-301` Tighten visual rhythm in `/control`: spacing, hierarchy, compactness.
- `DES-302` Improve expanded Last Run readability (header, body, overflow states).

### Backend
- `BE-301` Extend control activity payload with useful run metadata (safe, non-breaking).
- `BE-302` Improve error payloads for control API endpoints (clear actionable messages).

### Frontend
- `FE-301` Improve `/control` live feed usability (scanability + clearer status markers).
- `FE-302` Ensure layout uses horizontal space better on >= 1440px screens.

### Tester
- `QA-301` Regression check for `/control` (RU/EN switch, create project visibility, Last Run open/scroll).
- `QA-302` Validate live activity feed updates without hard refresh.

### Debugger
- `DBG-301` Fix top bug from `handoffs/tester/bugs.md` if present.
- `DBG-302` If no open bugs, verify no regressions in latest touched files.

### Producer
- `APR-301` Gate release as `GO/NO_GO` with evidence from tester/debugger/product outputs.

## Definition Of Done (Per Task)
- Code changed in relevant file(s).
- Check command passed in the same run (`npm run build` or `scripts/qa-gate.sh` by role).
- For QA/Debugger: `/` and `/control` return `200` and err log has no runtime chunk/react manifest errors.
- Role handoff log updated with task id, changed files, result.
- No unrelated file churn.

## Current Status
- `IN_PROGRESS`: DES-301, BE-301, FE-301, QA-301, DBG-301
- `PENDING_GATE`: APR-301
