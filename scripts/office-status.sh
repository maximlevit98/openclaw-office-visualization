#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/maxim/Documents/openclaw-office-visualization"
SUMMARY_JOB_ID="e5b99e66-60ab-4e26-b990-e1a88ae1913c"
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"

if ! command -v openclaw >/dev/null 2>&1; then
  echo "openclaw is not in PATH" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required for office-status.sh" >&2
  exit 1
fi

echo "=== OFFICE STATUS SNAPSHOT ==="
date
echo

echo "[CRON]"
openclaw cron list --all --json \
  | jq -r '
    def ts($v):
      if ($v // 0) > 0 then (($v / 1000) | localtime | strftime("%Y-%m-%d %H:%M:%S")) else "-" end;
    .jobs[]
    | select(.name | startswith("office-"))
    | "- \(.name): \(.state.lastStatus // "-"), last=\(ts(.state.lastRunAtMs)), next=\(ts(.state.nextRunAtMs)), err=\(.state.lastError // "-")"
  '
echo

echo "[GIT]"
git -C "$ROOT" status --short | sed -n '1,30p' || true
echo
git -C "$ROOT" log --pretty='- %h %ad %s' --date='format:%Y-%m-%d %H:%M:%S' -n 6 || true
echo

echo "[LAST TG REPORT]"
openclaw cron runs --id "$SUMMARY_JOB_ID" --limit 1 \
  | jq -r '.entries[0].summary // "no summary yet"'
