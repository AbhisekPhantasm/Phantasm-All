#!/usr/bin/env bash
set -euo pipefail

# Central runner invoked by Jenkins (Linux) and usable locally in WSL/Git Bash.
# Required env:
#   PROJECT_ID   (matches tooling/projects.registry.json)
# Optional env:
#   PHANTASM_MONO_ROOT  (folder that contains qa-automation-hub + sibling projects; default: parent of hub)
#   ENVIRONMENT, BROWSER, TAGS, HEADED, PW_WORKERS, SHARD_INDEX, SHARD_TOTAL, BASE_URL, LOG_LEVEL

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

: "${PROJECT_ID:?PROJECT_ID is required}"

export ENVIRONMENT="${ENVIRONMENT:-dev}"

if [[ -z "${PHANTASM_MONO_ROOT:-}" ]]; then
  export PHANTASM_MONO_ROOT="$(cd "${ROOT_DIR}/.." && pwd)"
fi

if [[ ! -f tooling/projects.registry.json ]]; then
  echo "Missing tooling/projects.registry.json"
  exit 1
fi

PROJECT_PATH="$(PHANTASM_MONO_ROOT="${PHANTASM_MONO_ROOT}" PROJECT_ID="${PROJECT_ID}" ENVIRONMENT="${ENVIRONMENT}" node --input-type=module -e "
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const mono = process.env.PHANTASM_MONO_ROOT;
const r = JSON.parse(readFileSync('tooling/projects.registry.json','utf8'));
const p = r.projects.find(x => x.id === process.env.PROJECT_ID);
if (!p) { console.error('Unknown PROJECT_ID'); process.exit(2); }
const env = r.environments.find(e => e.id === (process.env.ENVIRONMENT || 'dev'));
if (!env) { console.error('Unknown ENVIRONMENT'); process.exit(3); }
console.log(resolve(mono, p.repoPath));
")"

ENV_BASE_URL="$(node --input-type=module -e "
import { readFileSync } from 'node:fs';
const r = JSON.parse(readFileSync('tooling/projects.registry.json','utf8'));
const env = r.environments.find(e => e.id === (process.env.ENVIRONMENT || 'dev'));
if (!env) process.exit(3);
console.log(env.baseUrl);
")"

export PROJECT_PATH
export BASE_URL="${BASE_URL:-$ENV_BASE_URL}"
export TEST_ENV="${ENVIRONMENT:-dev}"
export BROWSER="${BROWSER:-chromium}"
export HEADED="${HEADED:-0}"
export PW_WORKERS="${PW_WORKERS:-4}"
export LOG_LEVEL="${LOG_LEVEL:-info}"

echo "== QA Hub run =="
echo "PHANTASM_MONO_ROOT=${PHANTASM_MONO_ROOT}"
echo "PROJECT_ID=${PROJECT_ID}"
echo "PROJECT_PATH=${PROJECT_PATH}"
echo "BASE_URL=${BASE_URL}"
echo "BROWSER=${BROWSER} HEADED=${HEADED}"

if [[ -f package-lock.json ]]; then npm ci; else npm install; fi

# Shared hub packages are only required for in-hub template projects using @qa-hub/*
if [[ "${PROJECT_ID}" == "example-acme-ui" ]]; then
  npm run build:shared
fi

pushd "${PROJECT_PATH}" >/dev/null

if [[ -f package-lock.json ]]; then npm ci; else npm install; fi

# Official Playwright Docker images ship browsers for a pinned version; skip redundant downloads when requested.
if [[ "${PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD:-}" == "1" ]]; then
  echo "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 — skipping playwright install"
else
  npx playwright install --with-deps
fi

PLAYWRIGHT_ARGS=(test --pass-with-no-tests)

if [[ -n "${TAGS:-}" ]]; then
  PLAYWRIGHT_ARGS+=(--grep "${TAGS}")
fi

if [[ -n "${SHARD_INDEX:-}" && -n "${SHARD_TOTAL:-}" ]]; then
  PLAYWRIGHT_ARGS+=(--shard "${SHARD_INDEX}/${SHARD_TOTAL}")
fi

set +e
npx playwright "${PLAYWRIGHT_ARGS[@]}"
EXIT_CODE=$?
set -e

popd >/dev/null

echo "PROJECT_PATH=${PROJECT_PATH}" > qa-hub-last-run.env
echo "EXIT_CODE=${EXIT_CODE}" >> qa-hub-last-run.env

exit "${EXIT_CODE}"
