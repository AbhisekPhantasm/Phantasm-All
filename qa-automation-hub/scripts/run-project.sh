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
  echo "ERROR: tooling/projects.registry.json not found in ${ROOT_DIR}"
  exit 1
fi

# Resolve the project's repo path from the registry. We do this in Node so
# the registry schema stays single-source-of-truth.
RESOLVED="$(PHANTASM_MONO_ROOT="${PHANTASM_MONO_ROOT}" PROJECT_ID="${PROJECT_ID}" ENVIRONMENT="${ENVIRONMENT}" node --input-type=module -e "
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const mono = process.env.PHANTASM_MONO_ROOT;
const r = JSON.parse(readFileSync('tooling/projects.registry.json','utf8'));
const p = r.projects.find(x => x.id === process.env.PROJECT_ID);
if (!p) { console.error('Unknown PROJECT_ID: ' + process.env.PROJECT_ID); process.exit(2); }
const env = r.environments.find(e => e.id === (process.env.ENVIRONMENT || 'dev'));
if (!env) { console.error('Unknown ENVIRONMENT: ' + process.env.ENVIRONMENT); process.exit(3); }
console.log(resolve(mono, p.repoPath));
console.log(env.baseUrl);
")"

PROJECT_PATH="$(printf '%s\n' "${RESOLVED}" | sed -n '1p')"
ENV_BASE_URL="$(printf '%s\n' "${RESOLVED}" | sed -n '2p')"

if [[ ! -d "${PROJECT_PATH}" ]]; then
  echo "ERROR: project path does not exist: ${PROJECT_PATH}"
  echo "       PHANTASM_MONO_ROOT=${PHANTASM_MONO_ROOT}"
  echo "       Hint: the Jenkins job's SCM must check out the full Phantasm-All"
  echo "       repo (not just qa-automation-hub), so sibling project directories"
  echo "       are present at \${PHANTASM_MONO_ROOT}/<repoPath>."
  exit 4
fi

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

# Hub-level install (only needed when the hub itself has dependencies to pull,
# e.g. for shared packages used by example-acme-ui).
if [[ -f package-lock.json ]]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

# Shared hub packages are only required for in-hub template projects using @qa-hub/*
if [[ "${PROJECT_ID}" == "example-acme-ui" ]]; then
  npm run build:shared
fi

pushd "${PROJECT_PATH}" >/dev/null

if [[ -f package-lock.json ]]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

# Browsers: cached under PLAYWRIGHT_BROWSERS_PATH (set in the Jenkins image to
# /var/jenkins_home/.cache/ms-playwright) so they survive container restarts.
# System deps are baked into the controller image, so we skip --with-deps here.
if [[ "${PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD:-}" == "1" ]]; then
  echo "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 - skipping playwright install"
else
  npx playwright install "${BROWSER}"
fi

PLAYWRIGHT_ARGS=(test --pass-with-no-tests)

# CLI overrides config. Some project configs (e.g. Elitekem) don't read
# process.env.HEADED at all, so the env var alone isn't enough.
if [[ "${HEADED:-0}" == "1" ]]; then
  PLAYWRIGHT_ARGS+=(--headed)
fi

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

{
  echo "PROJECT_PATH=${PROJECT_PATH}"
  echo "EXIT_CODE=${EXIT_CODE}"
} > qa-hub-last-run.env

exit "${EXIT_CODE}"
