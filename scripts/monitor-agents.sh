#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/Users/maxim/Documents/openclaw-office-visualization"
PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/bin:/bin:/usr/sbin:/sbin"

INTERVAL_SECONDS="${1:-30}"

while true; do
  clear
  echo "=== OPENCLAW LIVE MONITOR ==="
  date "+%Y-%m-%d %H:%M:%S %Z"
  echo

  echo "[1/4] Cron jobs"
  openclaw cron list || true
  echo

  echo "[2/4] Usage cost (today aggregate)"
  openclaw gateway usage-cost || true
  echo

  echo "[3/4] Recent commits (last 2h)"
  git -C "${REPO_DIR}" log --since="2 hours ago" --oneline -n 8 || true
  echo

  echo "[4/4] Working tree status"
  git -C "${REPO_DIR}" status --short || true
  echo
  echo "Refresh in ${INTERVAL_SECONDS}s (Ctrl+C to stop)"
  sleep "${INTERVAL_SECONDS}"
done
