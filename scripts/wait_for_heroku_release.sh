#!/usr/bin/env bash
# =============================================================================
# Wait for Heroku Release and Dynos to be Ready
# =============================================================================
#
# Polls Heroku release status until it succeeds, then waits for all dynos
# to be in "up" state.
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
#   0 - Release succeeded and all dynos are up
#   1 - Release failed, dynos failed to start, or timed out
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

# Phase 1: Wait for release to complete
echo "Phase 1: Waiting for Heroku release to complete on ${APP_NAME}..."
echo "Max attempts: ${MAX_ATTEMPTS}, Poll interval: ${POLL_INTERVAL}s"

for ((i = 1; i <= MAX_ATTEMPTS; i++)); do
  json=$(heroku releases --json -a "$APP_NAME")
  status=$(echo "$json" | jq -r '.[0].status')
  current=$(echo "$json" | jq -r '.[0].current')
  target_release=$(echo "$json" | jq -r '.[0].version')

  if [ "$status" == "pending" ]; then
    echo "Waiting for release v${target_release} to finish (attempt $i/$MAX_ATTEMPTS)..."
    sleep "$POLL_INTERVAL"
    continue
  fi

  if [ "$status" == "succeeded" ] && [ "$current" == "true" ]; then
    echo "Release v${target_release} phase completed successfully."
    break
  fi

  echo "❌ Release failed with status: $status"
  exit 1
done

if [ "$status" == "pending" ]; then
  echo "❌ Timed out waiting for release after $MAX_ATTEMPTS attempts"
  exit 1
fi

# Phase 2: Wait for all dynos to be up and web dynos on target release (handles preboot)
echo ""
echo "Phase 2: Waiting for dynos to be ready (web dynos on release v${target_release})..."

for ((i = 1; i <= MAX_ATTEMPTS; i++)); do
  ps_json=$(heroku ps --json -a "$APP_NAME")
  
  dyno_count=$(echo "$ps_json" | jq 'length')
  
  if [ "$dyno_count" -eq 0 ]; then
    echo "No dynos found, waiting... (attempt $i/$MAX_ATTEMPTS)"
    sleep "$POLL_INTERVAL"
    continue
  fi
  
  # Check if all dynos are up (any type)
  up_count=$(echo "$ps_json" | jq '[.[] | select(.state == "up")] | length')
  all_up=$( [ "$up_count" -eq "$dyno_count" ] && echo "true" || echo "false" )
  
  # Check web dynos for preboot completion (only web dynos go through preboot)
  web_dyno_count=$(echo "$ps_json" | jq '[.[] | select(.type == "web")] | length')
  web_on_target=$(echo "$ps_json" | jq --arg v "$target_release" '[.[] | select(.type == "web" and .release.version == ($v | tonumber))] | length')
  old_web_count=$(echo "$ps_json" | jq --arg v "$target_release" '[.[] | select(.type == "web" and .release.version != ($v | tonumber))] | length')
  
  # Success: all dynos up AND all web dynos on target release (preboot complete)
  if [ "$all_up" == "true" ] && [ "$old_web_count" -eq 0 ]; then
    echo "✅ All $up_count dynos are up! Web dynos on release v${target_release}. Traffic is now routed to new dynos."
    exit 0
  fi
  
  # Show current state and continue waiting
  echo "Waiting for deployment to complete (attempt $i/$MAX_ATTEMPTS):"
  echo "  - Dynos up: $up_count / $dyno_count"
  if [ "$web_dyno_count" -gt 0 ]; then
    echo "  - Web dynos on v${target_release}: $web_on_target / $web_dyno_count"
    if [ "$old_web_count" -gt 0 ]; then
      echo "  - Old web dynos still serving: $old_web_count (preboot in progress)"
    fi
  fi
  sleep "$POLL_INTERVAL"
done

echo "❌ Timed out waiting for dynos after $MAX_ATTEMPTS attempts"
exit 1
