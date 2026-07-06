#!/usr/bin/env bash
# =============================================================================
# Check for Migrations Since Last Deployment
# =============================================================================
#
# Compares the current commit with the last successful deployment to detect
# if any database migration files have changed. Used to determine whether
# to enable/disable Heroku preboot for zero-downtime deploys.
#
# Usage:
#   ./check_migrations_since_deploy.sh <owner> <repo> <environment> <current_sha> <ref_name>
#
# Arguments:
#   owner        - GitHub repository owner
#   repo         - GitHub repository name
#   environment  - GitHub environment name (e.g., "prod_env")
#   current_sha  - Current commit SHA being deployed
#   ref_name     - Current branch/ref name
#
# Environment:
#   GH_TOKEN - GitHub token for API access (required)
#
# Output:
#   Prints "true" if migrations detected, "false" otherwise.
#   Also sets GITHUB_OUTPUT if running in GitHub Actions.
#
# Exit codes:
#   0 - Check completed (result in stdout)
#   1 - Error occurred
#
# =============================================================================

set -euo pipefail

OWNER="${1:-}"
REPO="${2:-}"
ENVIRONMENT="${3:-}"
CURRENT_SHA="${4:-}"
REF_NAME="${5:-}"

if [ -z "$OWNER" ] || [ -z "$REPO" ] || [ -z "$ENVIRONMENT" ] || [ -z "$CURRENT_SHA" ] || [ -z "$REF_NAME" ]; then
  echo "Error: All arguments are required"
  echo "Usage: $0 <owner> <repo> <environment> <current_sha> <ref_name>"
  exit 1
fi

# Safe default: assume migrations exist (disables preboot)
safe_default() {
  echo "::warning::$1 - disabling preboot to be safe" >&2
  echo "true"
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "has_migrations=true" >> "$GITHUB_OUTPUT"
  fi
  exit 0
}

# Get the last successful deployment info using GraphQL
DEPLOYMENT_INFO=$(gh api graphql -f query='
  query($owner: String!, $repo: String!, $env: String!) {
    repository(owner: $owner, name: $repo) {
      deployments(environments: [$env], first: 20, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          commit {
            oid
            committedDate
          }
          latestStatus {
            state
          }
        }
      }
    }
  }
' -f owner="$OWNER" -f repo="$REPO" -f env="$ENVIRONMENT" \
  --jq '.data.repository.deployments.nodes[] | select(.latestStatus.state == "SUCCESS") | "\(.commit.oid) \(.commit.committedDate)"' \
  2>/dev/null | head -n 1) || safe_default "Failed to fetch deployment history"

# Parse commit OID and date from response
LAST_DEPLOYED=$(echo "$DEPLOYMENT_INFO" | awk '{print $1}')
DEPLOYED_DATE=$(echo "$DEPLOYMENT_INFO" | awk '{print $2}')

echo "Last deployed commit: $LAST_DEPLOYED" >&2
echo "Last deployed date: $DEPLOYED_DATE" >&2
echo "Current commit: $CURRENT_SHA" >&2

if [ -z "$LAST_DEPLOYED" ] || [ "$LAST_DEPLOYED" = "null" ]; then
  safe_default "No previous deployment found"
fi

# Calculate date - 1 day for safe shallow fetch
# Use date command to subtract 1 day from the deployed date
FETCH_SINCE_DATE=$(date -u -d "$DEPLOYED_DATE - 1 day" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || \
                   date -u -v-1d -j -f "%Y-%m-%dT%H:%M:%SZ" "$DEPLOYED_DATE" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || \
                   echo "$DEPLOYED_DATE")

echo "Fetching commits since: $FETCH_SINCE_DATE" >&2

# Fetch only the history needed to compare with last deployment
# Use --shallow-since with date - 1 day to be safe
git fetch --shallow-since="$FETCH_SINCE_DATE" origin "$REF_NAME" 2>/dev/null || true

# Get all changed files (fails with safe_default if history is unavailable)
ALL_CHANGES=$(git diff "$LAST_DEPLOYED" "$CURRENT_SHA" --name-only 2>/dev/null) || safe_default "Failed to diff commits"

# Filter for migration files
MIGRATION_CHANGES=$(echo "$ALL_CHANGES" | grep -E '/migrations/.*\.py$' || true)

if [ -n "$MIGRATION_CHANGES" ]; then
  echo "::warning::🗄️ Database migrations detected - disabling preboot" >&2
  echo "" >&2
  echo "Changed migration files:" >&2
  echo "$MIGRATION_CHANGES" >&2
  echo "true"
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "has_migrations=true" >> "$GITHUB_OUTPUT"
  fi
else
  echo "✅ No migration changes - enabling preboot for zero-downtime deploy" >&2
  echo "false"
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "has_migrations=false" >> "$GITHUB_OUTPUT"
  fi
fi
