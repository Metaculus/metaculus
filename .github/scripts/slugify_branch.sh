#!/usr/bin/env bash
#
# Slugify a git branch ref into a name that is safe for preview-environment
# resources (Fly apps, Fly Redis databases, Neon branches, Docker tags).
#
# Usage: slugify_branch.sh <branch-ref> [max-length]
#
# Reserved tokens are dropped rather than escaped: hosting providers refuse
# resource names containing "github" (GitHub's trademark policy), and agent
# tooling routinely opens PRs from branches like `claude/github-issue-123-foo`.

set -euo pipefail

BRANCH_REF="${1:-}"
MAX_LENGTH="${2:-30}"

# Space-separated tokens stripped from the slug. Matched as whole dash-delimited
# tokens, so `github-issue-1` -> `issue-1` but `flagship-1` is left alone.
# `claude`/`codex` are dropped as noise: every agent branch carries one, so they
# waste the length budget without distinguishing one preview from another.
RESERVED_TOKENS="github claude codex"

# Lowercase, then collapse everything that is not [a-z0-9] into single dashes.
SLUG="$(printf '%s' "$BRANCH_REF" | tr '[:upper:]' '[:lower:]' | sed -e 's/[^a-z0-9]/-/g')"

SLUG="$(printf '%s' "$SLUG" | awk -v reserved="$RESERVED_TOKENS" '
  BEGIN {
    n = split(reserved, list, " ")
    for (i = 1; i <= n; i++) drop[list[i]] = 1
  }
  {
    out = ""
    count = split($0, parts, "-")
    for (i = 1; i <= count; i++) {
      if (parts[i] == "" || (parts[i] in drop)) continue
      out = (out == "") ? parts[i] : out "-" parts[i]
    }
    print out
  }
')"

SLUG="$(printf '%s' "$SLUG" | cut -c "1-${MAX_LENGTH}" | sed -e 's/^-*//' -e 's/-*$//')"

# A branch made entirely of reserved/invalid tokens would otherwise yield an
# empty slug and produce trailing-dash resource names, which Fly.io rejects.
if [ -z "$SLUG" ]; then
  SLUG="branch"
fi

printf '%s\n' "$SLUG"
