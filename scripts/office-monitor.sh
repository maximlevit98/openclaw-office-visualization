#!/usr/bin/env bash
set -euo pipefail
ROOT="/Users/maxim/Documents/openclaw-office-visualization"
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"

if ! command -v openclaw >/dev/null 2>&1; then
  echo "openclaw is not in PATH" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required for office-monitor.sh" >&2
  exit 1
fi

while true; do
  clear 2>/dev/null || true
  echo "=== OPENCLAW OFFICE MONITOR ==="
  date
  echo

  echo "[CRON STATUS]"
  openclaw cron list --all --json \
    | jq -r '
      def ts($v):
        if ($v // 0) > 0 then (($v / 1000) | localtime | strftime("%Y-%m-%d %H:%M:%S")) else "-" end;
      .jobs[]
      | select(.name | startswith("office-"))
      | "- \(.name): last=\(.state.lastStatus // "-") at=\(ts(.state.lastRunAtMs)) next=\(ts(.state.nextRunAtMs)) err=\(.state.lastError // "-")"
    '
  echo

  echo "[WORK PROOF]"
  echo "Uncommitted files:"
  git -C "$ROOT" status --short | sed -n '1,20p' || true
  echo

  echo "Last commits:"
  git -C "$ROOT" log --pretty='- %h %ad %s' --date='format:%Y-%m-%d %H:%M:%S' -n 10 || true
  echo

  echo "Recent touched files:"
  find "$ROOT" -type f -not -path '*/.git/*' -not -path '*/node_modules/*' -print0 \
    | xargs -0 stat -f '%m %Sm %N' -t '%Y-%m-%d %H:%M:%S' \
    | sort -rn | head -n 15

  echo
  echo "refresh: 20s (Ctrl+C to exit)"
  sleep 20
done
