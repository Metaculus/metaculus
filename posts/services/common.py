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
    notify_project_subscriptions_post_open,
    get_site_main_project,
)
from questions.models import Question
from questions.services import (
    create_question,
    create_conditional,
    create_group_of_questions,
    update_question,
    update_conditional,
    update_group_of_questions,
    update_notebook,
)
from questions.types import AggregationMethod
from users.models import User
from utils.models import model_update
from utils.the_math.aggregations import get_aggregations_at_time
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
    categories: list[Project] = None,
    default_project: Project = None,
    question: dict = None,
    conditional: dict = None,
    group_of_questions: dict = None,
    notebook: dict = None,
    author: User = None,
    url_title: str = None,
    news_type: Project = None,
) -> Post:
    site_main = get_site_main_project()

    categories = list(categories or [])
    default_project = default_project or site_main

    obj = Post(
        title=title or "",
        url_title=url_title or title or "",
        author=author,
        curation_status=Post.CurationStatus.DRAFT,
    )

    # Adding questions
    if question:
        obj.question = create_question(**question)
    elif conditional:
        obj.conditional = create_conditional(**conditional)
        # Populate url_title from condition child
        obj.url_title = obj.conditional.condition_child.get_post().get_url_title()
    elif group_of_questions:
        obj.group_of_questions = create_group_of_questions(**group_of_questions)
    elif notebook:
        obj.notebook = Notebook.objects.create(**notebook)

    site_main = get_site_main_project()
    obj.default_project = default_project

    # Save project and validate
    obj.full_clean()
    obj.save()

    # Populating projects
    projects = categories + ([news_type] if news_type else [])
    if obj.default_project in projects:
        projects.remove(obj.default_project)

    # Make post visible in the main feed
    if obj.default_project != site_main and obj.default_project.add_posts_to_main_feed:
        projects.append(site_main)

    obj.projects.add(*projects)

    # Sync status fields
    obj.update_pseudo_materialized_fields()

    # Run async tasks
    from ..tasks import run_post_indexing

    run_post_indexing.send(obj.id)

    return obj


def update_post(
    post: Post,
    categories: list[Project] = None,
    question: dict = None,
    conditional: dict = None,
    group_of_questions: dict = None,
    notebook: dict = None,
    news_type: Project = None,
    **kwargs,
):
    categories = list(categories or [])

    # Updating non-side effect fields
    post, _ = model_update(
        instance=post,
        fields=["title", "url_title", "default_project"],
        data=kwargs,
    )

    projects = categories + ([news_type] if news_type else [])
    if post.default_project in projects:
        projects.remove(post.default_project)

    post.projects.set(projects)

    if question:
        if not post.question:
            raise ValidationError("Original post does not have a question")

        update_question(post.question, **question)

    if conditional:
        if not post.conditional:
            raise ValidationError("Original post does is not a conditional")

        update_conditional(post.conditional, **conditional)

    if group_of_questions:
        if not post.group_of_questions:
            raise ValidationError("Original post does is not a group of questions")

        update_group_of_questions(post.group_of_questions, **group_of_questions)

    if notebook:
        if not post.notebook:
            raise ValidationError("Original post does is not a notebook")

        update_notebook(post.notebook, **notebook)

    post.update_pseudo_materialized_fields()

    return post


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
    now = timezone.now()
    for question in questions:
        cp_now = get_aggregations_at_time(
            question, now, [AggregationMethod.RECENCY_WEIGHTED]
        ).get(AggregationMethod.RECENCY_WEIGHTED)

        if cp_now is None:
            continue

        cp_previous = get_aggregations_at_time(
            question, now - timedelta(days=7), [AggregationMethod.RECENCY_WEIGHTED]
        ).get(AggregationMethod.RECENCY_WEIGHTED)

        if cp_previous is None:
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
        cp = get_aggregations_at_time(
            question, now, [AggregationMethod.RECENCY_WEIGHTED]
        )[AggregationMethod.RECENCY_WEIGHTED]
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


def approve_post(post: Post, questions: list[dict] = None):
    if post.curation_status == Post.CurationStatus.APPROVED:
        raise ValidationError("Post is already approved")

    post.update_curation_status(Post.CurationStatus.APPROVED)
    post_questions_map = {q.pk: q for q in post.get_questions()}

    for params in questions:
        question = post_questions_map.get(params["question_id"])

        if not question:
            raise ValueError("Wrong question ID")

        question.open_time = params["open_time"]
        question.cp_reveal_time = params["cp_reveal_time"]

    post.save()
    Question.objects.bulk_update(
        list(post_questions_map.values()), fields=["open_time", "cp_reveal_time"]
    )


def submit_for_review_post(post: Post):
    if post.curation_status != Post.CurationStatus.DRAFT:
        raise ValueError("Can't submit for review non-draft post")

    post.curation_status = Post.CurationStatus.PENDING
    post.save(update_fields=["curation_status"])


def post_make_draft(post: Post):
    if post.curation_status != Post.CurationStatus.PENDING:
        raise ValueError("Can't submit for review non-pending post")

    post.curation_status = Post.CurationStatus.DRAFT
    post.save(update_fields=["curation_status"])


def resolve_post(post: Post):
    post.set_resolved()

    run_notify_post_status_change.send(
        post.id, PostSubscription.PostStatusChange.RESOLVED
    )


def handle_post_open(post: Post):
    """
    A specific handler is triggered once it's opened
    """

    # Handle post subscriptions
    notify_post_status_change(post, PostSubscription.PostStatusChange.OPEN)

    # Handle post on followed projects subscriptions
    notify_project_subscriptions_post_open(post)
