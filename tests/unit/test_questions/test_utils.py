from datetime import datetime
import pytest
from freezegun import freeze_time

from questions.models import AggregateForecast, Forecast, Question
from questions.types import OptionsHistoryType
from questions.utils import (
    get_last_forecast_in_the_past,
    multiple_choice_interpret_forecasts,
    multiple_choice_add_options,
    multiple_choice_delete_options,
    multiple_choice_rename_option,
)
from tests.unit.utils import datetime_aware as dt
from users.models import User


@freeze_time("2025-01-15")
def test_get_last_forecast_in_the_past(question_binary):
    aggregations = [
        # Start time in the future (expiration forecast)
        AggregateForecast(start_time=dt(2025, 1, 16)),
        # Both start and end dates are in the past
        AggregateForecast(start_time=dt(2025, 1, 13), end_time=dt(2025, 1, 14)),
        # Truly last forecast
        AggregateForecast(start_time=dt(2025, 1, 12), end_time=dt(2025, 1, 16)),
        # Just another forecast, should not be taken into account
        AggregateForecast(start_time=dt(2025, 1, 11)),
    ]

    # Case #1: wrong initial order
    with pytest.raises(ValueError):
        get_last_forecast_in_the_past(aggregations)

    # Correct order
    aggregations.sort(key=lambda a: a.start_time)
    last_agg = get_last_forecast_in_the_past(aggregations)

    assert last_agg.start_time == dt(2025, 1, 12)
    assert last_agg.end_time == dt(2025, 1, 16)


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
                    probability_yes_per_category=[0.2, 0.0, 0.8],
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
                    probability_yes_per_category=[0.2, 0.0, 0.0, 0.8],
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
                    probability_yes_per_category=[0.2, 0.0, 0.8],
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
    question.options_history = [(0.0, initial_options)]
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
    assert ts == (timestep.timestamp() if options_to_delete else 0.0)
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
                    probability_yes_per_category=[0.2, 0.3, 0.0, 0.5],
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
                    probability_yes_per_category=[0.2, 0.3, 0.0, 0.0, 0.5],
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
                    probability_yes_per_category=[0.2, 0.3, 0.0, 0.5],
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
                    probability_yes_per_category=[0.6, 0.15, 0.0, 0.25],
                ),
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                    probability_yes_per_category=[0.2, 0.3, 0.0, 0.5],
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
    question.options_history = [(0.0, initial_options)]
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
    assert ts == (grace_period_end.timestamp() if options_to_add else 0)
    assert options == expected_options

    forecasts = question.user_forecasts.order_by("start_time")
    assert len(forecasts) == len(expected_forecasts)
    for f, e in zip(forecasts, expected_forecasts):
        assert f.start_time == e.start_time
        assert f.end_time == e.end_time
        assert f.probability_yes_per_category == e.probability_yes_per_category
        assert f.source == e.source


@pytest.mark.parametrize(
    "forecasts,options_history,expected",
    [
        # Trivial
        ([], None, []),
        (
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.4],
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                )
            ],
            None,
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.4],
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                )
            ],
        ),
        (
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.4],
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                )
            ],
            [(0, ["a", "other"])],
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.4],
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                )
            ],
        ),
        # Simple
        (
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.4],
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                )
            ],
            [(0, ["a", "other"]), (dt(2025, 1, 1).timestamp(), ["a", "b", "other"])],
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.4, 0.4],
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                ),
            ],
        ),  # standard path, stops before change
        (
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.15, 0.25],
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                )
            ],
            [(0, ["a", "other"]), (dt(2025, 1, 1).timestamp(), ["a", "b", "other"])],
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.4, 0.4],
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                ),
                Forecast(
                    probability_yes_per_category=[0.6, 0.15, 0.25],
                    start_time=dt(2025, 1, 1),
                    end_time=None,
                ),
            ],
        ),  # standard path, carries through change, must get split
        # Failure
        (
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.4],
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                )
            ],
            [(0, ["a", "b", "other"]), (dt(2025, 1, 1).timestamp(), ["a", "other"])],
            ValueError,
        ),  # forecast values too small
        (
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.15, 0.2, 0.05],
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                )
            ],
            [(0, ["a", "other"]), (dt(2025, 1, 1).timestamp(), ["a", "b", "other"])],
            ValueError,
        ),  # forecast values too large
        # more complicated history
        (
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.4],
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                )
            ],
            [
                (0, ["a", "other"]),
                (dt(2025, 1, 1).timestamp(), ["a", "b", "other"]),
                (dt(2027, 1, 1).timestamp(), ["a", "b", "c", "other"]),
            ],
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.4, 0.4, 0.4],
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                ),
            ],
        ),  # in first interval, like current options
        (
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.15, 0.25],
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2026, 1, 1),
                )
            ],
            [
                (0, ["a", "other"]),
                (dt(2025, 1, 1).timestamp(), ["a", "b", "other"]),
                (dt(2027, 1, 1).timestamp(), ["a", "b", "c", "other"]),
            ],
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.4, 0.4, 0.4],
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                ),
                Forecast(
                    probability_yes_per_category=[0.6, 0.15, 0.25, 0.25],
                    start_time=dt(2025, 1, 1),
                    end_time=dt(2026, 1, 1),
                ),
            ],
        ),  # in first interval, like next options
        (
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.15, 0.25],
                    start_time=dt(2026, 1, 1),
                    end_time=dt(2027, 1, 1),
                )
            ],
            [
                (0, ["a", "other"]),
                (dt(2025, 1, 1).timestamp(), ["a", "b", "other"]),
                (dt(2027, 1, 1).timestamp(), ["a", "b", "c", "other"]),
            ],
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.15, 0.25, 0.25],
                    start_time=dt(2026, 1, 1),
                    end_time=dt(2027, 1, 1),
                ),
            ],
        ),  # in second interval, like current options
        (
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.15, 0.20, 0.05],
                    start_time=dt(2026, 1, 1),
                    end_time=dt(2028, 1, 1),
                )
            ],
            [
                (0, ["a", "other"]),
                (dt(2025, 1, 1).timestamp(), ["a", "b", "other"]),
                (dt(2027, 1, 1).timestamp(), ["a", "b", "c", "other"]),
            ],
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.15, 0.25, 0.25],
                    start_time=dt(2026, 1, 1),
                    end_time=dt(2027, 1, 1),
                ),
                Forecast(
                    probability_yes_per_category=[0.6, 0.15, 0.20, 0.05],
                    start_time=dt(2027, 1, 1),
                    end_time=dt(2028, 1, 1),
                ),
            ],
        ),  # in second interval, like next options
        # put it ALL together
        (
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.15, 0.25],
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                ),
                Forecast(
                    probability_yes_per_category=[0.6, 0.4],
                    start_time=dt(2025, 1, 1),
                    end_time=dt(2026, 1, 1),
                ),
                Forecast(
                    probability_yes_per_category=[0.6, 0.1, 0.3],
                    start_time=dt(2026, 1, 1),
                    end_time=None,
                ),
            ],
            [
                (0, ["a", "b", "other"]),
                (dt(2025, 1, 1).timestamp(), ["a", "other"]),
                (dt(2027, 1, 1).timestamp(), ["a", "c", "other"]),
            ],
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.15, 0.25, 0.25],
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                ),
                Forecast(
                    probability_yes_per_category=[0.6, 0.4, 0.4, 0.4],
                    start_time=dt(2025, 1, 1),
                    end_time=dt(2026, 1, 1),
                ),
                Forecast(
                    probability_yes_per_category=[0.6, 0.4, 0.4, 0.4],
                    start_time=dt(2026, 1, 1),
                    end_time=dt(2027, 1, 1),
                ),
                Forecast(
                    probability_yes_per_category=[0.6, 0.3, 0.1, 0.3],
                    start_time=dt(2027, 1, 1),
                    end_time=None,
                ),
            ],
        ),  # option removal and addition
        (
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.15, 0.25],
                    start_time=dt(2023, 1, 1),
                    end_time=dt(2025, 1, 1),
                    author_id=1,
                ),
                Forecast(
                    probability_yes_per_category=[0.1, 0.4, 0.5],
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                    author_id=2,
                ),
                Forecast(
                    probability_yes_per_category=[0.1, 0.9],
                    start_time=dt(2025, 1, 1),
                    end_time=dt(2027, 1, 1),
                    author_id=2,
                ),
                Forecast(
                    probability_yes_per_category=[0.6, 0.1, 0.3],
                    start_time=dt(2026, 1, 1),
                    end_time=None,
                    author_id=1,
                ),
            ],
            [
                (0, ["a", "b", "other"]),
                (dt(2025, 1, 1).timestamp(), ["a", "other"]),
                (dt(2027, 1, 1).timestamp(), ["a", "c", "other"]),
            ],
            [
                Forecast(
                    probability_yes_per_category=[0.6, 0.15, 0.25, 0.25],
                    start_time=dt(2023, 1, 1),
                    end_time=dt(2025, 1, 1),
                    author_id=1,
                ),
                Forecast(
                    probability_yes_per_category=[0.1, 0.4, 0.5, 0.5],
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                    author_id=2,
                ),
                Forecast(
                    probability_yes_per_category=[0.1, 0.9, 0.9, 0.9],
                    start_time=dt(2025, 1, 1),
                    end_time=dt(2027, 1, 1),
                    author_id=2,
                ),
                Forecast(
                    probability_yes_per_category=[0.6, 0.4, 0.4, 0.4],
                    start_time=dt(2026, 1, 1),
                    end_time=dt(2027, 1, 1),
                    author_id=1,
                ),
                Forecast(
                    probability_yes_per_category=[0.6, 0.3, 0.1, 0.3],
                    start_time=dt(2027, 1, 1),
                    end_time=None,
                    author_id=1,
                ),
            ],
        ),  # multiple forecasters
    ],
)
def test_multiple_choice_interpret_forecasts(
    forecasts: list[Forecast | AggregateForecast],
    options_history: OptionsHistoryType,
    expected: list[Forecast | AggregateForecast] | ValueError,
):
    if expected is ValueError:
        with pytest.raises(ValueError):
            multiple_choice_interpret_forecasts(forecasts, options_history)
        return

    result = multiple_choice_interpret_forecasts(forecasts, options_history)
    assert len(result) == len(expected)
    for r, e in zip(result, expected):
        r.question_type = Question.QuestionType.MULTIPLE_CHOICE
        e.question_type = Question.QuestionType.MULTIPLE_CHOICE
        rpmf = r.get_pmf()
        epmf = e.get_pmf()
        assert len(rpmf) == len(epmf)
        assert isinstance(r, type(e))
        assert r.start_time == e.start_time
        assert r.end_time == e.end_time
        if isinstance(r, Forecast):
            assert r.author_id == e.author_id
        else:
            assert r.method == e.method
