#!/usr/bin/env bash
set -euo pipefail

PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/bin:/bin:/usr/sbin:/sbin"

usage() {
  cat <<'EOF'
Agent Prompt Control

Usage:
  ./scripts/agent-prompts.sh list
  ./scripts/agent-prompts.sh show <role|job-id|job-name>
  ./scripts/agent-prompts.sh edit <role|job-id|job-name>
  ./scripts/agent-prompts.sh set <role|job-id|job-name> <prompt-file>
  ./scripts/agent-prompts.sh run <role|job-id|job-name>
  ./scripts/agent-prompts.sh last <role|job-id|job-name>

Roles:
  designer backend frontend tester debugger product producer summary tg-morning tg-evening

Examples:
  ./scripts/agent-prompts.sh list
  ./scripts/agent-prompts.sh show product
  ./scripts/agent-prompts.sh edit frontend
  ./scripts/agent-prompts.sh set tester /tmp/tester-prompt.txt
  ./scripts/agent-prompts.sh run producer
  ./scripts/agent-prompts.sh last summary
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing command: $1"
    exit 1
  fi
}

require_cmd openclaw
require_cmd jq

ROLE_TO_NAME_designer="office-designer-loop"
ROLE_TO_NAME_backend="office-backend-loop"
ROLE_TO_NAME_frontend="office-frontend-loop"
ROLE_TO_NAME_tester="office-tester-loop"
ROLE_TO_NAME_debugger="office-debugger-loop"
ROLE_TO_NAME_product="office-product-loop"
ROLE_TO_NAME_producer="office-producer-approval"
ROLE_TO_NAME_summary="office-exec-summary"
ROLE_TO_NAME_tg_morning="news-digest-morning"
ROLE_TO_NAME_tg_evening="news-digest-evening"

get_jobs_json() {
  openclaw cron list --all --json
}

resolve_query_to_id() {
  local query="$1"
  local jobs_json
  jobs_json="$(get_jobs_json)"

  local normalized="${query//-/_}"
  local mapped_name=""
  case "${normalized}" in
    designer) mapped_name="${ROLE_TO_NAME_designer}" ;;
    backend) mapped_name="${ROLE_TO_NAME_backend}" ;;
    frontend) mapped_name="${ROLE_TO_NAME_frontend}" ;;
    tester) mapped_name="${ROLE_TO_NAME_tester}" ;;
    debugger) mapped_name="${ROLE_TO_NAME_debugger}" ;;
    product) mapped_name="${ROLE_TO_NAME_product}" ;;
    producer) mapped_name="${ROLE_TO_NAME_producer}" ;;
    summary) mapped_name="${ROLE_TO_NAME_summary}" ;;
    tg_morning) mapped_name="${ROLE_TO_NAME_tg_morning}" ;;
    tg_evening) mapped_name="${ROLE_TO_NAME_tg_evening}" ;;
  esac

  if [[ -n "${mapped_name}" ]]; then
    query="${mapped_name}"
  fi

  local by_id
  by_id="$(jq -r --arg q "${query}" '.jobs[] | select(.id == $q) | .id' <<<"${jobs_json}" | head -n 1)"
  if [[ -n "${by_id}" ]]; then
    echo "${by_id}"
    return
  fi

  local by_name
  by_name="$(jq -r --arg q "${query}" '.jobs[] | select(.name == $q) | .id' <<<"${jobs_json}" | head -n 1)"
  if [[ -n "${by_name}" ]]; then
    echo "${by_name}"
    return
  fi

  local by_agent
  by_agent="$(jq -r --arg q "${query}" '.jobs[] | select(.agentId == $q) | .id' <<<"${jobs_json}" | head -n 1)"
  if [[ -n "${by_agent}" ]]; then
    echo "${by_agent}"
    return
  fi

  echo ""
}

job_row() {
  local id="$1"
  get_jobs_json | jq -r --arg id "${id}" '
    .jobs[]
    | select(.id == $id)
    | "id=\(.id)\nname=\(.name)\nagent=\(.agentId)\nschedule=\(
        if .schedule.kind=="cron" then .schedule.expr
        elif .schedule.kind=="every" then ("every " + ((.schedule.everyMs/60000)|tostring) + "m")
        else .schedule.kind
        end
      )\nnext=\(.state.nextRunAtMs // "-")\nlast_status=\(.state.lastStatus // "-")\nlast_duration_ms=\(.state.lastDurationMs // "-")"
  '
}

show_prompt() {
  local id="$1"
  get_jobs_json | jq -r --arg id "${id}" '.jobs[] | select(.id == $id) | .payload.message // ""'
}

list_jobs() {
  get_jobs_json | jq -r '
    .jobs[]
    | [.id, .name, .agentId, (.state.lastStatus // "-"), (.state.nextRunAtMs // "-")]
    | @tsv
  ' | awk -F '\t' 'BEGIN {printf "%-38s  %-28s  %-10s  %-8s  %s\n", "ID", "NAME", "AGENT", "STATUS", "NEXT_RUN_AT_MS"} {printf "%-38s  %-28s  %-10s  %-8s  %s\n", $1, $2, $3, $4, $5}'
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

cmd="$1"
shift

case "${cmd}" in
  list)
    list_jobs
    ;;
  show)
    [[ $# -eq 1 ]] || { usage; exit 1; }
    q="$1"
    id="$(resolve_query_to_id "${q}")"
    [[ -n "${id}" ]] || { echo "Job not found: ${q}"; exit 1; }
    echo "=== JOB ==="
    job_row "${id}"
    echo
    echo "=== PROMPT ==="
    show_prompt "${id}"
    ;;
  edit)
    [[ $# -eq 1 ]] || { usage; exit 1; }
    q="$1"
    id="$(resolve_query_to_id "${q}")"
    [[ -n "${id}" ]] || { echo "Job not found: ${q}"; exit 1; }
    original="$(show_prompt "${id}")"
    tmp="$(mktemp /tmp/openclaw-prompt.XXXXXX.txt)"
    printf "%s" "${original}" > "${tmp}"
    "${EDITOR:-nano}" "${tmp}"
    updated="$(cat "${tmp}")"
    rm -f "${tmp}"
    if [[ "${updated}" == "${original}" ]]; then
      echo "No changes."
      exit 0
    fi
    openclaw cron edit "${id}" --message "${updated}" >/dev/null
    echo "Updated prompt for ${id}."
    ;;
  set)
    [[ $# -eq 2 ]] || { usage; exit 1; }
    q="$1"
    file="$2"
    [[ -f "${file}" ]] || { echo "Prompt file not found: ${file}"; exit 1; }
    id="$(resolve_query_to_id "${q}")"
    [[ -n "${id}" ]] || { echo "Job not found: ${q}"; exit 1; }
    openclaw cron edit "${id}" --message "$(cat "${file}")" >/dev/null
    echo "Updated prompt for ${id} from ${file}."
    ;;
  run)
    [[ $# -eq 1 ]] || { usage; exit 1; }
    q="$1"
    id="$(resolve_query_to_id "${q}")"
    [[ -n "${id}" ]] || { echo "Job not found: ${q}"; exit 1; }
    openclaw cron run "${id}"
    ;;
  last)
    [[ $# -eq 1 ]] || { usage; exit 1; }
    q="$1"
    id="$(resolve_query_to_id "${q}")"
    [[ -n "${id}" ]] || { echo "Job not found: ${q}"; exit 1; }
    openclaw cron runs --id "${id}" --limit 1
    ;;
  *)
    usage
    exit 1
    ;;
esac
