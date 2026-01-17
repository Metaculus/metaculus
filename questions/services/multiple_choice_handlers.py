from datetime import datetime, timezone as dt_timezone

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from questions.models import Question, Forecast
from questions.types import OptionsHistoryType

# MOVE THIS serializer imports
from rest_framework import serializers
from collections import Counter
from rest_framework.exceptions import ValidationError
from users.models import User


class MultipleChoiceOptionsUpdateSerializer(serializers.Serializer):
    options = serializers.ListField(child=serializers.CharField(), required=True)
    grace_period_end = serializers.DateTimeField(required=False)

    def validate_new_options(
        self,
        new_options: list[str],
        options_history: OptionsHistoryType,
        grace_period_end: datetime | None = None,
    ):
        datetime_str, current_options = options_history[-1]
        ts = (
            datetime.fromisoformat(datetime_str)
            .replace(tzinfo=dt_timezone.utc)
            .timestamp()
        )
        if new_options == current_options:  # no change
            return
        if len(new_options) == len(current_options):  # renaming
            if any(v > 1 for v in Counter(new_options).values()):
                raise ValidationError("new_options includes duplicate labels")
        elif timezone.now().timestamp() < ts:
            raise ValidationError("options cannot change during a grace period")
        elif len(new_options) < len(current_options):  # deletion
            if len(new_options) < 2:
                raise ValidationError("Must have 2 or more options")
            if new_options[-1] != current_options[-1]:
                raise ValidationError("Cannot delete last option")
            if [o for o in new_options if o not in current_options]:
                raise ValidationError(
                    "options cannot change name while some are being deleted"
                )
        elif len(new_options) > len(current_options):  # addition
            if not grace_period_end or grace_period_end <= timezone.now():
                raise ValidationError(
                    "grace_period_end must be in the future if adding options"
                )
            if new_options[-1] != current_options[-1]:
                raise ValidationError("Cannot add option after last option")
            if [o for o in current_options if o not in new_options]:
                raise ValidationError(
                    "options cannot change name while some are being added"
                )

    def validate(self, data: dict) -> dict:
        question: Question = self.context.get("question")
        if not question:
            raise ValidationError("question must be provided in context")

        if question.type != Question.QuestionType.MULTIPLE_CHOICE:
            raise ValidationError("question must be of multiple choice type")

        options = data.get("options")
        options_history = question.options_history
        if not options or not options_history:
            raise ValidationError(
                "updating multiple choice questions requires options "
                "and question must already have options_history"
            )

        grace_period_end = data.get("grace_period_end")
        self.validate_new_options(options, options_history, grace_period_end)

        return data


def get_all_options_from_history(
    options_history: OptionsHistoryType | None,
) -> list[str]:
    """Returns the list of all options ever available. The last value in the list
    is always the "catch-all" option.

    example:
    options_history = [
        ("2020-01-01", ["a", "b", "other"]),
        ("2020-01-02", ["a", "b", "c", "other"]),
        ("2020-01-03", ["a", "c", "other"]),
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
    for i, (timestr, options) in enumerate(question.options_history):
        question.options_history[i] = (
            timestr,
            [new_option if opt == old_option else opt for opt in options],
        )

    return question


def multiple_choice_reorder_options(
    question: Question,
    new_options_order: list[str],
) -> Question:
    """
    Modifies question in place and returns it.
    Reorders multiple choice options in question options and options history.
    Requires all options ever to be present in new_options_order.

    For now, only supports reordering if options have never changed.
    """
    current_options = question.options
    all_options_ever = get_all_options_from_history(question.options_history)
    if question.type != Question.QuestionType.MULTIPLE_CHOICE:
        raise ValueError("Question must be multiple choice")
    if not current_options:
        raise ValueError("Question has no options")
    if set(new_options_order) != set(all_options_ever):
        raise ValueError("New order does not match existing options")
    if not question.options_history:
        raise ValueError("Options history is empty")

    if len(question.options_history) != 1:
        # TODO: support reordering options with history changes
        raise ValueError("Cannot reorder options that have changed")

    # update options history (it is only one entry long)
    question.options_history[0] = (question.options_history[0][0], new_options_order)
    question.options = new_options_order
    question.save()

    # update user forecasts
    # example forecast remap: all_options_ever = [a,b,c], new_options_order = [c,a,b]
    # remap = [2,0,1]
    # if a forecast is [0.2,0.3,0.5], then the new one is [0.5,0.2,0.3]
    remap = [all_options_ever.index(option) for option in new_options_order]
    for forecast in question.user_forecasts.all():
        forecast.probability_yes_per_category = [
            forecast.probability_yes_per_category[i] for i in remap
        ]
        forecast.save()

    # trigger recalculation of aggregates
    from questions.services.forecasts import build_question_forecasts

    build_question_forecasts(question)

    return question


def multiple_choice_change_grace_period_end(*args, **kwargs):
    raise NotImplementedError("multiple_choice_change_grace_period_end")


def multiple_choice_delete_options(
    question: Question,
    options_to_delete: list[str],
    comment_author: User,
    timestep: datetime | None = None,
    comment_text: str | None = None,
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

    if (
        datetime.fromisoformat(question.options_history[-1][0]).replace(
            tzinfo=dt_timezone.utc
        )
        > timestep
    ):
        raise ValueError("timestep is before the last options history entry")

    # update question
    new_options = [opt for opt in question.options if opt not in options_to_delete]
    all_options = get_all_options_from_history(question.options_history)

    question.options = new_options
    question.options_history.append((timestep.isoformat(), new_options))
    question.save()

    # update user forecasts
    user_forecasts = question.user_forecasts.filter(
        Q(end_time__isnull=True) | Q(end_time__gt=timestep),
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
        new_pmf: list[float | None] = [None] * len(all_options)
        for value, label in zip(previous_pmf, all_options):
            if value is None:
                continue
            if label in new_options:
                new_pmf[all_options.index(label)] = (
                    new_pmf[all_options.index(label)] or 0.0
                ) + value
            else:
                new_pmf[-1] = (
                    new_pmf[-1] or 0.0
                ) + value  # add to catch-all last option

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
    from questions.services.forecasts import build_question_forecasts

    build_question_forecasts(question)

    # notify users that about the change
    from questions.tasks import multiple_choice_delete_option_notifications

    multiple_choice_delete_option_notifications.send(
        question_id=question.id,
        timestep=timestep,
        comment_author_id=comment_author.id,
        comment_text=comment_text,
    )

    return question


def multiple_choice_add_options(
    question: Question,
    options_to_add: list[str],
    grace_period_end: datetime,
    comment_author: User,
    timestep: datetime | None = None,
    comment_text: str | None = None,
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
    if (
        datetime.fromisoformat(question.options_history[-1][0]).replace(
            tzinfo=dt_timezone.utc
        )
        > timestep
    ):
        raise ValueError("timestep is before the last options history entry")

    # update question
    new_options = question.options[:-1] + options_to_add + question.options[-1:]
    question.options = new_options
    question.options_history.append((grace_period_end.isoformat(), new_options))
    question.save()

    # update user forecasts
    user_forecasts = question.user_forecasts.all()
    for forecast in user_forecasts:
        pmf = forecast.probability_yes_per_category
        forecast.probability_yes_per_category = (
            pmf[:-1] + [None] * len(options_to_add) + [pmf[-1]]
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
    from questions.services.forecasts import build_question_forecasts

    build_question_forecasts(question)

    # notify users that about the change
    from questions.tasks import multiple_choice_add_option_notifications

    multiple_choice_add_option_notifications.send(
        question_id=question.id,
        grace_period_end=grace_period_end,
        timestep=timestep,
        comment_author_id=comment_author.id,
        comment_text=comment_text,
    )

    return question
