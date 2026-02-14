import pytest  # noqa

from projects.models import Project
from scoring.constants import LeaderboardScoreTypes
from scoring.models import Leaderboard, LeaderboardEntry, MedalExclusionRecord
from scoring.utils import assign_prize_percentages, assign_ranks
from tests.unit.test_projects.factories import factory_project
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
        assign_prize_percentages(entries, minimum_prize_percent)
        for entry, expected_percent in zip(entries, expected):
            assert pytest.approx(entry.percent_prize, 1e-7) == expected_percent

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "scores, user_props, exclusion_details, bot_status, expected",
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
                    {"user_index": 1, "show_anyway": True},
                    {"user_index": 1, "show_anyway": False, "scope": "project"},
                ],
                Project.BotLeaderboardStatus.EXCLUDE_AND_SHOW,
                [
                    {
                        "user_index": 0,
                        "excluded": False,
                        "show_when_excluded": False,
                        "rank": 1,
                    },
                    {
                        "user_index": 1,
                        "excluded": True,
                        "show_when_excluded": False,
                        "rank": 2,
                    },
                    {
                        "user_index": 2,
                        "excluded": True,
                        "show_when_excluded": True,
                        "rank": 2,
                    },
                    {
                        "user_index": 3,
                        "excluded": True,
                        "show_when_excluded": False,
                        "rank": 2,
                    },
                    {
                        "user_index": 4,
                        "excluded": False,
                        "show_when_excluded": False,
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
                    {"user_index": 0, "show_anyway": True, "scope": "leaderboard"},
                ],
                Project.BotLeaderboardStatus.BOTS_ONLY,
                [
                    {
                        "user_index": 0,
                        "excluded": True,
                        "show_when_excluded": False,
                        "rank": 1,
                    },
                    {
                        "user_index": 1,
                        "excluded": False,
                        "show_when_excluded": False,
                        "rank": 1,
                    },
                    {
                        "user_index": 2,
                        "excluded": True,
                        "show_when_excluded": False,
                        "rank": 2,
                    },
                    {
                        "user_index": 3,
                        "excluded": True,
                        "show_when_excluded": False,
                        "rank": 2,
                    },
                ],
            ),
        ],
    )
    def test_assign_ranks_exclusions(
        self, scores, user_props, exclusion_details, bot_status, expected
    ):
        project = factory_project(type=Project.ProjectTypes.TOURNAMENT)
        leaderboard = Leaderboard.objects.create(
            project=project,
            score_type=LeaderboardScoreTypes.PEER_TOURNAMENT,
        )
        users = [factory_user(**props) for props in user_props]

        for detail in exclusion_details:
            scope = detail.get("scope")
            MedalExclusionRecord.objects.create(
                user=users[detail["user_index"]],
                exclusion_type=MedalExclusionRecord.ExclusionTypes.OTHER,
                show_anyway=detail.get("show_anyway", False),
                project=leaderboard.project if scope == "project" else None,
                leaderboard=leaderboard if scope == "leaderboard" else None,
            )

        entries = [
            LeaderboardEntry(user=users[index], score=score)
            for index, score in enumerate(scores)
        ]
        assign_ranks(entries, leaderboard, bot_status)

        entries_by_user_id = {entry.user_id: entry for entry in entries}
        for expectation in expected:
            user = users[expectation["user_index"]]
            entry = entries_by_user_id[user.id]
            assert entry.excluded is expectation["excluded"]
            assert entry.show_when_excluded is expectation["show_when_excluded"]
            assert entry.rank == expectation["rank"]
