"""Tests for `.github/scripts/slugify_branch.sh`.

The script turns a git branch ref into a name that is safe for
preview-environment resources (Fly apps, Fly Redis databases, Neon branches,
Docker tags).

The reserved-token list (`RESERVED_TOKENS="github claude codex"`) was introduced
in commit 5b9935bd6 ("ci: sanitize preview resource names and refresh Claude
workflow", PR #5125) on 2026-08-08 — see that commit for the rationale: hosting
providers refuse resource names containing "github", and `claude`/`codex` are
noise that every agent branch carries, so they waste the length budget without
distinguishing one preview from another.
"""

import subprocess
from pathlib import Path

import pytest

SCRIPT = Path(__file__).parents[3] / ".github" / "scripts" / "slugify_branch.sh"

# Dash-heavy on both ends and in the middle, so truncation at any length has a
# fair chance of leaving a stray dash behind if the script stopped trimming.
DASH_HEAVY_REF = "--claude/github--feature//long-branch--name--here--"


def slugify(branch_ref: str, max_length: int | None = None) -> str:
    args = ["bash", str(SCRIPT), branch_ref]
    if max_length is not None:
        args.append(str(max_length))

    result = subprocess.run(args, capture_output=True, text=True, check=True)
    return result.stdout.rstrip("\n")


@pytest.mark.parametrize(
    "branch_ref, expected",
    [
        ("claude/github-issue-3223-kip300", "issue-3223-kip300"),
        ("codex/review-pr-5113", "review-pr-5113"),
        ("claude/codex/github/feature", "feature"),
        # Only whole dash-delimited tokens are dropped; a token that merely
        # contains a reserved word survives untouched.
        ("flagship-1", "flagship-1"),
        ("githubbed-thing", "githubbed-thing"),
        ("my-github2-repo", "my-github2-repo"),
    ],
)
def test_reserved_tokens_are_dropped_as_whole_tokens(branch_ref, expected):
    assert slugify(branch_ref) == expected


@pytest.mark.parametrize("branch_ref", ["a---b", "a___b", "a...b", "a  b", "a-_.-b"])
def test_separator_runs_collapse_to_a_single_dash(branch_ref):
    assert slugify(branch_ref) == "a-b"


def test_lowercases_the_slug():
    assert slugify("FEATURE/UPPER-Case") == "feature-upper-case"


@pytest.mark.parametrize("max_length", range(1, 41))
def test_no_leading_or_trailing_dashes_at_any_truncation_length(max_length):
    slug = slugify(DASH_HEAVY_REF, max_length)

    assert not slug.startswith("-")
    assert not slug.endswith("-")
    assert "--" not in slug


@pytest.mark.parametrize(
    "branch_ref",
    [
        DASH_HEAVY_REF,
        "claude/github-issue-3223-kip300",
        "feature/a-really-quite-long-descriptive-branch-name",
        "a---b",
    ],
)
@pytest.mark.parametrize("max_length", [6, 10, 30, 40])
def test_output_never_exceeds_the_requested_max_length(branch_ref, max_length):
    # The `cut` runs before the dash-trimming `sed`, so the output can come out
    # shorter than the cap, but it must never come out longer.
    assert len(slugify(branch_ref, max_length)) <= max_length


def test_default_max_length_is_thirty():
    assert len(slugify("feature/a-really-quite-long-descriptive-branch-name")) == 30


@pytest.mark.parametrize("branch_ref", ["", "///", "---", "claude/github", "codex"])
def test_empty_slug_falls_back_to_branch(branch_ref):
    # Without the fallback the composed resource name ends in a dash, which
    # Fly.io rejects outright.
    assert slugify(branch_ref) == "branch"


@pytest.mark.parametrize("max_length", [1, 5])
def test_fallback_is_not_truncated_to_the_max_length(max_length):
    # The fallback is applied after truncation, so it is the one output that can
    # exceed the cap. Pinned down here so a future change to either the cap or
    # the fallback is a deliberate one.
    assert slugify("///", max_length) == "branch"
