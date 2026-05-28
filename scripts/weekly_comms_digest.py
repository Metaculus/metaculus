#!/usr/bin/env python3
"""Weekly Slack digest of comms-relevant PRs.

Collects recent PRs, asks Claude Sonnet to classify which are
comms-worthy, and posts a summary to Slack via webhook.

Usage:
    python scripts/weekly_comms_digest.py              # posts to Slack
    python scripts/weekly_comms_digest.py --dry-run    # prints payload only
"""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone

# ---------------------------------------------------------------------------
# GitHub helpers
# ---------------------------------------------------------------------------

GITHUB_API = "https://api.github.com"
REPO = os.environ.get("GITHUB_REPOSITORY", "Metaculus/metaculus")
BOT_SUFFIXES = ("[bot]",)


def _gh_headers():
    token = os.environ.get("GITHUB_TOKEN", "")
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _gh_get(path):
    """GET a GitHub API path, handling pagination."""
    results = []
    url = f"{GITHUB_API}{path}"
    while url:
        req = urllib.request.Request(url, headers=_gh_headers())
        with urllib.request.urlopen(req) as resp:
            results.extend(json.loads(resp.read()))
            # Follow Link: <...>; rel="next"
            link = resp.headers.get("Link", "")
            url = None
            for part in link.split(","):
                if 'rel="next"' in part:
                    url = part.split("<")[1].split(">")[0]
    return results


def _gh_graphql(query, variables=None):
    """Execute a GitHub GraphQL query."""
    token = os.environ.get("GITHUB_TOKEN", "")
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        "https://api.github.com/graphql", data=body, headers=headers
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def _is_bot(pr):
    user = pr.get("user", {}).get("login", "")
    return any(user.endswith(s) for s in BOT_SUFFIXES)


def _truncate(text, max_len=500):
    if not text:
        return ""
    if len(text) <= max_len:
        return text
    return text[:max_len] + "..."


def _get_changed_files(pr_number):
    """Return list of changed file paths for a PR."""
    files = _gh_get(f"/repos/{REPO}/pulls/{pr_number}/files")
    return [f["filename"] for f in files]


def _get_linked_issues(pr_number):
    """Return titles and bodies of issues linked via closingIssuesReferences."""
    owner, name = REPO.split("/")
    query = """
    query($owner: String!, $name: String!, $number: Int!) {
      repository(owner: $owner, name: $name) {
        pullRequest(number: $number) {
          closingIssuesReferences(first: 10) {
            nodes {
              title
              body
            }
          }
        }
      }
    }
    """
    result = _gh_graphql(
        query, {"owner": owner, "name": name, "number": pr_number}
    )
    nodes = (
        result.get("data", {})
        .get("repository", {})
        .get("pullRequest", {})
        .get("closingIssuesReferences", {})
        .get("nodes", [])
    )
    return [
        {"title": n["title"], "body": _truncate(n.get("body", ""), 300)}
        for n in nodes
    ]


def collect_prs():
    """Return (in_flight, shipped) PR data dicts."""
    now = datetime.now(timezone.utc)
    since_14d = (now - timedelta(days=14)).isoformat()
    since_7d = now - timedelta(days=7)

    # In-flight: open, non-draft, updated in last 14 days
    open_prs = _gh_get(
        f"/repos/{REPO}/pulls?state=open&sort=updated&direction=desc&per_page=100"
    )
    in_flight = []
    for pr in open_prs:
        if pr.get("draft"):
            continue
        if _is_bot(pr):
            continue
        updated = datetime.fromisoformat(pr["updated_at"].replace("Z", "+00:00"))
        if updated < datetime.fromisoformat(since_14d):
            continue
        in_flight.append(pr)

    # Shipped: merged in last 7 days
    # Use search API for merged PRs
    merged_prs = _gh_get(
        f"/repos/{REPO}/pulls?state=closed&sort=updated&direction=desc&per_page=100"
    )
    shipped = []
    for pr in merged_prs:
        if not pr.get("merged_at"):
            continue
        if _is_bot(pr):
            continue
        merged = datetime.fromisoformat(pr["merged_at"].replace("Z", "+00:00"))
        if merged < since_7d:
            continue
        shipped.append(pr)

    def enrich(pr):
        number = pr["number"]
        return {
            "number": number,
            "title": pr["title"],
            "body": _truncate(pr.get("body", "")),
            "labels": [l["name"] for l in pr.get("labels", [])],
            "changed_files": _get_changed_files(number),
            "linked_issues": _get_linked_issues(number),
        }

    return [enrich(pr) for pr in in_flight], [enrich(pr) for pr in shipped]


# ---------------------------------------------------------------------------
# Claude classification
# ---------------------------------------------------------------------------

CLASSIFICATION_PROMPT = """\
You are a communications assistant for Metaculus, a forecasting platform.

Your job: given two lists of pull requests (PRs), decide which ones are significant enough that the comms team could write about them.

## Core criterion (apply this strictly)

"Could comms write a good, non-spammy Twitter post about this, *or is it at least that significant*?"

Tweet-worthy is the floor, not the ceiling -- bigger things obviously qualify too.
Be stringent. When in doubt, exclude. Most PRs fail this test; that is correct.
A quiet week means empty results, and that is fine.

## Rubric

**Include**: new user-facing features, new public pages, significant UX overhauls, notable integrations.

**Exclude**: bugfixes, refactors, dependency bumps, build/infra changes, internal tooling, small copy or FAQ additions, minor settings changes, performance tweaks unless dramatically user-visible.

Note: user-facing is necessary but not sufficient. A single FAQ entry or a default-sort change is user-facing but not tweetable.

## Worked examples

These examples show the reasoning you should apply:

- "Labor Hub page" -> INCLUDE (new public page)
- "New question feed updates" -> INCLUDE (significant UX overhaul of a core surface)
- "Issue/3350/feat/follow reorganization" -> INCLUDE (major feature revamp)
- "feat: add Key Factors FAQ entry" -> EXCLUDE (too small, single FAQ entry)
- "add bulk forecast and comment api endpoint" -> EXCLUDE (API plumbing, not tweetable alone)
- "feat: default archived tournaments sort to newest" -> EXCLUDE (trivial setting change)
- Any bugfix, dep bump, or build chore -> EXCLUDE

## Instructions

1. Evaluate each PR against the criterion above.
2. Cluster related PRs into themes and name each theme in plain English (not copy-pasted PR titles).
3. Return strict JSON and nothing else:

{"in_flight": [{"name": "..."}], "shipped": [{"name": "..."}]}

Either array may be empty. Do NOT include PR numbers, links, or author names in the theme names.

## PR data

### In-flight PRs (open, non-draft, updated recently)

%s

### Shipped PRs (merged in the last 7 days)

%s
"""


def classify_prs(in_flight_data, shipped_data):
    """Call Claude Sonnet to classify PRs. Returns parsed JSON."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    in_flight_text = json.dumps(in_flight_data, indent=2) if in_flight_data else "None"
    shipped_text = json.dumps(shipped_data, indent=2) if shipped_data else "None"
    prompt = CLASSIFICATION_PROMPT % (in_flight_text, shipped_text)

    body = json.dumps(
        {
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}],
        }
    ).encode()

    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=body,
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
    )
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())

    text = result["content"][0]["text"]
    # Extract JSON from response (handle potential markdown fencing)
    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


# ---------------------------------------------------------------------------
# Slack posting
# ---------------------------------------------------------------------------


def build_slack_blocks(classification):
    """Build Slack Block Kit payload from classification JSON."""
    in_flight = classification.get("in_flight", [])
    shipped = classification.get("shipped", [])

    if not in_flight and not shipped:
        return None

    blocks = []

    if in_flight:
        items = "\n".join(f"\u2022 {item['name']}" for item in in_flight)
        blocks.append(
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Features being worked on*\n{items}",
                },
            }
        )

    if in_flight and shipped:
        blocks.append({"type": "divider"})

    if shipped:
        items = "\n".join(f"\u2022 {item['name']}" for item in shipped)
        blocks.append(
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Shipped last week*\n{items}",
                },
            }
        )

    return {"blocks": blocks}


def post_to_slack(payload):
    """Post payload to Slack via webhook."""
    webhook_url = os.environ.get("SLACK_WEBHOOK_URL", "")
    if not webhook_url:
        print("ERROR: SLACK_WEBHOOK_URL not set", file=sys.stderr)
        sys.exit(1)

    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        webhook_url,
        data=data,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        if resp.status != 200:
            print(f"Slack returned status {resp.status}", file=sys.stderr)
            sys.exit(1)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(description="Weekly comms digest for Slack")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the Slack payload instead of posting",
    )
    args = parser.parse_args()

    print("Collecting PRs...")
    in_flight, shipped = collect_prs()
    print(f"Found {len(in_flight)} in-flight and {len(shipped)} shipped PRs")

    if not in_flight and not shipped:
        print("No PRs to classify. Exiting.")
        return

    print("Classifying PRs with Claude Sonnet...")
    classification = classify_prs(in_flight, shipped)
    print(f"Classification: {json.dumps(classification, indent=2)}")

    payload = build_slack_blocks(classification)
    if payload is None:
        print("Nothing comms-worthy this week. No Slack post.")
        return

    if args.dry_run:
        print("\n--- DRY RUN: Slack payload ---")
        print(json.dumps(payload, indent=2))
    else:
        print("Posting to Slack...")
        post_to_slack(payload)
        print("Posted successfully.")


if __name__ == "__main__":
    main()
