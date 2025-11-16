import re
from datetime import timedelta, datetime, timezone as dt_timezone

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from questions.models import Question, AggregateForecast, Forecast
from questions.types import OptionsHistoryType


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


def get_all_options_from_history(
    options_history: OptionsHistoryType | None,
) -> list[str]:
    """Returns the list of all options ever available. The last value in the list
    is always the "catch-all" option.

    example:
    options_history = [
        (0, ["a", "b", "other"]),
        (100, ["a", "b", "c", "other"]),
        (200, ["a", "c", "other"]),
    ]
    return ["a", "b", "c", "other"]
    """
    if not options_history:
        raise ValueError("Cannot make master list from empty history")
    designated_other_label = options_history[0][1][-1]
    all_labels: list[str] = []
    for _, options in options_history:
        for label in options[:-1]:
            if label not in all_labels:
                all_labels.append(label)
    return all_labels + [designated_other_label]


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
        raise ValueError("timestep is before the last options history entry")

    # update question
    new_options = [opt for opt in question.options if opt not in options_to_delete]
    all_options = get_all_options_from_history(question.options_history)

    question.options = new_options
    question.options_history.append((timestep.timestamp(), new_options))
    question.save()

    # update user forecasts
    user_forecasts = question.user_forecasts.filter(
        Q(end_time__isnull=True) | Q(end_time__gt=timestep),
        start_time__lt=timestep,
    )
    forecasts_to_create: list[Forecast] = []
    for forecast in user_forecasts:
        # get new PMF
        previous_pmf = forecast.probability_yes_per_category
        if len(previous_pmf) != len(all_options):
            raise ValueError(
                f"Forecast {forecast.id} PMF length does not match "
                f"all options {all_options}"
            )
        new_pmf = [0] * len(all_options)
        for value, label in zip(previous_pmf, all_options):
            if label in new_options:
                new_pmf[all_options.index(label)] += value
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
    from questions.services import build_question_forecasts

    build_question_forecasts(question)

    return question


def multiple_choice_add_options(
    question: Question,
    options_to_add: list[str],
    grace_period_end: datetime,
    timestep: datetime | None = None,
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
    timestep = timestep or timezone.now()
    if question.type != Question.QuestionType.MULTIPLE_CHOICE:
        raise ValueError("Question must be multiple choice")
    if not question.options or any([opt in question.options for opt in options_to_add]):
        raise ValueError("Option to add already found")
    if not question.options_history:
        raise ValueError("Options history is empty")

    if timestep > grace_period_end:
        raise ValueError("grace_period_end must end after timestep")
    if question.options_history[-1][0] > timestep.timestamp():
        raise ValueError("timestep is before the last options history entry")

    # update question
    new_options = question.options[:-1] + options_to_add + question.options[-1:]
    question.options = new_options
    question.options_history.append((grace_period_end.timestamp(), new_options))
    question.save()

    # update user forecasts
    user_forecasts = question.user_forecasts.all()
    for forecast in user_forecasts:
        pmf = forecast.probability_yes_per_category
        forecast.probability_yes_per_category = (
            pmf[:-1] + [0.0] * len(options_to_add) + [pmf[-1]]
        )
        if forecast.start_time < grace_period_end and (
            forecast.end_time is None or forecast.end_time > grace_period_end
        ):
            forecast.end_time = grace_period_end
    with transaction.atomic():
        Forecast.objects.bulk_update(
            user_forecasts, ["probability_yes_per_category", "end_time"]
        )

    # trigger recalculation of aggregates
    from questions.services import build_question_forecasts

    build_question_forecasts(question)

    return question


def get_all_options_from_history(options_history: OptionsHistoryType) -> list[str]:
    """Returns the list of all options ever available. The last value in the list
    is always the "catch-all" option.

    example:
    options_history = [
        (0, ["a", "other"]),
        (100, ["a", "b", "other"]),
    ]
    return ["a", "b", "other"]
    """
    if not options_history:
        raise ValueError("Cannot make master list from empty history")
    designated_other_label = options_history[0][1][-1]
    all_labels: list[str] = []
    for _, options in options_history:
        for label in options[:-1]:
            if label not in all_labels:
                all_labels.append(label)
    return all_labels + [designated_other_label]


def multiple_choice_interpret_forecasts(
    forecasts: list[Forecast | AggregateForecast],
    options_history: OptionsHistoryType | None,
) -> list[Forecast | AggregateForecast]:
    """Interprets a multiple choice forecasts with respect to the history of options.
    Returns an altered list of forecasts with the PMFs reflecting the total list of
    values ever available for the question.

    `forecasts` param must be sorted by `start_time`

    Example:
        options_history = [
            (0, ["a", "other"]),
            (100, ["a", "b", "other"]),
        ]
        pmf = [0.6, 0.15, 0.25] at timestamp 50 (a pre-registered forecast)
    option "b" is added at timestamp 100
    interpreted_pmf at time 50 = [0.6, 0.4, 0.4]
    interpreted_pmf at time 100 = [0.6, 0.15, 0.25]

    This allows the resolution to be an index used universally across all forecasts
    interpreted this way. A resolution of "b" would correspond to index `1`, meaning
    that the forecast would be `0.4` at time 50 and `0.15` at time 100.
    Similarly, a resolution of "other" would correspond to a forecast of `0.4` at time
    50 and `0.25` at time 100.

    NOTE: intepreted "PMF"s are no longer valid forecasts, and the resulting forecasts
    should NOT be saved.
    """
    if not options_history or len(options_history) == 1 or not forecasts:
        # we have no change in options, no intepretation is required
        return forecasts

    list_of_all_options = get_all_options_from_history(options_history)

    def interpret_pmf(
        pmf: list[float],
        current_options: list[str],
        next_options: list[str],
    ) -> list[float]:
        if len(pmf) != len(current_options):
            if len(pmf) < len(current_options):
                raise ValueError(f"pmf {pmf} not interpretable as {current_options}")
            if len(pmf) != len(next_options):
                raise ValueError(f"pmf {pmf} not interpretable as {next_options}")
            # translate it into equivalent current options
            current_pmf = [0.0] * len(current_options)
            for value, option in zip(pmf, next_options):
                current_pmf[
                    current_options.index(option) if option in current_options else -1
                ] += value
            pmf = current_pmf
        interpreted_pmf = [
            pmf[current_options.index(option) if option in current_options else -1]
            for option in list_of_all_options
        ]
        return interpreted_pmf

    interpreted_forecasts: list[Forecast | AggregateForecast] = []
    options_index = -1
    next_step = datetime.min.replace(tzinfo=dt_timezone.utc)
    for forecast in forecasts:
        while (
            forecast.start_time >= next_step
        ):  # important for forecasts to be in order
            options_index += 1
            _, current_options = options_history[options_index]
            if options_index + 1 < len(options_history):
                next_ts, next_options = options_history[options_index + 1]
                next_step = datetime.fromtimestamp(next_ts).replace(
                    tzinfo=dt_timezone.utc
                )
            else:  # there is no next step
                next_step = datetime.max.replace(tzinfo=dt_timezone.utc)
                next_options = current_options

        # annotate question type for efficient get_pmf() call
        forecast.question_type = Question.QuestionType.MULTIPLE_CHOICE
        pmf = forecast.get_pmf()
        current_pmf = interpret_pmf(pmf, current_options, next_options)
        if isinstance(forecast, Forecast):
            forecast.probability_yes_per_category = current_pmf
        else:
            forecast.forecast_values = current_pmf
        interpreted_forecasts.append(forecast)
        if not forecast.end_time or forecast.end_time > next_step:
            next_pmf = interpret_pmf(pmf, next_options, next_options)
            # we need to split the forecast
            if isinstance(forecast, Forecast):
                extra_forecast = Forecast(
                    probability_yes_per_category=next_pmf,
                    start_time=next_step,
                    author_id=forecast.author_id,
                    question_id=forecast.question_id,
                    post_id=forecast.post_id,
                    source=Forecast.SourceChoices.AUTOMATIC,
                    end_time=forecast.end_time,
                )
            else:
                extra_forecast = AggregateForecast(
                    forecast_values=next_pmf,
                    start_time=next_step,
                    method=forecast.method,
                    forecaster_count=forecast.forecaster_count,
                    question_id=forecast.question_id,
                )
            forecast.end_time = next_step
            extra_forecast.question_type = Question.QuestionType.MULTIPLE_CHOICE
            interpreted_forecasts.append(extra_forecast)
    interpreted_forecasts.sort(key=lambda x: x.start_time)
    return interpreted_forecasts
