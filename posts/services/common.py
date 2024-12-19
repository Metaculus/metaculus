import logging
from collections.abc import Iterable
from datetime import timedelta, date

from django.db.models import Q, Count, Sum, Value, Case, When, F, QuerySet
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from sql_util.aggregates import SubqueryAggregate

from comments.models import Comment
from comments.services.feed import get_comments_feed
from posts.models import Notebook, Post, PostUserSnapshot
from projects.models import Project
from projects.permissions import ObjectPermission
from projects.services.common import (
    notify_project_subscriptions_post_open,
    get_site_main_project,
    get_projects_staff_users,
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
from utils.translation import (
    update_translations_for_model,
    queryset_filter_outdated_translations,
    detect_and_update_content_language,
)
from .search import generate_post_content_for_embedding_vectorization
from .subscriptions import notify_post_status_change
from ..tasks import run_notify_post_status_change, run_post_indexing
from scoring.models import (
    global_leaderboard_dates,
    name_and_slug_for_global_leaderboard_dates,
    GLOBAL_LEADERBOARD_STRING,
)

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


def update_global_leaderboard_tags(post: Post):
    # set or update the tags for this post with respect to the global
    # leaderboard(s) this is a part of

    projects: QuerySet[Project] = post.projects.all()

    # Skip if post is not eligible for global leaderboards
    if not post.default_project.type == Project.ProjectTypes.SITE_MAIN and not next(
        (p for p in projects if p.type == Project.ProjectTypes.SITE_MAIN), None
    ):
        return

    # Get all global leaderboard dates and create/get corresponding tags
    to_set_tags = []
    gl_dates = global_leaderboard_dates()
    for question in post.get_questions():
        dates = question.get_global_leaderboard_dates(gl_dates=gl_dates)
        if dates:
            tag_name, tag_slug = name_and_slug_for_global_leaderboard_dates(dates)
            try:
                tag, _ = Project.objects.get_or_create(
                    type=Project.ProjectTypes.TAG, name=tag_name, slug=tag_slug, order=1
                )
            except Exception as e:
                # Unsure why this is happening, so for debugging purposes
                # log error and continue - don't block the triggering event
                # (e.g. question resolution)
                logger.error(
                    f"Error creating/getting global leaderboard tag for post {post.id}:"
                    f" {e}.\nContext: tag_name: {tag_name}, tag_slug: {tag_slug}, "
                    f"question: {question.id}, dates: {dates}"
                )
                return
            to_set_tags.append(tag)

    # Update post's global leaderboard tags
    current_gl_tags = [
        p
        for p in projects
        if p.type == Project.ProjectTypes.TAG
        and p.name.endswith(GLOBAL_LEADERBOARD_STRING)
    ]
    for tag in current_gl_tags:
        if tag not in to_set_tags:
            post.projects.remove(tag)
    for tag in to_set_tags:
        if tag not in current_gl_tags:
            post.projects.add(tag)


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

    # Populating categories
    if obj.default_project in categories:
        categories.remove(obj.default_project)

    obj.projects.add(*categories)

    # Update global leaderboard tags
    update_global_leaderboard_tags(obj)

    # Sync status fields
    obj.update_pseudo_materialized_fields()

    # Run async tasks
    run_post_indexing.send(obj.id)

    return obj


def trigger_update_post_translations(
    post: Post, with_comments: bool = False, force: bool = False
):
    is_private = post.default_project.default_permission is None
    if not force and is_private:
        return

    post.trigger_translation_if_dirty()
    if post.question_id is not None:
        post.question.trigger_translation_if_dirty()
    if post.notebook_id is not None:
        post.notebook.trigger_translation_if_dirty()
    if post.group_of_questions_id is not None:
        post.group_of_questions.trigger_translation_if_dirty()
    if post.conditional_id is not None:
        post.conditional.condition.trigger_translation_if_dirty()
        if hasattr(post.conditional.condition, "post"):
            post.conditional.condition.post.trigger_translation_if_dirty()

        post.conditional.condition_child.trigger_translation_if_dirty()
        if hasattr(post.conditional.condition_child, "post"):
            post.conditional.condition_child.post.trigger_translation_if_dirty()

        post.conditional.question_yes.trigger_translation_if_dirty()
        post.conditional.question_no.trigger_translation_if_dirty()

    batch_size = 10
    comments_qs = get_comments_feed(qs=Comment.objects.filter(), post=post)

    if with_comments:
        comments_qs = queryset_filter_outdated_translations(comments_qs)
        detect_and_update_content_language(comments_qs, batch_size)
        update_translations_for_model(comments_qs, batch_size)


def update_post(
    post: Post,
    categories: list[Project] = None,
    question: dict = None,
    conditional: dict = None,
    group_of_questions: dict = None,
    notebook: dict = None,
    **kwargs,
):
    # Content for embedding generation before update
    original_embedding_content = generate_post_content_for_embedding_vectorization(post)

    # Updating non-side effect fields
    post, _ = model_update(
        instance=post,
        fields=["title", "url_title", "default_project"],
        data=kwargs,
    )

    # Update post categories
    if categories:
        post.projects.set(
            # Keep existing non-category secondary projects
            {p for p in post.projects.all() if p.type != Project.ProjectTypes.CATEGORY}
            # Append updated set of categories
            | set(categories)
        )

    # Update global leaderboard tags
    update_global_leaderboard_tags(post)

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

    # Compare the text content before and after the post update for embedding generation
    # If the content has changed, re-run the post indexing process
    if original_embedding_content != generate_post_content_for_embedding_vectorization(
        post
    ):
        run_post_indexing.send(post.id)

    return post


def get_post_permission_for_user(post: Post, user: User = None) -> ObjectPermission:
    """
    A small wrapper to get the permission of post
    """

    perm = (
        Post.objects.annotate_user_permission(user=user)
        .values_list("user_permission", flat=True)
        .filter(id=post.id)
        .first()
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
        ).get(AggregationMethod.RECENCY_WEIGHTED, None)
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
    ).only("user_id", "divergence")

    bulk_update = []

    for user_snapshot in snapshots:
        div = divergence.get(user_snapshot.user_id)

        if div is not None:
            user_snapshot.divergence = div
            bulk_update.append(user_snapshot)

    PostUserSnapshot.objects.bulk_update(
        bulk_update, fields=["divergence"], batch_size=2000
    )


def compute_hotness():
    qs = Post.objects.filter(
        curation_status=Post.CurationStatus.APPROVED,
        published_at__lte=timezone.now(),
    )
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
            # Please note: we didn't have this before
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
                    "activity_boosts__score",
                    filter=Q(created_at__gte=last_week_dt),
                    aggregate=Sum,
                ),
                0,
            )
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


def approve_post(post: Post, open_time: date, cp_reveal_time: date):
    if post.curation_status == Post.CurationStatus.APPROVED:
        raise ValidationError("Post is already approved")

    post.update_curation_status(Post.CurationStatus.APPROVED)
    questions = post.get_questions()

    for question in questions:
        question.open_time = open_time
        question.cp_reveal_time = cp_reveal_time

    post.save()
    Question.objects.bulk_update(questions, fields=["open_time", "cp_reveal_time"])
    post.update_pseudo_materialized_fields()


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

    run_notify_post_status_change.send(post.id, Post.PostStatusChange.RESOLVED)


def handle_post_open(post: Post):
    """
    A specific handler is triggered once it's opened
    """

    # Handle post subscriptions
    notify_post_status_change(post, Post.PostStatusChange.OPEN)

    # Handle post on followed projects subscriptions
    notify_project_subscriptions_post_open(post)


def get_posts_staff_users(
    posts: Iterable[Post],
) -> dict[Post, dict[int, ObjectPermission]]:
    """
    Generates map of Curators/Admins for the given posts
    """

    post_default_projects_id_map = {post: post.default_project_id for post in posts}
    project_staff_map = get_projects_staff_users(post_default_projects_id_map.values())

    return {
        post: project_staff_map[default_project_id]
        for post, default_project_id in post_default_projects_id_map.items()
    }
