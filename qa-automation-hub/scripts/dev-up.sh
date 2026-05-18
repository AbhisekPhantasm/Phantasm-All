#!/usr/bin/env bash
# Start Jenkins + playwright-vnc (Xvfb + noVNC) from the hub root.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"
docker compose up -d --build
echo ""
echo "Jenkins: http://localhost:8080/"
echo "noVNC:   http://127.0.0.1:6080/vnc.html   (or /novnc/vnc.html)"
echo ""
echo "Optional — run every registered project (headed, long):"
echo "  bash scripts/run-all-projects-vnc.sh"
