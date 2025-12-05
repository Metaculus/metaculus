import logging
from collections.abc import Iterable
from datetime import date, datetime

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.db.utils import IntegrityError
from django.utils import timezone
from django.utils.translation import activate
from rest_framework.exceptions import ValidationError

from comments.models import Comment
from comments.services.feed import get_comments_feed
from posts.models import Notebook, Post, PostUserSnapshot, Vote
from projects.models import Project
from projects.permissions import ObjectPermission
from projects.services.cache import invalidate_projects_questions_count_cache
from projects.services.common import (
    get_projects_staff_users,
    get_site_main_project,
    move_project_forecasting_end_date,
)
from questions.models import Question
from questions.services.common import (
    create_conditional,
    create_group_of_questions,
    create_question,
    update_conditional,
    update_group_of_questions,
    update_notebook,
    update_question,
)
from scoring.models import (
    global_leaderboard_dates,
    name_and_slug_for_global_leaderboard_dates,
)
from users.models import User
from utils.models import model_update
from utils.the_math.aggregations import get_aggregations_at_time
from utils.the_math.measures import prediction_difference_for_sorting
from utils.translation import (
    detect_and_update_content_language,
    queryset_filter_outdated_translations,
    update_translations_for_model,
)
from .search import generate_post_content_for_embedding_vectorization
from .versioning import PostVersionService
from ..tasks import run_post_indexing, run_post_generate_history_snapshot

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

    # Skip if post is not eligible for global leaderboards
    if not any(
        p
        for p in post.get_related_projects()
        if p.visibility == Project.Visibility.NORMAL
    ):
        return

    # Get all global leaderboard dates and create/get corresponding tags
    desired_tags: list[Project] = []
    gl_dates = global_leaderboard_dates()

    for question in post.get_questions():
        dates = question.get_global_leaderboard_dates(gl_dates=gl_dates)
        if dates:
            tag_name, tag_slug = name_and_slug_for_global_leaderboard_dates(dates)
            try:
                tag, _ = Project.objects.get_or_create(
                    type=Project.ProjectTypes.LEADERBOARD_TAG,
                    slug=tag_slug,
                    defaults={"name": tag_name, "order": 1},
                )
            except IntegrityError:
                # We might have a race condition when two concurrent events
                # try to create the same tag simultaneously.
                # In this case, an IntegrityError could be thrown by the database
                # due to the unique slug constraint. This is absolutely okay,
                # we just need to take the actual record from the db
                tag = Project.objects.get(
                    type=Project.ProjectTypes.LEADERBOARD_TAG, slug=tag_slug
                )

            desired_tags.append(tag)

    # Reconcile current vs desired tags in bulk
    non_leaderboard_tags = post.projects.exclude(
        type=Project.ProjectTypes.LEADERBOARD_TAG
    )

    post.projects.set([*non_leaderboard_tags, *desired_tags])


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
    short_title: str = None,
    published_at: datetime = None,
    **kwargs,
) -> Post:
    # We always want to create post & questions content in the original mode
    activate(settings.ORIGINAL_LANGUAGE_CODE)
    site_main = get_site_main_project()

    categories = list(categories or [])
    default_project = default_project or site_main

    with transaction.atomic():
        obj = Post(
            title=title or "",
            short_title=short_title or title or "",
            author=author,
            curation_status=Post.CurationStatus.DRAFT,
            published_at=published_at,
            **kwargs,
        )

        # Adding questions
        if question:
            obj.question = create_question(**question)
        elif conditional:
            obj.conditional = create_conditional(**conditional)
            # Populate title and short_title from condition child
            obj.title = obj.conditional.get_title()
            obj.short_title = f"Conditional {obj.conditional.condition_child.get_post().get_short_title()}"
        elif group_of_questions:
            obj.group_of_questions = create_group_of_questions(**group_of_questions)
        elif notebook:
            obj.notebook = Notebook.objects.create(**notebook)

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

    # Invalidate projects cache
    invalidate_projects_questions_count_cache(obj.get_related_projects())

    return obj


def trigger_update_post_translations(
    post: Post, with_comments: bool = False, force: bool = False
):
    if (
        not force and not post.is_automatically_translated
    ) or post.curation_status != Post.CurationStatus.APPROVED:
        return

    is_private = post.is_private()
    should_translate_if_dirty = not is_private or force

    post.update_and_maybe_translate(should_translate_if_dirty)
    if post.question_id is not None:
        post.question.update_and_maybe_translate(should_translate_if_dirty)
    if post.notebook_id is not None:
        post.notebook.update_and_maybe_translate(should_translate_if_dirty)
    if post.group_of_questions_id is not None:
        post.group_of_questions.update_and_maybe_translate(should_translate_if_dirty)
        for sub_question in post.group_of_questions.questions.all():
            sub_question.update_and_maybe_translate(should_translate_if_dirty)
    if post.conditional_id is not None:
        post.conditional.condition.update_and_maybe_translate(should_translate_if_dirty)
        if hasattr(post.conditional.condition, "post"):
            post.conditional.condition.post.update_and_maybe_translate(
                should_translate_if_dirty
            )

        post.conditional.condition_child.update_and_maybe_translate(
            should_translate_if_dirty
        )
        if hasattr(post.conditional.condition_child, "post"):
            post.conditional.condition_child.post.update_and_maybe_translate(
                should_translate_if_dirty
            )

        post.conditional.question_yes.update_and_maybe_translate(
            should_translate_if_dirty
        )
        post.conditional.question_no.update_and_maybe_translate(
            should_translate_if_dirty
        )

    batch_size = 10
    comments_qs = get_comments_feed(qs=Comment.objects.filter(), post=post)

    if with_comments:
        comments_qs = queryset_filter_outdated_translations(comments_qs)
        detect_and_update_content_language(comments_qs, batch_size)
        update_translations_for_model(comments_qs, batch_size)


@transaction.atomic
def update_post(
    post: Post,
    categories: list[Project] = None,
    question: dict = None,
    conditional: dict = None,
    group_of_questions: dict = None,
    notebook: dict = None,
    updated_by: User = None,
    **kwargs,
):
    # We need to edit post & questions content in the original mode
    # To override _original fields instead of _<language> ones
    activate(settings.ORIGINAL_LANGUAGE_CODE)

    # Content for embedding generation before update
    original_embedding_content = generate_post_content_for_embedding_vectorization(post)

    # Updating non-side effect fields
    post, _ = model_update(
        instance=post,
        fields=["title", "short_title", "default_project"],
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

    if PostVersionService.check_is_enabled():
        run_post_generate_history_snapshot(
            post.id, updated_by.id if updated_by else None
        )

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


# Computes the jeffry divergence
def compute_sorting_divergence(post: Post) -> dict[int, float]:
    user_divergences = dict()
    questions = post.get_questions()
    now = timezone.now()
    for question in questions:
        if question.cp_reveal_time and question.cp_reveal_time > now:
            continue
        cp = get_aggregations_at_time(
            question, now, [question.default_aggregation_method]
        ).get(question.default_aggregation_method, None)
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
                question.type,
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


@transaction.atomic
def approve_post(
    post: Post,
    published_at: date,
    open_time: date,
    cp_reveal_time: date,
    scheduled_close_time: date,
    scheduled_resolve_time: date,
):
    if post.curation_status == Post.CurationStatus.APPROVED:
        raise ValidationError("Post is already approved")

    post.update_curation_status(Post.CurationStatus.APPROVED)
    post.published_at = published_at
    questions = post.get_questions()

    if post.question:
        # we have a single question, approval modal values overrule settings
        question = questions[0]
        question.open_time = open_time
        question.cp_reveal_time = cp_reveal_time
        question.scheduled_close_time = scheduled_close_time
        question.scheduled_resolve_time = scheduled_resolve_time
    else:
        # we have a group or conditional question
        # filled out values only apply to subquestions without pre-filled values
        for question in questions:
            question.open_time = question.open_time or open_time
            question.cp_reveal_time = question.cp_reveal_time or cp_reveal_time
            question.scheduled_close_time = (
                question.scheduled_close_time or scheduled_close_time
            )
            question.scheduled_resolve_time = (
                question.scheduled_resolve_time or scheduled_resolve_time
            )

    post.save()
    Question.objects.bulk_update(
        questions,
        fields=[
            "open_time",
            "cp_reveal_time",
            "scheduled_close_time",
            "scheduled_resolve_time",
        ],
    )

    # Automatically update secondary and default project forecasting end date
    for project in post.get_related_projects():
        if project.type in [
            Project.ProjectTypes.TOURNAMENT,
            Project.ProjectTypes.QUESTION_SERIES,
        ]:
            move_project_forecasting_end_date(project, post)

    post.update_pseudo_materialized_fields()

    # Invalidate project questions count cache since approval affects visibility
    invalidate_projects_questions_count_cache(post.get_related_projects())

    # Translate approved post
    trigger_update_post_translations(post, with_comments=False, force=False)

    # Log initial post version
    if PostVersionService.check_is_enabled():
        run_post_generate_history_snapshot(post.id, post.author_id)


@transaction.atomic
def reject_post(post: Post):
    if post.curation_status != Post.CurationStatus.PENDING:
        raise ValidationError("Post is not under review")

    post.update_curation_status(Post.CurationStatus.REJECTED)
    post.save()


def submit_for_review_post(post: Post):
    if post.curation_status != Post.CurationStatus.DRAFT:
        raise ValueError("Can't submit for review non-draft post")

    post.update_curation_status(Post.CurationStatus.PENDING)
    post.save()


def post_make_draft(post: Post):
    if post.curation_status != Post.CurationStatus.PENDING:
        raise ValueError("Can't submit for review non-pending post")

    post.update_curation_status(Post.CurationStatus.DRAFT)
    post.save()


def send_back_to_review(post: Post):
    if post.curation_status != Post.CurationStatus.APPROVED:
        raise ValueError("Can't send back to review non-approved post")

    post.curation_status = Post.CurationStatus.PENDING
    post.open_time = None
    post.save(update_fields=["curation_status", "open_time"])


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


def make_repost(post: Post, project: Project):
    """
    Report post into the given project
    """

    if post.default_project != project:
        post.projects.add(project)


def vote_post(post: Post, user: User, direction: int):
    try:
        with transaction.atomic():
            Vote.objects.filter(user=user, post=post).delete()

            if direction:
                Vote.objects.create(user=user, post=post, direction=direction)

    except IntegrityError:
        # Don't do anything in case of race conditions
        pass

    return post.update_vote_score()
