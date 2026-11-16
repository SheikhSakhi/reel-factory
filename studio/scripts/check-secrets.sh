#!/usr/bin/env bash
# Refuse to commit anything that looks like a secret. Run before every commit (the daily run does).
# Exit 1 and name the file if a staged change contains an API key, token or private key.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
staged=$(git diff --cached --name-only --diff-filter=ACM)
[ -z "$staged" ] && exit 0
if echo "$staged" | grep -E '(^|/)\.env(\.|$)|\.env\.local$' >/dev/null; then
  echo "check-secrets: refusing to commit an .env file:"; echo "$staged" | grep -E '\.env'; exit 1
fi
pattern='(ELEVENLABS_API_KEY|API_KEY|SECRET|TOKEN)[[:space:]]*[:=][[:space:]]*["'"'"']?[A-Za-z0-9_\-]{16,}|sk_[A-Za-z0-9]{24,}|-----BEGIN [A-Z ]*PRIVATE KEY-----'
if git diff --cached -U0 | grep -E '^\+' | grep -E "$pattern" >/dev/null; then
  echo "check-secrets: a staged change looks like a secret. Keep keys in studio/.env.local or the environment, never in git."
  git diff --cached -U0 | grep -nE "$pattern" | sed -E 's/([:=][[:space:]]*["'"'"']?)[A-Za-z0-9_\-]{6,}/\1<hidden>/' | head -5
  exit 1
fi
echo "check-secrets: clean"
