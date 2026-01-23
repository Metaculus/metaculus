#!/usr/bin/env bash
# =============================================================================
# Wait for Heroku Release to Complete
# =============================================================================
#
# Polls Heroku release status until it succeeds, fails, or times out.
#
# Usage:
#   ./wait_for_heroku_release.sh <app_name> [max_attempts]
#
# Arguments:
#   app_name      - Heroku app name (required)
#   max_attempts  - Maximum polling attempts (optional, default: 60)
#
# Environment:
#   HEROKU_API_KEY - Heroku API key (required, used by heroku CLI)
#
# Exit codes:
#   0 - Release succeeded
#   1 - Release failed or timed out
#
# =============================================================================

set -euo pipefail

APP_NAME="${1:-}"
MAX_ATTEMPTS="${2:-60}"
POLL_INTERVAL=5

if [ -z "$APP_NAME" ]; then
  echo "Error: Heroku app name is required"
  echo "Usage: $0 <app_name> [max_attempts]"
  exit 1
fi

echo "Waiting for Heroku release to complete on ${APP_NAME}..."
echo "Max attempts: ${MAX_ATTEMPTS}, Poll interval: ${POLL_INTERVAL}s"

for ((i = 1; i <= MAX_ATTEMPTS; i++)); do
  json=$(heroku releases --json -a "$APP_NAME")
  status=$(echo "$json" | jq -r '.[0].status')
  current=$(echo "$json" | jq -r '.[0].current')

  if [ "$status" == "pending" ]; then
    echo "Waiting for release to finish (attempt $i/$MAX_ATTEMPTS)..."
    sleep "$POLL_INTERVAL"
    continue
  fi

  if [ "$status" == "succeeded" ] && [ "$current" == "true" ]; then
    echo "✅ Release succeeded!"
    exit 0
  fi

  echo "❌ Release failed with status: $status"
  exit 1
done

echo "❌ Timed out waiting for release after $MAX_ATTEMPTS attempts"
exit 1
