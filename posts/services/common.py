import logging
from datetime import timedelta

from django.db.models import Q, Count, Sum, Value, Case, When, F
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from sql_util.aggregates import SubqueryAggregate

from posts.models import Notebook, Post, PostSubscription, PostUserSnapshot
from projects.models import Project
from projects.permissions import ObjectPermission
from projects.services import (
    get_site_main_project,
    notify_project_subscriptions_post_open,
)
from questions.services import (
    create_question,
    create_conditional,
    create_group_of_questions,
)
from users.models import User
from utils.dtypes import flatten
from utils.the_math.community_prediction import get_aggregation_at_time
from utils.the_math.measures import prediction_difference_for_sorting
from .subscriptions import notify_post_status_change
from ..tasks import run_notify_post_status_change

logger = logging.getLogger(__name__)


def add_categories(categories: list[int], post: Post):
    existing = [x.pk for x in post.projects.filter(type=Project.ProjectTypes.CATEGORY)]
    categories = [x for x in categories if x not in existing]
    all_category_ids = [
        x.id for x in Project.objects.filter(type=Project.ProjectTypes.CATEGORY).all()
    ]
    for category_id in categories:
        if category_id not in all_category_ids:
            raise ValidationError(f"Category with id {category_id} does not exist")
        post.projects.add(Project.objects.get(pk=category_id))
    post.save()


def create_post(
    *,
    title: str = None,
    projects: dict[str, list[Project]] = None,
    question: dict = None,
    conditional: dict = None,
    group_of_questions: dict = None,
    notebook: dict = None,
    author: User = None,
    url_title: str = None,
) -> Post:
    obj = Post(
        title=title,
        url_title=url_title,
        author=author,
        curation_status=Post.CurationStatus.DRAFT,
    )

    # Adding questions
    if question:
        obj.question = create_question(**question)
    elif conditional:
        obj.conditional = create_conditional(**conditional)
    elif group_of_questions:
        obj.group_of_questions = create_group_of_questions(**group_of_questions)
    elif notebook:
        obj.notebook = Notebook.objects.create(**notebook)

    # Projects appending
    # Tags, categories and topics
    meta_projects = []
    # Tournaments, Question Series etc.
    main_projects = []

    for project in flatten(projects.values()) if projects else []:
        if Project.ProjectTypes.can_have_permissions(project.type):
            main_projects.append(project)
        else:
            meta_projects.append(project)

    # If no projects were provided,
    # We need to append default ones
    if not main_projects:
        main_projects = [get_site_main_project()]

    if not obj.default_project:
        obj.default_project = main_projects.pop(0)

    # Save project and validate
    obj.full_clean()
    obj.save()

    # Sync status fields
    obj.update_pseudo_materialized_fields()

    # Adding projects
    obj.projects.add(*(meta_projects + main_projects))

    # Run async tasks
    from ..tasks import run_post_indexing

    run_post_indexing.send(obj.id)

    return obj


def get_post_permission_for_user(post: Post, user: User = None) -> ObjectPermission:
    """
    A small wrapper to get the permission of post
    """

    perm = (
        Post.objects.annotate_user_permission(user=user)
        .values_list("user_permission", flat=True)
        .get(id=post.id)
    )
    return perm


def compute_movement(post: Post) -> float | None:
    questions = post.get_questions()
    movement = None
    for question in questions:
        cp_now = get_aggregation_at_time(question, timezone.now())
        cp_previous = get_aggregation_at_time(
            question, timezone.now() - timezone.timedelta(days=7)
        )
        if cp_now is None or cp_previous is None:
            continue
        difference = prediction_difference_for_sorting(
            cp_now.get_prediction_values(),
            cp_previous.get_prediction_values(),
            question,
        )
        if (movement is None) or (abs(difference) > abs(movement)):
            movement = difference
    return movement


# Computes the jeffry divergence
def compute_sorting_divergence(post: Post) -> dict[int, float]:
    user_divergences = dict()
    questions = post.get_questions()
    now = timezone.now()
    for question in questions:
        cp = get_aggregation_at_time(question, now)
        if cp is None:
            continue

        active_forecasts = question.user_forecasts.filter(
            Q(end_time__isnull=True) | Q(end_time__gt=now),
            start_time__lte=now,
        )
        for forecast in active_forecasts:
            difference = prediction_difference_for_sorting(
                forecast.get_prediction_values(),
                cp.get_prediction_values(),
                question,
            )
            if (forecast.author_id not in user_divergences) or (
                abs(user_divergences[forecast.author_id]) < abs(difference)
            ):
                user_divergences[forecast.author_id] = difference

    return user_divergences


def compute_post_sorting_divergence_and_update_snapshots(post: Post):
    divergence = compute_sorting_divergence(post)

    snapshots = PostUserSnapshot.objects.filter(
        post=post, user_id__in=divergence.keys()
    )

    bulk_update = []

    for user_snapshot in snapshots:
        div = divergence.get(user_snapshot.user_id)

        if div is not None:
            user_snapshot.divergence = div
            bulk_update.append(user_snapshot)

    PostUserSnapshot.objects.bulk_update(bulk_update, fields=["divergence"])


def compute_hotness():
    qs = Post.objects.filter_active()
    last_week_dt = timezone.now() - timedelta(days=7)

    qs = qs.annotate(
        # nb predictions in last week
        hotness_value=Coalesce(
            SubqueryAggregate(
                "forecasts",
                filter=Q(start_time__gte=last_week_dt),
                aggregate=Count,
            ),
            0,
        )
        + (
            # Net votes in last week * 5
            # Please note: we dind't have this before
            Coalesce(
                SubqueryAggregate(
                    "votes__direction",
                    filter=Q(created_at__gte=last_week_dt),
                    aggregate=Sum,
                ),
                0,
            )
            * 5
        )
        + (
            # nr comments for last week * 10
            Coalesce(
                SubqueryAggregate(
                    "comments__id",
                    filter=Q(created_at__gte=last_week_dt),
                    aggregate=Count,
                ),
                0,
            )
            * 10
        )
        + (
            Coalesce(
                SubqueryAggregate(
                    "activity_boosts",
                    filter=Q(created_at__gte=last_week_dt),
                    aggregate=Sum,
                ),
                0,
            )
            * 20
        )
        + Case(
            # approved in last week
            When(
                published_at__gte=last_week_dt,
                then=Value(50),
            ),
            default=Value(0),
        )
    )

    qs.update(hotness=F("hotness_value"))


def resolve_post(post: Post):
    post.set_resolved()

    run_notify_post_status_change.send(
        post.id, PostSubscription.PostStatusChange.RESOLVED
    )


def close_post(post: Post):
    post.set_actual_close_time()

    run_notify_post_status_change.send(
        post.id, PostSubscription.PostStatusChange.CLOSED
    )


def handle_post_open(post: Post):
    """
    A specific handler is triggered once it's opened
    """

    # Handle post subscriptions
    notify_post_status_change(post, PostSubscription.PostStatusChange.OPEN)

    # Handle post on followed projects subscriptions
    notify_project_subscriptions_post_open(post)
