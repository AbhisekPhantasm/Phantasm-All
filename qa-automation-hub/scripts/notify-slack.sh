#!/usr/bin/env bash
set -euo pipefail

# Usage: SLACK_WEBHOOK_URL=... MESSAGE="..." bash scripts/notify-slack.sh
: "${SLACK_WEBHOOK_URL:?}"
: "${MESSAGE:?}"

curl -sS -X POST -H 'Content-type: application/json' \
  --data "{\"text\": $(node -p 'JSON.stringify(process.env.MESSAGE)')}" \
  "${SLACK_WEBHOOK_URL}" >/dev/null

echo "Slack notification sent."
