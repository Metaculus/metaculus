from datetime import datetime

import pytest  # noqa

from questions.models import Question, Forecast
from questions.services.multiple_choice_handlers import (
    multiple_choice_add_options,
    multiple_choice_delete_options,
    multiple_choice_rename_option,
    multiple_choice_reorder_options,
)
from tests.unit.utils import datetime_aware as dt
from users.models import User


@pytest.mark.parametrize(
    "old_option,new_option,expect_success",
    [
        ("Option B", "Option D", True),
        ("Option X", "Option Y", False),  # old_option does not exist
        ("Option A", "Option A", False),  # new_option already exists
    ],
)
def test_multiple_choice_rename_option(
    question_multiple_choice, old_option, new_option, expect_success
):
    question = question_multiple_choice
    question.options = ["Option A", "Option B", "Option C"]
    question.save()

    if not expect_success:
        with pytest.raises(ValueError):
            multiple_choice_rename_option(question, old_option, new_option)
        return
    updated_question = multiple_choice_rename_option(question, old_option, new_option)

    assert old_option not in updated_question.options
    assert new_option in updated_question.options
    assert len(updated_question.options) == 3


@pytest.mark.parametrize(
    "new_options_order,expect_success",
    [
        (["Option A", "Option B", "Option C"], True),  # no change
        (["Option C", "Option B", "Option A"], True),  # happy path
        (["Option B", "Option A"], False),  # different number of options
        (
            ["Option A", "Option B", "Option C", "D"],
            False,
        ),  # different number of options
        (["Option D", "Option E", "Option F"], False),  # different options
    ],
)
def test_multiple_choice_reorder_options(
    question_multiple_choice, user1, new_options_order, expect_success
):
    question = question_multiple_choice
    original_options = ["Option A", "Option B", "Option C"]
    question.options = original_options
    question.options_history = [(datetime.min.isoformat(), original_options)]
    question.save()
    Forecast.objects.create(
        author=user1,
        question=question,
        start_time=dt(2024, 1, 1),
        end_time=None,
        probability_yes_per_category=[0.2, 0.3, 0.5],
    )

    if not expect_success:
        with pytest.raises(ValueError):
            multiple_choice_reorder_options(question, new_options_order)
        return
    updated_question = multiple_choice_reorder_options(question, new_options_order)

    assert updated_question.options == new_options_order
    forecast = updated_question.user_forecasts.first()
    assert forecast is not None
    assert forecast.probability_yes_per_category == [
        [0.2, 0.3, 0.5][original_options.index(opt)] for opt in new_options_order
    ]


@pytest.mark.parametrize(
    "initial_options,options_to_delete,forecasts,expected_forecasts,expect_success",
    [
        (["a", "b", "other"], ["b"], [], [], True),  # simplest path
        (["a", "b", "other"], ["c"], [], [], False),  # try to remove absent item
        (["a", "b", "other"], ["a", "b"], [], [], True),  # remove two items
        (
            ["a", "b", "other"],
            ["b"],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                )
            ],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                ),
                Forecast(
                    start_time=dt(2025, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, None, 0.8],
                    source=Forecast.SourceChoices.AUTOMATIC,
                ),
            ],
            True,
        ),  # happy path
        (
            ["a", "b", "c", "other"],
            ["b", "c"],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.1, 0.4],
                )
            ],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                    probability_yes_per_category=[0.2, 0.3, 0.1, 0.4],
                ),
                Forecast(
                    start_time=dt(2025, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, None, None, 0.8],
                    source=Forecast.SourceChoices.AUTOMATIC,
                ),
            ],
            True,
        ),  # happy path removing 2
        (
            ["a", "b", "other"],
            ["b"],
            [
                Forecast(
                    start_time=dt(2025, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.8],
                )
            ],
            [
                Forecast(
                    start_time=dt(2025, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.8],
                ),
            ],
            True,
        ),  # forecast is at / after timestep
        (
            ["a", "b", "other"],
            [],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                )
            ],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                )
            ],
            True,
        ),  # no effect
        (
            ["a", "b", "other"],
            ["b"],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.8],
                )
            ],
            [],
            False,
        ),  # initial forecast is invalid
        (
            ["a", "b", "other"],
            ["b"],
            [
                Forecast(
                    start_time=dt(2023, 1, 1),
                    end_time=dt(2024, 1, 1),
                    probability_yes_per_category=[0.6, 0.15, 0.25],
                ),
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                ),
            ],
            [
                Forecast(
                    start_time=dt(2023, 1, 1),
                    end_time=dt(2024, 1, 1),
                    probability_yes_per_category=[0.6, 0.15, 0.25],
                ),
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                ),
                Forecast(
                    start_time=dt(2025, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, None, 0.8],
                    source=Forecast.SourceChoices.AUTOMATIC,
                ),
            ],
            True,
        ),  # preserve previous forecasts
    ],
)
def test_multiple_choice_delete_options(
    question_multiple_choice: Question,
    user1: User,
    initial_options: list[str],
    options_to_delete: list[str],
    forecasts: list[Forecast],
    expected_forecasts: list[Forecast],
    expect_success: bool,
):
    question = question_multiple_choice
    question.options = initial_options
    question.options_history = [(datetime.min.isoformat(), initial_options)]
    question.save()

    timestep = dt(2025, 1, 1)
    for forecast in forecasts:
        forecast.author = user1
        forecast.question = question
        forecast.save()

    if not expect_success:
        with pytest.raises(ValueError):
            multiple_choice_delete_options(
                question, options_to_delete, timestep=timestep
            )
        return

    multiple_choice_delete_options(question, options_to_delete, timestep=timestep)

    question.refresh_from_db()
    expected_options = [opt for opt in initial_options if opt not in options_to_delete]
    assert question.options == expected_options
    ts, options = question.options_history[-1]
    assert ts == (
        timestep.isoformat() if options_to_delete else datetime.min.isoformat()
    )
    assert options == expected_options

    forecasts = question.user_forecasts.order_by("start_time")
    assert len(forecasts) == len(expected_forecasts)
    for f, e in zip(forecasts, expected_forecasts):
        assert f.start_time == e.start_time
        assert f.end_time == e.end_time
        assert f.probability_yes_per_category == e.probability_yes_per_category
        assert f.source == e.source


@pytest.mark.parametrize(
    "initial_options,options_to_add,grace_period_end,forecasts,expected_forecasts,"
    "expect_success",
    [
        (["a", "b", "other"], ["c"], dt(2025, 1, 1), [], [], True),  # simplest path
        (["a", "b", "other"], ["b"], dt(2025, 1, 1), [], [], False),  # copied add
        (["a", "b", "other"], ["c", "d"], dt(2025, 1, 1), [], [], True),  # double add
        # grace period before last options history
        (["a", "b", "other"], ["c"], dt(1900, 1, 1), [], [], False),
        (
            ["a", "b", "other"],
            ["c"],
            dt(2025, 1, 1),
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                )
            ],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                    probability_yes_per_category=[0.2, 0.3, None, 0.5],
                )
            ],
            True,
        ),  # happy path
        (
            ["a", "b", "other"],
            ["c", "d"],
            dt(2025, 1, 1),
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                )
            ],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                    probability_yes_per_category=[0.2, 0.3, None, None, 0.5],
                )
            ],
            True,
        ),  # happy path adding two options
        (
            ["a", "b", "other"],
            ["c"],
            dt(2025, 1, 1),
            [
                Forecast(
                    start_time=dt(2025, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                )
            ],
            [
                Forecast(
                    start_time=dt(2025, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, None, 0.5],
                )
            ],
            True,
        ),  # forecast starts at /after grace_period_end
        (
            ["a", "b", "other"],
            [],
            dt(2025, 1, 1),
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                )
            ],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                )
            ],
            True,
        ),  # no effect
        (
            ["a", "b", "other"],
            ["c"],
            dt(2025, 1, 1),
            [
                Forecast(
                    start_time=dt(2023, 1, 1),
                    end_time=dt(2024, 1, 1),
                    probability_yes_per_category=[0.6, 0.15, 0.25],
                ),
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                ),
            ],
            [
                Forecast(
                    start_time=dt(2023, 1, 1),
                    end_time=dt(2024, 1, 1),
                    probability_yes_per_category=[0.6, 0.15, None, 0.25],
                ),
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                    probability_yes_per_category=[0.2, 0.3, None, 0.5],
                ),
            ],
            True,
        ),  # edit all forecasts including old
    ],
)
def test_multiple_choice_add_options(
    question_multiple_choice: Question,
    user1: User,
    initial_options: list[str],
    options_to_add: list[str],
    grace_period_end: datetime,
    forecasts: list[Forecast],
    expected_forecasts: list[Forecast],
    expect_success: bool,
):
    question = question_multiple_choice
    question.options = initial_options
    question.options_history = [(datetime.min.isoformat(), initial_options)]
    question.save()

    for forecast in forecasts:
        forecast.author = user1
        forecast.question = question
        forecast.save()

    if not expect_success:
        with pytest.raises(ValueError):
            multiple_choice_add_options(
                question, options_to_add, grace_period_end, timestep=dt(2024, 7, 1)
            )
        return

    multiple_choice_add_options(
        question, options_to_add, grace_period_end, timestep=dt(2024, 7, 1)
    )

    question.refresh_from_db()
    expected_options = initial_options[:-1] + options_to_add + initial_options[-1:]
    assert question.options == expected_options
    ts, options = question.options_history[-1]
    assert ts == (
        grace_period_end.isoformat() if options_to_add else datetime.min.isoformat()
    )
    assert options == expected_options

    forecasts = question.user_forecasts.order_by("start_time")
    assert len(forecasts) == len(expected_forecasts)
    for f, e in zip(forecasts, expected_forecasts):
        assert f.start_time == e.start_time
        assert f.end_time == e.end_time
        assert f.probability_yes_per_category == e.probability_yes_per_category
        assert f.source == e.source
