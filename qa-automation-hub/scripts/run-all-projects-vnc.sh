#!/usr/bin/env bash
# Run every project in tooling/projects.registry.json inside playwright-vnc (headed).
# Requires: docker compose up -d from hub (playwright-vnc running).
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

IDS="$(node -e "const fs=require('fs'); const r=JSON.parse(fs.readFileSync('tooling/projects.registry.json','utf8')); console.log(r.projects.map(p=>p.id).join(' '));")"

for id in ${IDS}; do
  echo ""
  echo "============================== PROJECT_ID=${id} =============================="
  docker compose exec -T playwright-vnc bash -lc "cd /mono/qa-automation-hub && export PHANTASM_MONO_ROOT=/mono CI=true HEADED=1 PROJECT_ID=${id} && bash scripts/run-project.sh" || {
    echo ">>> FAILED: ${id} (continuing)"
  }
done
echo ""
echo "Done all projects."
