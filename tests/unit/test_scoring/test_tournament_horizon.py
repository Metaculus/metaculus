"""
Questions that opened before a tournament started are scored on that tournament's
leaderboard as if they opened at the tournament start.
"""

from datetime import timedelta

import pytest
from django.utils import timezone

from projects.models import Project
from questions.models import Forecast, Question
from questions.types import AggregationMethod
from scoring.constants import LeaderboardScoreTypes, ScoreTypes
from scoring.models import Leaderboard, Score
from scoring.score_math import evaluate_question
from scoring.utils import (
    HORIZON_CLIPPING_CUTOFF,
    get_clipped_question_scores,
    get_contributions,
    get_leaderboard_horizon_start,
    score_question,
    update_project_leaderboard,
)
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import create_question
from tests.unit.test_users.factories import factory_user
from tests.unit.utils import datetime_aware

OPEN = datetime_aware(2025, 1, 1)
TOURNAMENT_START = datetime_aware(2025, 7, 1)
CLOSE = datetime_aware(2026, 1, 1)
RESOLVED = datetime_aware(2026, 1, 2)
# after HORIZON_CLIPPING_CUTOFF, so these leaderboards are clipped
FINALIZE = datetime_aware(2100, 1, 1)


def _question(open_time=OPEN, project=None) -> Question:
    question = create_question(
        question_type=Question.QuestionType.BINARY,
        open_time=open_time,
        scheduled_close_time=CLOSE,
        actual_close_time=CLOSE,
        resolution="yes",
        resolution_set_time=RESOLVED,
    )
    post_kwargs = {"default_project": project} if project else {}
    question.post = factory_post(question=question, **post_kwargs)
    question.save(update_fields=["post"])
    return question


def _forecast(question, user, p, start, end=None):
    Forecast.objects.create(
        question=question,
        author=user,
        probability_yes=p,
        start_time=start,
        end_time=end,
    )


def _add_forecasts(question, users):
    u1, u2, u3 = users
    _forecast(question, u1, 0.8, TOURNAMENT_START)  # at tournament start
    _forecast(question, u2, 0.6, OPEN)  # pre-tournament, still standing
    _forecast(question, u3, 0.3, OPEN, OPEN + timedelta(days=30))  # pre-tournament only
    _forecast(question, u3, 0.7, TOURNAMENT_START + timedelta(days=46))


def _by_key(scores):
    return {(s.user_id, s.aggregation_method): s for s in scores}


@pytest.mark.parametrize(
    "score_type",
    [ScoreTypes.BASELINE, ScoreTypes.PEER, ScoreTypes.RELATIVE_LEGACY],
)
def test_horizon_start_matches_question_opening_then(score_type):
    """
    Scoring a question with forecast_horizon_start=S gives the same result as
    scoring an identical question that opened at S.
    """
    users = [factory_user() for _ in range(3)]
    early = _question(open_time=OPEN)
    late = _question(open_time=TOURNAMENT_START)
    _add_forecasts(early, users)
    _add_forecasts(late, users)
    methods = [AggregationMethod.RECENCY_WEIGHTED, AggregationMethod.UNWEIGHTED]

    clipped = evaluate_question(
        early,
        "yes",
        [score_type],
        aggregation_methods=methods,
        forecast_horizon_start=TOURNAMENT_START,
    )
    reference = evaluate_question(
        late, "yes", [score_type], aggregation_methods=methods
    )
    unclipped = evaluate_question(
        early, "yes", [score_type], aggregation_methods=methods
    )

    clipped, reference = _by_key(clipped), _by_key(reference)
    assert clipped.keys() == reference.keys()
    for key, ref in reference.items():
        assert clipped[key].score == pytest.approx(ref.score)
        assert clipped[key].coverage == pytest.approx(ref.coverage)
    # sanity: clipping actually changed something
    u1 = users[0].id
    assert _by_key(unclipped)[(u1, None)].coverage < 0.6
    assert clipped[(u1, None)].coverage == pytest.approx(1.0)


@pytest.mark.parametrize("horizon_start", [OPEN - timedelta(days=1), CLOSE, None])
def test_horizon_start_outside_lifetime_is_ignored(horizon_start):
    users = [factory_user() for _ in range(3)]
    question = _question()
    _add_forecasts(question, users)
    base = _by_key(evaluate_question(question, "yes", [ScoreTypes.PEER]))
    other = _by_key(
        evaluate_question(
            question, "yes", [ScoreTypes.PEER], forecast_horizon_start=horizon_start
        )
    )
    assert base.keys() == other.keys()
    for key in base:
        assert other[key].score == base[key].score
        assert other[key].coverage == base[key].coverage


@pytest.fixture()
def tournament():
    project = factory_project(
        type=Project.ProjectTypes.TOURNAMENT, start_date=TOURNAMENT_START
    )
    leaderboard = Leaderboard.objects.create(
        project=project,
        score_type=LeaderboardScoreTypes.PEER_TOURNAMENT,
        finalize_time=FINALIZE,
    )
    return project, leaderboard


def test_leaderboard_scores_pre_tournament_question_from_start(tournament):
    project, leaderboard = tournament
    users = [factory_user() for _ in range(3)]
    question = _question(project=project)
    _add_forecasts(question, users)
    score_question(question, "yes")

    peer_scores = Score.objects.filter(question=question, score_type=ScoreTypes.PEER)
    stored = _by_key(peer_scores)
    entries = {
        (e.user_id, e.aggregation_method): e
        for e in update_project_leaderboard(project, leaderboard)
    }
    expected = _by_key(
        evaluate_question(
            question,
            "yes",
            [ScoreTypes.PEER],
            aggregation_methods=[
                AggregationMethod.RECENCY_WEIGHTED,
                AggregationMethod.UNWEIGHTED,
            ],
            forecast_horizon_start=TOURNAMENT_START,
        )
    )

    u1, u2, u3 = (u.id for u in users)
    # joined with the tournament: full tournament coverage
    assert stored[(u1, None)].coverage < 0.6
    assert entries[(u1, None)].coverage == pytest.approx(1.0)
    # standing pre-tournament forecast counts from the tournament start
    assert entries[(u2, None)].coverage == pytest.approx(1.0)
    for key, exp in expected.items():
        assert entries[key].score == pytest.approx(exp.score)
        assert entries[key].coverage == pytest.approx(exp.coverage)
    # aggregates are clipped too
    cp = entries[(None, AggregationMethod.RECENCY_WEIGHTED)]
    assert cp.coverage == pytest.approx(1.0)
    # the question's own stored scores are untouched
    after = _by_key(peer_scores.all())
    assert after.keys() == stored.keys()
    for key, score in stored.items():
        assert (after[key].score, after[key].coverage) == (score.score, score.coverage)


def test_leaderboard_uses_stored_scores_for_questions_opened_after_start(tournament):
    project, leaderboard = tournament
    users = [factory_user() for _ in range(3)]
    question = _question(open_time=TOURNAMENT_START, project=project)
    _add_forecasts(question, users)
    score_question(question, "yes")
    stored = {
        s.user_id: s
        for s in Score.objects.filter(question=question, score_type=ScoreTypes.PEER)
        if s.user_id
    }
    entries = update_project_leaderboard(project, leaderboard)
    for entry in entries:
        if entry.user_id:
            assert entry.score == pytest.approx(stored[entry.user_id].score)
            assert entry.coverage == pytest.approx(stored[entry.user_id].coverage)


def test_contributions_match_leaderboard_entry(tournament):
    project, leaderboard = tournament
    users = [factory_user() for _ in range(3)]
    questions = [
        _question(project=project),
        _question(open_time=TOURNAMENT_START, project=project),
    ]
    for question in questions:
        _add_forecasts(question, users)
        score_question(question, "yes")
    entries = {e.user_id: e for e in update_project_leaderboard(project, leaderboard)}

    for user in users:
        contributions = get_contributions(user, leaderboard)
        scored = [c for c in contributions if c.score is not None]
        assert sum(c.score for c in scored) == pytest.approx(entries[user.id].score)
        assert sum(c.coverage for c in scored) == pytest.approx(
            entries[user.id].coverage
        )


def test_live_coverage_counts_from_tournament_start(tournament):
    project, leaderboard = tournament
    user = factory_user()
    question = create_question(
        question_type=Question.QuestionType.BINARY,
        open_time=OPEN,
        scheduled_close_time=datetime_aware(2100, 1, 1),
    )
    question.post = factory_post(question=question, default_project=project)
    question.save(update_fields=["post"])
    _forecast(question, user, 0.5, TOURNAMENT_START)

    (contribution,) = get_contributions(user, leaderboard, with_live_coverage=True)
    # the forecast has stood for the whole time since the tournament started;
    # live coverage only counts elapsed time, so compare against that share
    now = timezone.now()
    expected = (now - TOURNAMENT_START) / (
        datetime_aware(2100, 1, 1) - TOURNAMENT_START
    )
    assert contribution.coverage == pytest.approx(expected, rel=1e-3)


def test_clipped_scores_cache_invalidated_on_rescore():
    users = [factory_user() for _ in range(3)]
    question = _question()
    _add_forecasts(question, users)
    score_question(question, "yes")
    before = get_clipped_question_scores(question, ScoreTypes.PEER, TOURNAMENT_START)

    newcomer = factory_user()
    _forecast(question, newcomer, 0.9, TOURNAMENT_START + timedelta(days=10))
    score_question(question, "yes")
    after = get_clipped_question_scores(question, ScoreTypes.PEER, TOURNAMENT_START)

    assert newcomer.id not in {s.user_id for s in before}
    assert newcomer.id in {s.user_id for s in after}


@pytest.mark.parametrize(
    "project_type,score_type,expected",
    [
        (Project.ProjectTypes.TOURNAMENT, LeaderboardScoreTypes.PEER_TOURNAMENT, True),
        (Project.ProjectTypes.TOURNAMENT, LeaderboardScoreTypes.DEFAULT, True),
        (
            Project.ProjectTypes.TOURNAMENT,
            LeaderboardScoreTypes.RELATIVE_LEGACY_TOURNAMENT,
            True,
        ),
        (
            Project.ProjectTypes.TOURNAMENT,
            LeaderboardScoreTypes.SPOT_PEER_TOURNAMENT,
            False,
        ),
        (
            Project.ProjectTypes.TOURNAMENT,
            LeaderboardScoreTypes.SPOT_BASELINE_TOURNAMENT,
            False,
        ),
        (
            Project.ProjectTypes.QUESTION_SERIES,
            LeaderboardScoreTypes.PEER_TOURNAMENT,
            True,
        ),
        (Project.ProjectTypes.COMMUNITY, LeaderboardScoreTypes.PEER_TOURNAMENT, False),
        (Project.ProjectTypes.SITE_MAIN, LeaderboardScoreTypes.PEER_GLOBAL, False),
    ],
)
def test_get_leaderboard_horizon_start(project_type, score_type, expected):
    project = factory_project(
        type=project_type, start_date=TOURNAMENT_START, close_date=None
    )
    leaderboard = Leaderboard(project=project, score_type=score_type)
    assert (get_leaderboard_horizon_start(leaderboard) == TOURNAMENT_START) is expected


@pytest.mark.parametrize(
    "finalize_time,close_date,expected",
    [
        (None, None, True),
        (HORIZON_CLIPPING_CUTOFF + timedelta(days=1), None, True),
        (HORIZON_CLIPPING_CUTOFF - timedelta(days=1), None, False),
        (None, HORIZON_CLIPPING_CUTOFF + timedelta(days=1), True),
        (None, HORIZON_CLIPPING_CUTOFF - timedelta(days=1), False),
        # finalize_time takes precedence over the project's close_date
        (
            HORIZON_CLIPPING_CUTOFF + timedelta(days=1),
            HORIZON_CLIPPING_CUTOFF - timedelta(days=1),
            True,
        ),
    ],
)
def test_leaderboards_concluded_before_cutoff_are_not_clipped(
    finalize_time, close_date, expected
):
    project = factory_project(
        type=Project.ProjectTypes.TOURNAMENT,
        start_date=TOURNAMENT_START,
        close_date=close_date,
    )
    leaderboard = Leaderboard(
        project=project,
        score_type=LeaderboardScoreTypes.PEER_TOURNAMENT,
        finalize_time=finalize_time,
    )
    assert (get_leaderboard_horizon_start(leaderboard) == TOURNAMENT_START) is expected


def test_past_tournament_keeps_full_lifetime_scores_on_force_update():
    project = factory_project(
        type=Project.ProjectTypes.TOURNAMENT,
        start_date=TOURNAMENT_START,
        close_date=None,
    )
    leaderboard = Leaderboard.objects.create(
        project=project,
        score_type=LeaderboardScoreTypes.PEER_TOURNAMENT,
        finalize_time=HORIZON_CLIPPING_CUTOFF - timedelta(days=1),
        finalized=True,
    )
    users = [factory_user() for _ in range(3)]
    question = _question(project=project)
    _add_forecasts(question, users)
    score_question(question, "yes")
    stored = {
        s.user_id: s
        for s in Score.objects.filter(question=question, score_type=ScoreTypes.PEER)
        if s.user_id
    }

    entries = update_project_leaderboard(project, leaderboard, force_update=True)
    for entry in entries:
        if entry.user_id:
            assert entry.coverage == pytest.approx(stored[entry.user_id].coverage)
    for user in users:
        (contribution,) = [
            c for c in get_contributions(user, leaderboard) if c.score is not None
        ]
        assert contribution.coverage == pytest.approx(stored[user.id].coverage)


def test_leaderboard_start_time_overrides_project_start_date():
    project = factory_project(
        type=Project.ProjectTypes.TOURNAMENT,
        start_date=TOURNAMENT_START,
        close_date=None,
    )
    later = TOURNAMENT_START + timedelta(days=5)
    leaderboard = Leaderboard(
        project=project,
        score_type=LeaderboardScoreTypes.PEER_TOURNAMENT,
        start_time=later,
    )
    assert get_leaderboard_horizon_start(leaderboard) == later


@pytest.mark.parametrize("finalized,expected", [(False, True), (True, False)])
def test_finalized_leaderboard_without_dates_is_not_clipped(finalized, expected):
    project = factory_project(
        type=Project.ProjectTypes.TOURNAMENT,
        start_date=TOURNAMENT_START,
        close_date=None,
    )
    leaderboard = Leaderboard(
        project=project,
        score_type=LeaderboardScoreTypes.PEER_TOURNAMENT,
        finalized=finalized,
    )
    assert (get_leaderboard_horizon_start(leaderboard) == TOURNAMENT_START) is expected


def test_question_closed_early_before_start_keeps_full_lifetime_scores(tournament):
    """
    A question that actually closed before the tournament started (although its
    scheduled close is later) must not be clipped to an empty window, which
    would score everyone 0 while still counting toward max coverage.
    """
    project, leaderboard = tournament
    users = [factory_user() for _ in range(3)]
    early_close = TOURNAMENT_START - timedelta(days=10)
    question = _question(project=project)
    question.actual_close_time = early_close
    question.save(update_fields=["actual_close_time"])
    u1, u2, u3 = users
    _forecast(question, u1, 0.8, OPEN + timedelta(days=5))
    _forecast(question, u2, 0.6, OPEN)
    _forecast(question, u3, 0.3, OPEN + timedelta(days=20))

    base = _by_key(evaluate_question(question, "yes", [ScoreTypes.PEER]))
    with_start = _by_key(
        evaluate_question(
            question, "yes", [ScoreTypes.PEER], forecast_horizon_start=TOURNAMENT_START
        )
    )
    assert base.keys() == with_start.keys()
    for key in base:
        assert with_start[key].coverage == base[key].coverage

    score_question(question, "yes")
    stored = {
        s.user_id: s
        for s in Score.objects.filter(question=question, score_type=ScoreTypes.PEER)
        if s.user_id
    }
    entries = [e for e in update_project_leaderboard(project, leaderboard) if e.user_id]
    assert len(entries) == 3
    for entry in entries:
        assert entry.coverage == pytest.approx(stored[entry.user_id].coverage)
        assert entry.coverage > 0
