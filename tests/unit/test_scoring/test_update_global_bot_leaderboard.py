from datetime import datetime, timedelta, timezone as dt_timezone

import pytest

from projects.models import Project
from questions.models import Question
from questions.services.common import create_question
from scoring.management.commands.update_global_bot_leaderboard import (
    assert_bot_tournaments_mapped,
    combine_year_split_players,
    find_pro_twin,
    participation_parent_key,
)
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project

SPOT_TIME = datetime(2026, 6, 1, 12, tzinfo=dt_timezone.utc)


def make_question(
    question_id: int, spot_scoring_time: datetime, resolution: str = "yes"
) -> Question:
    return Question(
        id=question_id,
        title="Will it happen?",
        spot_scoring_time=spot_scoring_time,
        resolution=resolution,
    )


@pytest.mark.parametrize(
    "uid, expected",
    [
        ("Community Aggregate (2025)", "Community Aggregate"),
        ("Pro Aggregate (2024)", "Pro Aggregate"),
        ("12345 (2025)", 12345),
        ("Community Aggregate", "Community Aggregate"),
        (236038, 236038),
    ],
)
def test_participation_parent_key(uid: int | str, expected: int | str) -> None:
    assert participation_parent_key(uid) == expected


def test_combine_year_split_players_keeps_bot_user_id() -> None:
    skills = {"12345 (2024)": 1.0, "12345 (2025)": 4.0, 236038: 2.0}
    ci_lower = {"12345 (2024)": 0.0, "12345 (2025)": 3.0, 236038: 1.0}
    ci_upper = {"12345 (2024)": 2.0, "12345 (2025)": 5.0, 236038: 3.0}
    player_stats = {
        "12345 (2024)": [3, {1, 2, 3}, 1.0],
        "12345 (2025)": [1, {4}, 1.0],
        236038: [4, {1, 2, 3, 4}, 2.0],
    }

    combined_skills, combined_lower, combined_upper, combined_stats = (
        combine_year_split_players(skills, ci_lower, ci_upper, player_stats)
    )

    assert set(combined_skills) == {12345, 236038}
    assert combined_skills[12345] == pytest.approx((1.0 * 3 + 4.0 * 1) / 4)
    assert combined_lower[12345] < combined_skills[12345] < combined_upper[12345]
    assert combined_stats[12345][1] == {1, 2, 3, 4}


def test_find_pro_twin_picks_closest_same_title_question() -> None:
    aib_question = make_question(1, SPOT_TIME)
    true_twin = make_question(2, SPOT_TIME)
    later_repeat = make_question(3, SPOT_TIME + timedelta(days=35))

    assert find_pro_twin(aib_question, [later_repeat, true_twin]) is true_twin


def test_find_pro_twin_rejects_question_outside_spot_gap() -> None:
    aib_question = make_question(1, SPOT_TIME)
    other_instance = make_question(2, SPOT_TIME + timedelta(days=2))

    assert find_pro_twin(aib_question, [other_instance]) is None


def test_find_pro_twin_rejects_different_resolution() -> None:
    aib_question = make_question(1, SPOT_TIME, resolution="yes")
    pro_question = make_question(2, SPOT_TIME, resolution="no")

    assert find_pro_twin(aib_question, [pro_question]) is None


def test_find_pro_twin_without_candidates() -> None:
    assert find_pro_twin(make_question(1, SPOT_TIME), []) is None


def test_assert_bot_tournaments_mapped_raises_for_unmapped_season() -> None:
    project = factory_project(
        type=Project.ProjectTypes.TOURNAMENT, slug="winter-futureeval-2027"
    )
    question = create_question(
        title="Will it happen?",
        type=Question.QuestionType.BINARY,
        open_time=SPOT_TIME - timedelta(days=2),
        scheduled_close_time=SPOT_TIME - timedelta(days=1),
        actual_close_time=SPOT_TIME - timedelta(days=1),
        resolution="yes",
        resolution_set_time=SPOT_TIME,
    )
    factory_post(question=question, default_project=project)

    with pytest.raises(ValueError, match="winter-futureeval-2027"):
        assert_bot_tournaments_mapped()
