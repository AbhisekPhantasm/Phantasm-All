#!/usr/bin/env bash
set -euo pipefail

# Copies per-project artifacts into a stable archive folder (host-mounted volume in CI).
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

: "${PROJECT_ID:?}"
BUILD_TAG="${BUILD_TAG:-local}"

if [[ ! -f qa-hub-last-run.env ]]; then
  echo "collect-artifacts.sh: qa-hub-last-run.env missing; skipping."
  exit 0
fi

# shellcheck disable=SC1091
source qa-hub-last-run.env
: "${PROJECT_PATH:?PROJECT_PATH missing inside qa-hub-last-run.env}"

DEST="${ARTIFACT_ROOT:-${ROOT_DIR}/artifacts}/${BUILD_TAG}/${PROJECT_ID}"
mkdir -p "${DEST}"

if [[ -d "${PROJECT_PATH}/playwright-report" ]]; then
  mkdir -p "${DEST}/playwright-report"
  cp -a "${PROJECT_PATH}/playwright-report/." "${DEST}/playwright-report/" || true
fi
if [[ -d "${PROJECT_PATH}/test-results" ]]; then
  mkdir -p "${DEST}/test-results"
  cp -a "${PROJECT_PATH}/test-results/." "${DEST}/test-results/" || true
fi
if [[ -d "${PROJECT_PATH}/allure-results" ]]; then
  mkdir -p "${DEST}/allure-results"
  cp -a "${PROJECT_PATH}/allure-results/." "${DEST}/allure-results/" || true
fi

echo "Artifacts archived to: ${DEST}"
