#!/usr/bin/env bash
set -euo pipefail

ROOT="${OPENCLAW_OFFICE_ROOT:-/Users/maxim/Documents/openclaw-office-visualization}"
PORT="${OPENCLAW_DEV_PORT:-3000}"
ERR_LOG="${ROOT}/.logs/launchd-dev-3000.err.log"

BUILD_OUT="$(mktemp /tmp/qa-gate-build-out.XXXXXX)"
BUILD_ERR="$(mktemp /tmp/qa-gate-build-err.XXXXXX)"
RESP_BODY="$(mktemp /tmp/qa-gate-body.XXXXXX)"

cleanup() {
  rm -f "${BUILD_OUT}" "${BUILD_ERR}" "${RESP_BODY}"
}
trap cleanup EXIT

check_url() {
  local path="$1"
  local label
  case "${path}" in
    "/") label="ROOT" ;;
    "/control") label="CONTROL" ;;
    *) label="PATH_${path//\//_}" ;;
  esac
  local code
  code="$(curl -sS -m 8 -o "${RESP_BODY}" -w "%{http_code}" "http://127.0.0.1:${PORT}${path}" || true)"
  if [[ "${code}" != "200" ]]; then
    echo "QA_GATE:FAIL"
    echo "STEP:RUNTIME_SMOKE"
    echo "PATH:${path}"
    echo "LABEL:${label}"
    echo "HTTP_CODE:${code:-000}"
    return 1
  fi
  echo "${label}:200"
}

echo "QA_GATE:START"
echo "ROOT:${ROOT}"
echo "PORT:${PORT}"

echo "STEP:BUILD"
if ! (cd "${ROOT}" && npm run build >"${BUILD_OUT}" 2>"${BUILD_ERR}"); then
  echo "QA_GATE:FAIL"
  echo "STEP:BUILD"
  echo "FIRST_ERROR:$(tail -n 40 "${BUILD_ERR}" | sed '/^[[:space:]]*$/d' | head -n 1)"
  exit 1
fi
echo "BUILD:PASS"

echo "STEP:RUNTIME_SMOKE"
check_url "/"
check_url "/control"
echo "RUNTIME_SMOKE:PASS"

echo "STEP:ERRLOG_SCAN"
if [[ -f "${ERR_LOG}" ]]; then
  pattern="Cannot find module './[0-9]+\\.js'|webpack-runtime\\.js|React Client Manifest|__webpack_modules__\\[moduleId\\]"
  if command -v rg >/dev/null 2>&1; then
    rg -n "${pattern}" "${ERR_LOG}" >/tmp/qa-gate-log-hit.txt 2>/dev/null || true
  else
    grep -nE "${pattern}" "${ERR_LOG}" >/tmp/qa-gate-log-hit.txt 2>/dev/null || true
  fi
  if [[ -s /tmp/qa-gate-log-hit.txt ]]; then
    echo "QA_GATE:FAIL"
    echo "STEP:ERRLOG_SCAN"
    echo "ERRLOG_HIT:$(head -n 1 /tmp/qa-gate-log-hit.txt)"
    rm -f /tmp/qa-gate-log-hit.txt
    exit 1
  fi
  rm -f /tmp/qa-gate-log-hit.txt
fi
echo "ERRLOG_SCAN:PASS"

echo "QA_GATE:PASS"
