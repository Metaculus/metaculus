"""
Manual integration tests for the external API gateway (port 8787).

Run with:
    python manage.py test_api_gateway

The gateway must be running locally and pointed at this backend instance.
Tests run in series; each test gets its own setup/teardown cycle.
A failure summary is printed at the end.

Test registry format:
    (test_fn, [setup_fn, ...], [teardown_fn, ...])

Each setup_fn receives the current state dict and returns a dict to merge in,
allowing later setup steps to reference what earlier ones created.
Teardown functions run in the order listed; deleting parent objects first
(or last, depending on cascade direction) is the caller's responsibility.
"""

import sys
import termios
import tty
from datetime import timedelta

import requests
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from authentication.models import ApiKey
from posts.models import Post
from projects.models import Project
from questions.models import AggregateForecast, Forecast, Question
from questions.types import AggregationMethod
from scoring.constants import LeaderboardScoreTypes
from scoring.models import Leaderboard
from users.constants import ApiAccessTier
from users.models import User

GATEWAY_BASE_URL = "http://localhost:8787"


# ---------------------------------------------------------------------------
# Test helpers
# ---------------------------------------------------------------------------


def assert_equal(label, actual, expected):
    if actual != expected:
        raise AssertionError(f"{label}: expected {expected!r}, got {actual!r}")


def auth_headers(api_key: str) -> dict:
    return {"Authorization": f"Token {api_key}"}


# ---------------------------------------------------------------------------
# Setup / teardown building blocks
# ---------------------------------------------------------------------------


def setup_restricted_user(state: dict) -> dict:
    user = User.objects.create_user(
        username="test_gateway_restricted",
        email="test_gateway_restricted@test.local",
        is_active=True,
    )
    api_key, _ = ApiKey.objects.get_or_create(user=user)
    return {"user": user, "api_key": api_key.key}


def setup_staff_user(state: dict) -> dict:
    user = User.objects.create_user(
        username="test_gateway_staff",
        email="test_gateway_staff@test.local",
        is_active=True,
        is_staff=True,
    )
    api_key, _ = ApiKey.objects.get_or_create(user=user)
    return {"user": user, "api_key": api_key.key}


def setup_benchmarking_tier_user(state: dict) -> dict:
    user = User.objects.create_user(
        username="test_gateway_benchmarking",
        email="test_gateway_benchmarking@test.local",
        is_active=True,
        api_access_tier=ApiAccessTier.BENCHMARKING,
    )
    api_key, _ = ApiKey.objects.get_or_create(user=user)
    return {"user": user, "api_key": api_key.key}


def setup_unrestricted_tier_user(state: dict) -> dict:
    """Non-staff user with api_access_tier=UNRESTRICTED.
    Takes the unrestricted code path in the gateway without is_staff=True."""
    user = User.objects.create_user(
        username="test_gateway_unrestricted",
        email="test_gateway_unrestricted@test.local",
        is_active=True,
        api_access_tier=ApiAccessTier.UNRESTRICTED,
    )
    api_key, _ = ApiKey.objects.get_or_create(user=user)
    return {"user": user, "api_key": api_key.key}


def teardown_user(state: dict):
    state["user"].delete()


_STAFF_LEADERBOARD_NAME = "test_gateway_global_leaderboard"


def setup_global_leaderboard(state: dict) -> dict:
    site_main = Project.objects.filter(type=Project.ProjectTypes.SITE_MAIN).first()
    leaderboard = Leaderboard.objects.create(
        name=_STAFF_LEADERBOARD_NAME,
        project=site_main,
        score_type=LeaderboardScoreTypes.PEER_GLOBAL,
    )
    return {"leaderboard": leaderboard}


def teardown_leaderboard(state: dict):
    state["leaderboard"].delete()


BOT_TESTING_PROJECT_ID = 32977
BENCHMARKING_PROJECT_ID = 32979


def setup_bot_testing_project(state: dict) -> dict:
    """Ensure the bot testing project (ID 32977) exists.
    Only deletes it on teardown if we created it here."""
    project, created = Project.objects.get_or_create(
        id=BOT_TESTING_PROJECT_ID,
        defaults={"type": Project.ProjectTypes.QUESTION_SERIES},
    )
    return {"bot_testing_project": project, "bot_testing_project_created": created}


def teardown_bot_testing_project(state: dict):
    if state.get("bot_testing_project_created"):
        state["bot_testing_project"].delete()


def setup_benchmarking_project(state: dict) -> dict:
    project, created = Project.objects.get_or_create(
        id=BENCHMARKING_PROJECT_ID,
        defaults={"type": Project.ProjectTypes.QUESTION_SERIES},
    )
    return {"benchmarking_project": project, "benchmarking_project_created": created}


def teardown_benchmarking_project(state: dict):
    if state.get("benchmarking_project_created"):
        state["benchmarking_project"].delete()


_AGGREGATIONS_POST_TITLE = "test_gateway_aggregations_post"


def setup_aggregations_post(state: dict) -> dict:
    """Create a binary post with a recency_weighted AggregateForecast.
    Requires state["user"] to be set by a prior setup step.
    Returns {"question": ...} — deleting the question cascades to post + forecasts."""
    author = state["user"]
    now = timezone.now()
    site_main = Project.objects.filter(type=Project.ProjectTypes.SITE_MAIN).first()

    question = Question.objects.create(
        type=Question.QuestionType.BINARY,
        title=_AGGREGATIONS_POST_TITLE,
        open_time=now - timedelta(days=1),
        scheduled_close_time=now + timedelta(days=30),
        scheduled_resolve_time=now + timedelta(days=31),
    )
    post = Post.objects.create(
        title=_AGGREGATIONS_POST_TITLE,
        author=author,
        question=question,
        curation_status=Post.CurationStatus.APPROVED,
        published_at=now - timedelta(days=1),
        default_project=site_main,
        open_time=now - timedelta(days=1),
        scheduled_close_time=now + timedelta(days=30),
        scheduled_resolve_time=now + timedelta(days=31),
        hotness=1e10,  # so hot it's always first
    )
    Forecast.objects.create(
        question=question,
        post=post,
        author=author,
        start_time=now - timedelta(hours=1),
        probability_yes=0.7,
    )
    AggregateForecast.objects.create(
        question=question,
        method=AggregationMethod.RECENCY_WEIGHTED,
        start_time=now - timedelta(hours=1),
        end_time=None,
        forecast_values=[0.3, 0.7],
        forecaster_count=1,
    )
    return {"question": question}


def setup_aggregations_post_in_bot_testing_project(state: dict) -> dict:
    """Like setup_aggregations_post, but uses state["bot_testing_project"] as the
    default_project so the gateway treats it as a visible project for restricted users."""
    author = state["user"]
    project = state["bot_testing_project"]
    now = timezone.now()

    question = Question.objects.create(
        type=Question.QuestionType.BINARY,
        title=_AGGREGATIONS_POST_TITLE,
        open_time=now - timedelta(days=1),
        scheduled_close_time=now + timedelta(days=30),
        scheduled_resolve_time=now + timedelta(days=31),
    )
    post = Post.objects.create(
        title=_AGGREGATIONS_POST_TITLE,
        author=author,
        question=question,
        curation_status=Post.CurationStatus.APPROVED,
        published_at=now - timedelta(days=1),
        default_project=project,
        open_time=now - timedelta(days=1),
        scheduled_close_time=now + timedelta(days=30),
        scheduled_resolve_time=now + timedelta(days=31),
        hotness=1e10,
    )
    Forecast.objects.create(
        question=question,
        post=post,
        author=author,
        start_time=now - timedelta(hours=1),
        probability_yes=0.7,
    )
    AggregateForecast.objects.create(
        question=question,
        method=AggregationMethod.RECENCY_WEIGHTED,
        start_time=now - timedelta(hours=1),
        end_time=None,
        forecast_values=[0.3, 0.7],
        forecaster_count=1,
    )
    return {"question": question}


def setup_aggregations_post_in_benchmarking_project(state: dict) -> dict:
    """Like setup_aggregations_post, but uses state["benchmarking_project"] so the
    gateway's hasBenchmarkingProject check fires for benchmarking-tier users."""
    author = state["user"]
    project = state["benchmarking_project"]
    now = timezone.now()

    question = Question.objects.create(
        type=Question.QuestionType.BINARY,
        title=_AGGREGATIONS_POST_TITLE,
        open_time=now - timedelta(days=1),
        scheduled_close_time=now + timedelta(days=30),
        scheduled_resolve_time=now + timedelta(days=31),
    )
    post = Post.objects.create(
        title=_AGGREGATIONS_POST_TITLE,
        author=author,
        question=question,
        curation_status=Post.CurationStatus.APPROVED,
        published_at=now - timedelta(days=1),
        default_project=project,
        open_time=now - timedelta(days=1),
        scheduled_close_time=now + timedelta(days=30),
        scheduled_resolve_time=now + timedelta(days=31),
        hotness=1e10,
    )
    Forecast.objects.create(
        question=question,
        post=post,
        author=author,
        start_time=now - timedelta(hours=1),
        probability_yes=0.7,
    )
    AggregateForecast.objects.create(
        question=question,
        method=AggregationMethod.RECENCY_WEIGHTED,
        start_time=now - timedelta(hours=1),
        end_time=None,
        forecast_values=[0.3, 0.7],
        forecaster_count=1,
    )
    return {"question": question}


def setup_project_data_access(state: dict) -> dict:
    """Create a fresh project and grant state["user"] non-restricted access to it
    via UserDataAccess, so hasUserVisibleProject fires in the gateway."""
    from misc.models import UserDataAccess

    project = Project.objects.create(type=Project.ProjectTypes.QUESTION_SERIES)
    UserDataAccess.objects.create(
        user=state["user"],
        project=project,
        api_access_tier=ApiAccessTier.BENCHMARKING,
    )
    return {"data_access_project": project}


def teardown_data_access_project(state: dict):
    # UserDataAccess cascades on project deletion.
    state["data_access_project"].delete()


def setup_aggregations_post_in_data_access_project(state: dict) -> dict:
    """Creates the aggregations post in state["data_access_project"]."""
    author = state["user"]
    project = state["data_access_project"]
    now = timezone.now()

    question = Question.objects.create(
        type=Question.QuestionType.BINARY,
        title=_AGGREGATIONS_POST_TITLE,
        open_time=now - timedelta(days=1),
        scheduled_close_time=now + timedelta(days=30),
        scheduled_resolve_time=now + timedelta(days=31),
    )
    post = Post.objects.create(
        title=_AGGREGATIONS_POST_TITLE,
        author=author,
        question=question,
        curation_status=Post.CurationStatus.APPROVED,
        published_at=now - timedelta(days=1),
        default_project=project,
        open_time=now - timedelta(days=1),
        scheduled_close_time=now + timedelta(days=30),
        scheduled_resolve_time=now + timedelta(days=31),
        hotness=1e10,
    )
    Forecast.objects.create(
        question=question,
        post=post,
        author=author,
        start_time=now - timedelta(hours=1),
        probability_yes=0.7,
    )
    AggregateForecast.objects.create(
        question=question,
        method=AggregationMethod.RECENCY_WEIGHTED,
        start_time=now - timedelta(hours=1),
        end_time=None,
        forecast_values=[0.3, 0.7],
        forecaster_count=1,
    )
    return {"question": question}


def teardown_aggregations_post(state: dict):
    # Cascades to the post, individual forecasts, and aggregate forecasts.
    state["question"].delete()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_unauthenticated_get_posts(state: dict):
    """Unauthenticated GET /api/posts/ should be rejected by the gateway (403)."""
    response = requests.get(f"{GATEWAY_BASE_URL}/api/posts/")
    assert_equal("status_code", response.status_code, 403)


def test_authenticated_get_posts(state: dict):
    """Authenticated GET /api/posts/ should succeed (200) for a restricted user."""
    response = requests.get(
        f"{GATEWAY_BASE_URL}/api/posts/",
        headers=auth_headers(state["api_key"]),
    )
    assert_equal("status_code", response.status_code, 200)


def test_restricted_user_blocked_endpoint(state: dict):
    """Restricted users should receive a gateway 403 on block:true endpoints."""
    response = requests.get(
        f"{GATEWAY_BASE_URL}/api/leaderboards/global/",
        headers=auth_headers(state["api_key"]),
    )
    assert_equal("status_code", response.status_code, 403)
    assert response.text.startswith("Permission Error:"), (
        f"Expected gateway permission error, got: {response.text!r}"
    )


def test_staff_can_access_blocked_endpoint(state: dict):
    """Staff users bypass all gateway restrictions, including fully blocked endpoints.

    /api/leaderboards/global/ has block:true for all non-staff tiers.
    Staff routes through UnrestrictedRules (no rules), so the request is forwarded
    to the backend and should return 200.
    """
    response = requests.get(
        f"{GATEWAY_BASE_URL}/api/leaderboards/global/",
        headers=auth_headers(state["api_key"]),
        params={"name": _STAFF_LEADERBOARD_NAME},
    )
    assert_equal("status_code", response.status_code, 200)


def _get_first_post_aggregations_latest(api_key: str) -> object:
    response = requests.get(
        f"{GATEWAY_BASE_URL}/api/posts/",
        headers=auth_headers(api_key),
        params={"with_cp": "true"},
    )
    assert_equal("status_code", response.status_code, 200)
    results = response.json().get("results", [])
    assert len(results) > 0, "Expected at least one result"
    assert_equal("results[0].title", results[0]["title"], _AGGREGATIONS_POST_TITLE)
    return results[0]["question"]["aggregations"]["recency_weighted"]["latest"]


def test_restricted_aggregations_hidden(state: dict):
    """For a restricted user, aggregations.recency_weighted.latest should be null
    on posts not in the special visible project (ID 32977)."""
    latest = _get_first_post_aggregations_latest(state["api_key"])
    assert latest is None, (
        f"Expected aggregations.recency_weighted.latest to be null for restricted user,"
        f" got: {latest!r}"
    )


def test_unrestricted_aggregations_visible(state: dict):
    """For a non-staff user with api_access_tier=UNRESTRICTED,
    aggregations.recency_weighted.latest should be populated."""
    latest = _get_first_post_aggregations_latest(state["api_key"])
    assert latest is not None, (
        "Expected aggregations.recency_weighted.latest to be populated for"
        " unrestricted tier user, got null"
    )


def test_staff_aggregations_visible(state: dict):
    """For a staff user (is_staff=True), aggregations.recency_weighted.latest should
    be populated — staff bypasses all gateway filtering unconditionally."""
    latest = _get_first_post_aggregations_latest(state["api_key"])
    assert latest is not None, (
        "Expected aggregations.recency_weighted.latest to be populated for"
        " staff user, got null"
    )


def test_project_data_access_user_sees_cp(state: dict):
    """A restricted user with a UserDataAccess entry (api_access_tier=BENCHMARKING)
    for a specific project should see the CP for posts in that project.
    This exercises hasUserVisibleProject in the gateway."""
    latest = _get_first_post_aggregations_latest(state["api_key"])
    assert latest is not None, (
        "Expected CP to be populated for restricted user with project-level"
        " UserDataAccess, got null"
    )


def test_restricted_cp_hidden_in_benchmarking_project(state: dict):
    """Restricted users should NOT see the CP for posts in the benchmarking project
    (ID 32979) — hasBenchmarkingProject only unlocks for benchmarking-tier users."""
    latest = _get_first_post_aggregations_latest(state["api_key"])
    assert latest is None, (
        "Expected CP (aggregations.recency_weighted.latest) to be null for restricted"
        f" user on benchmarking project post, got: {latest!r}"
    )


def test_benchmarking_cp_visible_in_benchmarking_project(state: dict):
    """Benchmarking-tier users should see the CP for posts in the benchmarking project
    (ID 32979) — BenchmarkingRules includes hasBenchmarkingProject in isVisible."""
    latest = _get_first_post_aggregations_latest(state["api_key"])
    assert latest is not None, (
        "Expected CP (aggregations.recency_weighted.latest) to be populated for"
        " benchmarking-tier user on benchmarking project post, got null"
    )


def test_restricted_aggregations_visible_in_bot_testing_project(state: dict):
    """For a restricted user, aggregations.recency_weighted.latest should be populated
    when the post belongs to the bot testing project (ID 32977), because
    hasVisibleProject returns true for that project ID."""
    latest = _get_first_post_aggregations_latest(state["api_key"])
    assert latest is not None, (
        "Expected aggregations.recency_weighted.latest to be populated for restricted"
        " user when post is in bot testing project (ID 32977), got null"
    )


# ---------------------------------------------------------------------------
# Test registry
# Each entry: (test_fn, [setup_fn, ...], [teardown_fn, ...])
# - each setup_fn(state) -> dict to merge; later steps can read earlier state
# - teardown_fns run in the order listed
# ---------------------------------------------------------------------------

TESTS = [
    (test_unauthenticated_get_posts, [], []),
    (test_authenticated_get_posts, [setup_restricted_user], [teardown_user]),
    (test_restricted_user_blocked_endpoint, [setup_restricted_user], [teardown_user]),
    (
        test_staff_can_access_blocked_endpoint,
        [setup_staff_user, setup_global_leaderboard],
        [teardown_leaderboard, teardown_user],
    ),
    (
        test_restricted_aggregations_hidden,
        [setup_restricted_user, setup_aggregations_post],
        [teardown_aggregations_post, teardown_user],
    ),
    (
        test_unrestricted_aggregations_visible,
        [setup_unrestricted_tier_user, setup_aggregations_post],
        [teardown_aggregations_post, teardown_user],
    ),
    (
        test_staff_aggregations_visible,
        [setup_staff_user, setup_aggregations_post],
        [teardown_aggregations_post, teardown_user],
    ),
    (
        test_restricted_aggregations_visible_in_bot_testing_project,
        [
            setup_restricted_user,
            setup_bot_testing_project,
            setup_aggregations_post_in_bot_testing_project,
        ],
        [teardown_aggregations_post, teardown_bot_testing_project, teardown_user],
    ),
    (
        test_project_data_access_user_sees_cp,
        [
            setup_restricted_user,
            setup_project_data_access,
            setup_aggregations_post_in_data_access_project,
        ],
        [teardown_aggregations_post, teardown_data_access_project, teardown_user],
    ),
    (
        test_restricted_cp_hidden_in_benchmarking_project,
        [
            setup_restricted_user,
            setup_benchmarking_project,
            setup_aggregations_post_in_benchmarking_project,
        ],
        [teardown_aggregations_post, teardown_benchmarking_project, teardown_user],
    ),
    (
        test_benchmarking_cp_visible_in_benchmarking_project,
        [
            setup_benchmarking_tier_user,
            setup_benchmarking_project,
            setup_aggregations_post_in_benchmarking_project,
        ],
        [teardown_aggregations_post, teardown_benchmarking_project, teardown_user],
    ),
]


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------


def run_tests():
    failures = []

    for test_fn, setup_fns, teardown_fns in TESTS:
        name = test_fn.__name__
        state: dict = {}
        try:
            for setup_fn in setup_fns:
                state.update(setup_fn(state))
            test_fn(state)
            print(f"  PASS  {name}")
        except Exception as exc:
            print(f"  FAIL  {name}")
            failures.append((name, exc))
        finally:
            for teardown_fn in teardown_fns:
                try:
                    teardown_fn(state)
                except Exception as teardown_exc:
                    print(f"  WARN  {name} teardown failed: {teardown_exc}")

    return failures


# ---------------------------------------------------------------------------
# Management command
# ---------------------------------------------------------------------------


def _read_single_keypress() -> str:
    fd = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        return sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)


def _confirm_local_run(stdout, style) -> bool:
    """Checks DEBUG=True and asks the user to confirm local setup before proceeding.
    Returns True if confirmed, False if aborted."""
    if not settings.DEBUG:
        stdout.write(
            style.ERROR(
                "ERROR: settings.DEBUG is not True.\n"
                "This command must only be run against a local development server.\n"
                "Aborting."
            )
        )
        return False

    stdout.write(
        style.WARNING(
            "\n"
            "  *** GATEWAY INTEGRATION TEST CONFIRMATION ***\n"
            "\n"
            "  Before continuing, please confirm ALL of the following:\n"
            "\n"
            f"    1. You are running against a LOCAL development server (not production).\n"
            f"    2. The API gateway is running locally on port 8787.\n"
            f"    3. The gateway is pointed at YOUR LOCAL backend server.\n"
            "\n"
            "  This command will create and delete objects in your local database.\n"
            "\n"
            "  Press ENTER to continue, or ESC to abort: "
        )
    )
    stdout.flush()

    key = _read_single_keypress()
    stdout.write("\n")

    if key in ("\r", "\n"):
        return True

    stdout.write(style.WARNING("Aborted.\n"))
    return False


class Command(BaseCommand):
    help = "Run manual integration tests against the local API gateway on port 8787."

    def handle(self, *args, **kwargs):
        if not _confirm_local_run(self.stdout, self.style):
            raise SystemExit(0)

        self.stdout.write(f"Running {len(TESTS)} test(s) against {GATEWAY_BASE_URL}\n")

        failures = run_tests()

        self.stdout.write("")
        if failures:
            self.stdout.write(self.style.ERROR(f"{len(failures)} test(s) FAILED:\n"))
            for name, exc in failures:
                self.stdout.write(self.style.ERROR(f"  {name}: {exc}"))
            raise SystemExit(1)
        else:
            self.stdout.write(self.style.SUCCESS("All tests passed."))
