#!/usr/bin/env bash
set -euo pipefail

# Optional SMTP notifier (Gmail/Google Workspace) using curl + openssl s_client is brittle.
# Recommended enterprise path: Jenkins Email Extension (emailext) with SMTP creds in Jenkins.
#
# If you insist on script-level SMTP with Gmail:
# - Create an App Password (Google Account) or use OAuth2 with a proper mail library.
# - Export:
#     SMTP_HOST=smtp.gmail.com
#     SMTP_PORT=465
#     SMTP_USER=you@gmail.com
#     SMTP_PASS=app-password
#     MAIL_TO=team@example.com
#     MAIL_SUBJECT=...
#     MAIL_BODY=...
#
# This stub keeps the hook explicit and auditable.
if [[ -z "${SMTP_HOST:-}" ]]; then
  echo "notify-email.sh: SMTP_HOST not set; skipping direct SMTP send."
  exit 0
fi

echo "notify-email.sh: configure Jenkins emailext for production mail."
echo "For local experiments, prefer: https://github.com/jenkinsci/email-ext-plugin"
