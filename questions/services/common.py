import logging
from collections import defaultdict
from typing import Iterable

import sentry_sdk
from django.db.models import F
from django.utils import timezone

from coherence.models import CoherenceLink
from posts.models import Notebook
from projects.models import Project
from questions.models import (
    Question,
    GroupOfQuestions,
    Conditional,
    AggregateForecast,
    QUESTION_CONTINUOUS_TYPES,
)
from scoring.constants import LeaderboardScoreTypes
from scoring.models import Leaderboard
from scoring.utils import update_project_leaderboard
from users.models import User
from utils.models import model_update
from utils.the_math.formulas import unscaled_location_to_scaled_location

logger = logging.getLogger(__name__)


def create_question(*, title: str = None, **kwargs) -> Question:
    obj = Question(title=title, **kwargs)
    obj.full_clean()
    obj.save()

    return obj


def update_question(question: Question, **kwargs) -> Question:
    scheduled_close_time = kwargs.get("scheduled_close_time")

    question, _ = model_update(
        instance=question,
        data=kwargs,
    )

    # Remove actual close time on value change
    if scheduled_close_time and scheduled_close_time > timezone.now():
        question.actual_close_time = None
        question.save()

    return question


def create_group_of_questions(*, questions: list[dict], **kwargs) -> GroupOfQuestions:
    obj = GroupOfQuestions(**kwargs)

    obj.full_clean()
    obj.save()

    # Adding questions
    for question_data in questions:
        create_question(group_id=obj.id, **question_data)

    return obj


def update_group_of_questions(
    group: GroupOfQuestions,
    delete: list[int] = None,
    questions: list[dict] = None,
    **kwargs,
) -> GroupOfQuestions:
    questions = questions or []
    questions_map = {q.pk: q for q in group.questions.all()}

    group, _ = model_update(
        instance=group,
        fields=[
            "fine_print",
            "resolution_criteria",
            "description",
            "group_variable",
            "subquestions_order",
            "graph_type",
        ],
        data=kwargs,
    )

    # Deleting questions
    if delete:
        group.questions.filter(id__in=delete).delete()

    for question_data in questions:
        question_id = question_data.get("id")

        if question_id:
            question_obj = questions_map.get(question_id)

            if not question_obj:
                raise ValueError("Question ID does not exist for this group")

            update_question(question_obj, **question_data)
        else:
            create_question(group_id=group.id, **question_data)

    group.save()
    return group


def clone_question(question: Question, title: str = None, **kwargs) -> Question:
    """
    Avoid auto-cloning to prevent unexpected side effects
    """

    return create_question(
        title=title,
        description=kwargs.pop("description", question.description),
        type=kwargs.pop("type", question.type),
        possibilities=kwargs.pop("possibilities", question.possibilities),
        resolution=kwargs.pop("resolution", question.resolution),
        range_max=kwargs.pop("range_max", question.range_max),
        range_min=kwargs.pop("range_min", question.range_min),
        zero_point=kwargs.pop("zero_point", question.zero_point),
        open_upper_bound=kwargs.pop("open_upper_bound", question.open_upper_bound),
        open_lower_bound=kwargs.pop("open_lower_bound", question.open_lower_bound),
        inbound_outcome_count=kwargs.pop(
            "inbound_outcome_count", question.inbound_outcome_count
        ),
        options=kwargs.pop("options", question.options),
        group_variable=kwargs.pop("group_variable", question.group_variable),
        resolution_set_time=kwargs.pop(
            "resolution_set_time", question.resolution_set_time
        ),
        actual_resolve_time=kwargs.pop(
            "actual_resolve_time", question.actual_resolve_time
        ),
        scheduled_close_time=kwargs.pop(
            "scheduled_close_time", question.scheduled_close_time
        ),
        scheduled_resolve_time=kwargs.pop(
            "scheduled_resolve_time", question.scheduled_resolve_time
        ),
        open_time=kwargs.pop("open_time", question.open_time),
        actual_close_time=kwargs.pop("actual_close_time", question.actual_close_time),
        unit=kwargs.pop("unit", question.unit),
        **kwargs,
    )


def create_conditional(
    *, condition_id: int = None, condition_child_id: int = None
) -> Conditional:
    # Auto-generating yes/no questions

    # TODO: select only questions user has access to (public only)
    condition = Question.objects.get(pk=condition_id)
    condition_child = Question.objects.get(pk=condition_child_id)

    question_yes = clone_question(
        condition_child,
        title=f"{condition.title} (Yes) → {condition_child.title}",
        scheduled_close_time=min(
            condition.scheduled_close_time, condition_child.scheduled_close_time
        ),
    )
    question_no = clone_question(
        condition_child,
        title=f"{condition.title} (No) → {condition_child.title}",
        scheduled_close_time=min(
            condition.scheduled_close_time, condition_child.scheduled_close_time
        ),
    )

    obj = Conditional(
        condition_id=condition_id,
        condition_child_id=condition_child_id,
        question_yes=question_yes,
        question_no=question_no,
    )

    obj.full_clean()
    obj.save()

    return obj


def update_conditional(
    obj: Conditional, condition_id: int = None, condition_child_id: int = None
) -> Conditional:
    post = obj.post

    # TODO: select only questions user has access to (public only)
    condition = (
        Question.objects.get(pk=condition_id)
        if condition_id != obj.condition_id
        else None
    )
    condition_child = (
        Question.objects.get(pk=condition_child_id)
        if condition_child_id != obj.condition_child_id
        else None
    )

    if condition or condition_child:
        if condition:
            obj.condition = condition
        if condition_child:
            obj.condition_child = condition_child
            # Update post short_title from condition child
            post.short_title = condition_child.get_post().get_short_title()
            post.save(update_fields=["short_title"])

        title = f"{obj.condition.title} (%s) → {obj.condition_child.title}"

        question_yes = clone_question(condition_child, title=title % "Yes")
        question_yes.save()
        obj.question_yes = question_yes

        question_no = clone_question(condition_child, title=title % "No")
        question_no.save()
        obj.question_no = question_no

    obj.save()
    return obj


def update_notebook(notebook: Notebook, **kwargs):
    post = getattr(notebook, "post", None)

    # We want to update edited at for approved notebooks only
    if post and post.status == post.CurationStatus.APPROVED:
        kwargs["edited_at"] = timezone.now()

    notebook, _ = model_update(
        instance=notebook,
        fields=["markdown", "type", "image_url", "edited_at"],
        data=kwargs,
    )

    return notebook


def update_leaderboards_for_question(question: Question):
    post = question.get_post()
    projects = [post.default_project] + list(post.projects.all())
    update_global_leaderboards = False
    for project in projects:
        if project.visibility == Project.Visibility.NORMAL:
            update_global_leaderboards = True

        if project.type == Project.ProjectTypes.SITE_MAIN:
            # global leaderboards handled separately
            continue

        leaderboards = project.leaderboards.all()
        for leaderboard in leaderboards:
            update_project_leaderboard(project, leaderboard)

    if update_global_leaderboards:
        global_leaderboard_window = question.get_global_leaderboard_dates()
        if global_leaderboard_window is not None:
            global_leaderboards = Leaderboard.objects.filter(
                project__type=Project.ProjectTypes.SITE_MAIN,
                start_time=global_leaderboard_window[0],
                end_time=global_leaderboard_window[1],
            ).exclude(
                score_type__in=[
                    LeaderboardScoreTypes.COMMENT_INSIGHT,
                    LeaderboardScoreTypes.QUESTION_WRITING,
                ]
            )
            for leaderboard in global_leaderboards:
                update_project_leaderboard(leaderboard=leaderboard)


def get_outbound_question_links(question: Question, user: User) -> list[Question]:
    links = CoherenceLink.objects.filter(question1=question, user=user).select_related(
        "question2"
    )
    outbound_questions = [link.question2 for link in links]
    return outbound_questions


@sentry_sdk.trace
def get_questions_cutoff(
    questions: Iterable[Question], group_cutoff: int | None = None
):
    if not group_cutoff:
        return questions

    qs = (
        AggregateForecast.objects.filter(
            question__in=questions, method=F("question__default_aggregation_method")
        )
        .filter_active_at(timezone.now())
        .order_by("question_id", "-start_time")
        .distinct("question_id")
        .values_list("question_id", "centers")
    )
    aggregations = dict(qs)
    grouped = defaultdict(list)

    for q in questions:
        if (
            q.group_id
            and q.group.graph_type
            != GroupOfQuestions.GroupOfQuestionsGraphType.FAN_GRAPH
        ):
            grouped[q.group].append(q)

    def rank_sorting_key(q: Question):
        return q.group_rank or 0

    def cp_sorting_key(q: Question):
        """
        Extracts question aggregation forecast value
        """
        centers = aggregations.get(q.id)

        if not centers:
            return 0
        if q.type == "binary":
            if len(centers) < 2:
                return 0

            return centers[1]
        if q.type in QUESTION_CONTINUOUS_TYPES:
            return unscaled_location_to_scaled_location(centers[0], q)
        if q.type == "multiple_choice":
            return max(centers)
        return 0

    cutoff_excluded = {
        q
        for group, qs in grouped.items()
        for q in sorted(
            qs,
            key=(
                rank_sorting_key
                if group.subquestions_order
                == GroupOfQuestions.GroupOfQuestionsSubquestionsOrder.MANUAL
                else cp_sorting_key
            ),
            reverse=(
                group.subquestions_order
                == GroupOfQuestions.GroupOfQuestionsSubquestionsOrder.CP_DESC
            ),
        )[group_cutoff:]
    }

    return set(questions) - cutoff_excluded
