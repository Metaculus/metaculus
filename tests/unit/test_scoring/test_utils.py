from datetime import timedelta

import pytest  # noqa
from django.utils import timezone

from projects.models import Project
from questions.models import Question
from questions.services.common import create_question
from scoring.constants import ExclusionStatuses, LeaderboardScoreTypes, ScoreTypes
from scoring.models import Leaderboard, LeaderboardEntry, MedalExclusionRecord, Score
from scoring.utils import (
    assign_confidence_intervals_,
    assign_exclusions_,
    assign_prize_percentages_,
    assign_ranks_,
    generate_entries_from_scores,
    update_project_leaderboard,
)
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_scoring.factories import factory_score
from tests.unit.test_users.factories import factory_user


class TestScoringUtilsHelpers:
    @pytest.mark.parametrize(
        "entry_takes, minimum_prize_percent, expected",
        [
            ([], 0, []),
            ([6, 3, 1], 0, [0.6, 0.3, 0.1]),
            ([6, 3, 1], 0.25, [2 / 3, 1 / 3, 0]),
            ([6, 3, 1], 0.50, [1, 0, 0]),
            ([6, 3, 1, 0], 0, [0.6, 0.3, 0.1, 0]),
            ([6, 3, 1, 0, -1], 0, [0.6, 0.3, 0.1, 0, 0]),
            ([6, 3, 1, 0, -1], 0.25, [2 / 3, 1 / 3, 0, 0, 0]),
            ([0.90, 0.049, 0.041, 0.01], 0.05, [0.90 / 0.949, 0.049 / 0.949, 0, 0]),
        ],
    )
    def test_prize_percentages(self, entry_takes, minimum_prize_percent, expected):
        entries = [LeaderboardEntry(take=take) for take in entry_takes]
        assign_prize_percentages_(entries, minimum_prize_percent)
        for entry, expected_percent in zip(entries, expected):
            assert pytest.approx(entry.percent_prize, 1e-7) == expected_percent

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "scores, user_props, exclusion_details, human_status, bot_status, expected",
        [
            (
                [100, 90, 80, 70, 60],
                [
                    {"is_bot": False},
                    {"is_bot": False},
                    {"is_bot": True, "is_primary_bot": True},
                    {"is_bot": True, "is_primary_bot": False},
                    {"is_bot": False},
                ],
                [
                    {
                        "user_index": 1,
                        "exclusion_status": ExclusionStatuses.EXCLUDE_AND_SHOW,
                    },
                    {
                        "user_index": 1,
                        "exclusion_status": ExclusionStatuses.EXCLUDE,
                        "scope": "project",
                    },
                ],
                ExclusionStatuses.INCLUDE,
                ExclusionStatuses.EXCLUDE_AND_SHOW,
                [
                    {
                        "user_index": 0,
                        "exclusion_status": ExclusionStatuses.INCLUDE,
                        "rank": 1,
                    },
                    {
                        "user_index": 1,
                        "exclusion_status": ExclusionStatuses.EXCLUDE,
                        "rank": 2,
                    },
                    {
                        "user_index": 2,
                        "exclusion_status": ExclusionStatuses.EXCLUDE_AND_SHOW,
                        "rank": 2,
                    },
                    {
                        "user_index": 3,
                        "exclusion_status": ExclusionStatuses.EXCLUDE,
                        "rank": 2,
                    },
                    {
                        "user_index": 4,
                        "exclusion_status": ExclusionStatuses.INCLUDE,
                        "rank": 2,
                    },
                ],
            ),
            (
                [50, 40, 30, 20],
                [
                    {"is_bot": False},
                    {"is_bot": True, "is_primary_bot": True},
                    {"is_bot": True, "is_primary_bot": False},
                    {"is_bot": False},
                ],
                [
                    {
                        "user_index": 0,
                        "exclusion_status": ExclusionStatuses.EXCLUDE_AND_SHOW,
                        "scope": "leaderboard",
                    },
                ],
                ExclusionStatuses.EXCLUDE,
                ExclusionStatuses.INCLUDE,
                [
                    {
                        "user_index": 0,
                        "exclusion_status": ExclusionStatuses.EXCLUDE,
                        "rank": 1,
                    },
                    {
                        "user_index": 1,
                        "exclusion_status": ExclusionStatuses.INCLUDE,
                        "rank": 1,
                    },
                    {
                        "user_index": 2,
                        "exclusion_status": ExclusionStatuses.EXCLUDE,
                        "rank": 2,
                    },
                    {
                        "user_index": 3,
                        "exclusion_status": ExclusionStatuses.EXCLUDE,
                        "rank": 2,
                    },
                ],
            ),
        ],
    )
    def test_assign_ranks__exclusions(
        self, scores, user_props, exclusion_details, human_status, bot_status, expected
    ):
        project = factory_project(type=Project.ProjectTypes.TOURNAMENT)
        leaderboard = Leaderboard.objects.create(
            project=project,
            score_type=LeaderboardScoreTypes.PEER_TOURNAMENT,
            human_exclusion_status=human_status,
            bot_exclusion_status=bot_status,
        )
        users = [factory_user(**props) for props in user_props]

        for detail in exclusion_details:
            scope = detail.get("scope")
            MedalExclusionRecord.objects.create(
                user=users[detail["user_index"]],
                exclusion_type=MedalExclusionRecord.ExclusionTypes.OTHER,
                exclusion_status=detail.get(
                    "exclusion_status", ExclusionStatuses.EXCLUDE
                ),
                project=leaderboard.project if scope == "project" else None,
                leaderboard=leaderboard if scope == "leaderboard" else None,
            )

        entries = [
            LeaderboardEntry(user=users[index], score=score)
            for index, score in enumerate(scores)
        ]
        assign_exclusions_(entries, leaderboard)
        assign_ranks_(entries, leaderboard)

        entries_by_user_id = {entry.user_id: entry for entry in entries}
        for expectation in expected:
            user = users[expectation["user_index"]]
            entry = entries_by_user_id[user.id]
            assert entry.exclusion_status == expectation["exclusion_status"]
            assert entry.rank == expectation["rank"]


class TestAssignConfidenceIntervals:
    @staticmethod
    def _make_scores(
        question_scores: dict[int, list[tuple[int, float]]],
    ) -> list[Score]:
        scores = []
        for question_id, user_scores in question_scores.items():
            question = Question(id=question_id, question_weight=1.0)
            for user_id, score in user_scores:
                scores.append(
                    Score(user_id=user_id, question=question, score=score, coverage=1)
                )
        return scores

    def test_intervals_bracket_point_estimates_and_respect_exclusions(self):
        # user 1 dominates every question, user 2 is a bot excluded from ranking
        # with a large score, users 3 and 4 are close to each other
        question_scores = {
            q: [
                (1, 50.0 + (q % 3)),
                (2, 40.0),
                (3, 10.0 + (q % 5)),
                (4, 10.0 + ((q + 1) % 5)),
            ]
            for q in range(1, 21)
        }
        scores = self._make_scores(question_scores)
        leaderboard = Leaderboard(score_type=LeaderboardScoreTypes.PEER_TOURNAMENT)
        entries = generate_entries_from_scores(scores, [], leaderboard)
        for entry in entries:
            entry.exclusion_status = (
                ExclusionStatuses.EXCLUDE_AND_SHOW
                if entry.user_id == 2
                else ExclusionStatuses.INCLUDE
            )
        assign_ranks_(entries, leaderboard)

        assign_confidence_intervals_(entries, scores, leaderboard, seed=0)

        by_user = {entry.user_id: entry for entry in entries}
        for entry in entries:
            assert entry.ci_lower <= entry.score <= entry.ci_upper
            assert entry.rank_ci_lower <= entry.rank <= entry.rank_ci_upper
        # a constant per-question score has no sampling variance
        assert by_user[2].ci_lower == by_user[2].ci_upper == by_user[2].score
        assert by_user[3].ci_lower < by_user[3].score < by_user[3].ci_upper

        # a clear winner is never displaced, an excluded entry does not take a rank
        assert by_user[1].rank_ci_lower == by_user[1].rank_ci_upper == 1
        assert by_user[2].rank_ci_lower == by_user[2].rank_ci_upper == 2
        # near-ties produce overlapping rank intervals
        assert by_user[3].rank_ci_lower == 2
        assert by_user[3].rank_ci_upper == 3
        assert by_user[4].rank_ci_lower == 2
        assert by_user[4].rank_ci_upper == 3

    def test_unsupported_score_type_is_skipped(self):
        scores = self._make_scores({1: [(1, 10.0)]})
        leaderboard = Leaderboard(score_type=LeaderboardScoreTypes.MANUAL)
        entries = [LeaderboardEntry(user_id=1, score=10.0, rank=1)]

        assign_confidence_intervals_(entries, scores, leaderboard)

        assert entries[0].ci_lower is None
        assert entries[0].rank_ci_lower is None


@pytest.mark.django_db
def test_update_project_leaderboard_saves_confidence_intervals():
    project = factory_project(type=Project.ProjectTypes.TOURNAMENT)
    leaderboard = Leaderboard.objects.create(
        project=project,
        score_type=LeaderboardScoreTypes.PEER_TOURNAMENT,
        finalize_time=timezone.now() + timedelta(days=30),
    )
    users = [factory_user() for _ in range(3)]
    for question_index in range(10):
        question = create_question(
            title=f"Question {question_index}",
            type=Question.QuestionType.BINARY,
            open_time=timezone.now() - timedelta(days=10),
            scheduled_close_time=timezone.now() - timedelta(days=2),
            actual_close_time=timezone.now() - timedelta(days=2),
            resolution="yes",
            resolution_set_time=timezone.now() - timedelta(days=1),
        )
        factory_post(question=question, default_project=project)
        for user_index, user in enumerate(users):
            factory_score(
                question=question,
                user=user,
                score_type=ScoreTypes.PEER,
                score=10 * (user_index + 1) + question_index % 3,
                coverage=1,
            )

    entries = update_project_leaderboard(project, leaderboard)

    assert len(entries) == 3
    saved_entries = list(leaderboard.entries.order_by("rank"))
    for entry in saved_entries:
        assert entry.ci_lower is not None and entry.ci_upper is not None
        assert entry.ci_lower <= entry.score <= entry.ci_upper
        assert entry.rank_ci_lower <= entry.rank <= entry.rank_ci_upper
    assert saved_entries[0].rank_ci_lower == saved_entries[0].rank_ci_upper == 1
