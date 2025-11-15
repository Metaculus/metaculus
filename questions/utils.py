import re
from datetime import timedelta, datetime

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from questions.models import Question, AggregateForecast, Forecast
from questions.services import build_question_forecasts


def get_question_group_title(title: str) -> str:
    """
    Extracts name from question of group.

    E.g. Long Question Title? (Option A) -> Option A
    """

    matches = re.findall(r"\((?:[^()]*|\([^()]*\))*\)", title)
    return matches[-1][1:-1] if matches else title


def calculate_question_lifespan_from_date(
    question: Question, from_date: datetime
) -> float | None:
    if not question.open_time or not question.scheduled_close_time:
        return

    duration = question.scheduled_close_time - question.open_time
    passed = timezone.now() - from_date

    return passed / duration


def get_question_movement_period(question: Question):
    if timezone.now() - question.open_time < timedelta(hours=24):
        return timedelta(hours=1)

    if timezone.now() - question.open_time < timedelta(days=7):
        return timedelta(hours=24)

    return timedelta(days=7)


def get_last_forecast_in_the_past(
    aggregated_forecasts: list[Forecast | AggregateForecast],
    at_time: datetime = None,
) -> AggregateForecast | None:
    """
    Returns last aggregated forecast in the past.
    Used to infiltrate aggregations from the future made by "Forecasts Expiration" module.

    Please note: aggregated_forecasts should be already sorted ASC `start_time`
    """

    at_time = at_time or timezone.now()

    # Briefly checks its ASC order
    # Don't perform double-sorting for optimization
    if (
        aggregated_forecasts
        and aggregated_forecasts[0].start_time > aggregated_forecasts[-1].start_time
    ):
        raise ValueError("aggregated_forecasts should be already sorted ASC")

    return next(
        (
            agg
            for agg in reversed(aggregated_forecasts)
            # Ensure we do not count aggregations in the future
            # Which could happen when user has explicit expire date of the forecast
            if agg.start_time <= at_time
            # Handle withdrawn forecasts
            and (agg.end_time is None or agg.end_time > at_time)
        ),
        None,
    )


def multiple_choice_rename_option(
    question: Question,
    old_option: str,
    new_option: str,
) -> Question:
    """
    Modifies question in place and returns it.
    Renames multiple choice option in question options and options history.
    """
    if question.type != Question.QuestionType.MULTIPLE_CHOICE:
        raise ValueError("Question must be multiple choice")
    if not question.options or old_option not in question.options:
        raise ValueError("Old option not found")
    if new_option in question.options:
        raise ValueError("New option already exists")
    if not question.options_history:
        raise ValueError("Options history is empty")

    question.options = [
        new_option if opt == old_option else opt for opt in question.options
    ]
    for i, (timestamp, options) in enumerate(question.options_history):
        question.options_history[i] = (
            timestamp,
            [new_option if opt == old_option else opt for opt in options],
        )

    return question


def multiple_choice_delete_options(
    question: Question,
    options_to_delete: list[str],
    timestep: datetime | None = None,
) -> Question:
    """
    Modifies question in place and returns it.
    Deletes multiple choice options in question options.
    Adds a new entry to options_history.
    Slices all user forecasts at timestep.
    Triggers recalculation of aggregates.
    """
    if not options_to_delete:
        return question
    timestep = timestep or timezone.now()
    if question.type != Question.QuestionType.MULTIPLE_CHOICE:
        raise ValueError("Question must be multiple choice")
    if not question.options or not all(
        [opt in question.options for opt in options_to_delete]
    ):
        raise ValueError("Option to delete not found")
    if not question.options_history:
        raise ValueError("Options history is empty")

    if question.options_history[-1][0] > timestep.timestamp():
        raise ValueError("Timestep is before the last options history entry")

    # update question
    previous_options = question.options.copy()
    new_options = [opt for opt in question.options if opt not in options_to_delete]
    question.options = new_options
    question.options_history.append((timestep.timestamp(), new_options))

    # update user forecasts
    user_forecasts = question.user_forecasts.filter(
        Q(end_time__isnull=True) | Q(end_time__gt=timestep)
    )
    forecasts_to_create: list[Forecast] = []
    for forecast in user_forecasts:
        # get new PMF
        previous_pmf = forecast.probability_yes_per_category
        if len(previous_pmf) != len(previous_options):
            raise ValueError(
                f"Forecast {forecast.id} PMF length does not match "
                f"previous options {previous_options}"
            )
        new_pmf = [0] * len(new_options)
        for value, label in zip(previous_pmf, previous_options):
            if label in new_options:
                new_pmf[new_options.index(label)] += value
            else:
                new_pmf[-1] += value  # add to catch-all last option

        # slice forecast
        if forecast.start_time >= timestep:
            # forecast is completely after timestep, just update PMF
            forecast.probability_yes_per_category = new_pmf
            continue
        forecasts_to_create.append(
            Forecast(
                question=question,
                author=forecast.author,
                start_time=timestep,
                end_time=forecast.end_time,
                probability_yes_per_category=new_pmf,
                post=forecast.post,
                source=Forecast.SourceChoices.AUTOMATIC,  # mark as automatic forecast
            )
        )
        forecast.end_time = timestep

    with transaction.atomic():
        Forecast.objects.bulk_update(
            user_forecasts, ["end_time", "probability_yes_per_category"]
        )
        Forecast.objects.bulk_create(forecasts_to_create)

    # trigger recalculation of aggregates
    build_question_forecasts(question)

    return question


def multiple_choice_add_options(
    question: Question,
    options_to_add: list[str],
    grace_period_end: datetime,
) -> Question:
    """
    Modifies question in place and returns it.
    Adds multiple choice options in question options.
    Adds a new entry to options_history.
    Terminates all user forecasts at grace_period_end.
    Triggers recalculation of aggregates.
    """
    if not options_to_add:
        return question
    if question.type != Question.QuestionType.MULTIPLE_CHOICE:
        raise ValueError("Question must be multiple choice")
    if not question.options or any([opt in question.options for opt in options_to_add]):
        raise ValueError("Option to add already found")
    if not question.options_history:
        raise ValueError("Options history is empty")

    if question.options_history[-1][0] > grace_period_end.timestamp():
        raise ValueError("grace_period_end is before the last options history entry")

    # update question
    new_options = question.options[:-1] + options_to_add + question.options[-1:]
    question.options = new_options
    question.options_history.append((grace_period_end.timestamp(), new_options))

    # update user forecasts
    user_forecasts = question.user_forecasts.filter(
        Q(end_time__isnull=True) | Q(end_time__gt=grace_period_end),
        start_time__lt=grace_period_end,
    )
    with transaction.atomic():
        user_forecasts.update(end_time=grace_period_end)

    # trigger recalculation of aggregates
    build_question_forecasts(question)

    return question
