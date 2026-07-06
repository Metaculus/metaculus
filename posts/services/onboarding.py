import random
from dataclasses import dataclass, field

from django.db.models import DateTimeField, Exists, ExpressionWrapper, F, OuterRef, Q
from django.db.models.functions import Now
from django.utils import timezone

from comments.models import KeyFactor
from posts.models import Post
from projects.models import Project
from questions.models import Question


ONBOARDING_PROJECT_ID = 32812
MAX_TOPICS = 4


@dataclass
class CategoryBucket:
    project: Project
    with_factors: list = field(default_factory=list)
    without_factors: list = field(default_factory=list)


def _base_queryset():
    """Common filters: active, public, binary, has CP."""
    return (
        Post.objects.filter_public()
        .filter_active()
        .filter(
            question__isnull=False,
            question__type=Question.QuestionType.BINARY,
            forecasts_count__gt=0,
        )
        .filter(
            Q(question__cp_reveal_time__isnull=True)
            | Q(question__cp_reveal_time__lte=timezone.now())
        )
        .annotate(
            has_key_factors=Exists(
                KeyFactor.objects.filter_active().filter(
                    comment__on_post_id=OuterRef("pk"),
                )
            )
        )
        .prefetch_related("projects")
    )


def _with_duration_filter(qs):
    """Filter to posts that are less than 80% through their open duration."""
    return (
        qs.filter(
            open_time__isnull=False,
            scheduled_close_time__isnull=False,
            scheduled_close_time__gt=F("open_time"),
        )
        .annotate(
            _duration_cutoff=ExpressionWrapper(
                F("open_time") + (F("scheduled_close_time") - F("open_time")) * 0.8,
                output_field=DateTimeField(),
            )
        )
        .filter(_duration_cutoff__gt=Now())
    )


def get_onboarding_feed() -> dict:
    base = _base_queryset()

    project_posts = list(base.filter(default_project_id=ONBOARDING_PROJECT_ID))

    # Tier 1: learning project + duration filter
    tier1_posts = list(
        _with_duration_filter(base.filter(default_project_id=ONBOARDING_PROJECT_ID))
    )
    tier1_categories = _group_and_qualify(tier1_posts)

    # Tier 2: learning project, no duration filter
    tier2_categories = _group_and_qualify(project_posts)

    selected = _pick_categories(tier1_categories, tier2_categories)

    if len(selected) < MAX_TOPICS:
        # Tier 3: site-wide with duration filter (exclude already-fetched posts)
        project_post_ids = {p.id for p in project_posts}
        global_posts = list(
            _with_duration_filter(base.exclude(id__in=project_post_ids))[:120]
        )
        tier3_categories = _group_and_qualify(global_posts)
        selected = _pick_categories(selected, tier3_categories)

    return _build_topics(selected)


def _pick_categories(
    higher: list[CategoryBucket],
    lower: list[CategoryBucket],
) -> list[CategoryBucket]:
    """Fill up to MAX_TOPICS from higher-priority first, then lower-priority.

    Avoids duplicate categories by id.
    """
    selected = list(higher)
    if len(selected) >= MAX_TOPICS:
        return selected

    used_ids = {entry.project.id for entry in selected}
    for entry in lower:
        if entry.project.id not in used_ids:
            selected.append(entry)
            used_ids.add(entry.project.id)
            if len(selected) >= MAX_TOPICS:
                break

    return selected


def _group_and_qualify(
    posts: list[Post],
) -> list[CategoryBucket]:
    """Group posts by category and return qualifying categories.

    Returns CategoryBucket list for categories with >= 1 key_factors post
    and >= 2 total posts.
    """
    categories: dict[int, CategoryBucket] = {}

    for post in posts:
        category = None
        for project in post.projects.all():
            if project.type == Project.ProjectTypes.CATEGORY:
                category = project
                break
        if not category:
            continue

        if category.id not in categories:
            categories[category.id] = CategoryBucket(project=category)

        bucket = categories[category.id]
        if post.has_key_factors:
            bucket.with_factors.append(post)
        else:
            bucket.without_factors.append(post)

    return [
        bucket
        for bucket in categories.values()
        if len(bucket.with_factors) >= 1
        and len(bucket.with_factors) + len(bucket.without_factors) >= 2
    ]


def _build_topics(
    categories: list[CategoryBucket],
) -> dict:
    random.shuffle(categories)
    selected = categories[:MAX_TOPICS]

    topics = []
    post_ids = []

    for bucket in selected:
        random.shuffle(bucket.with_factors)
        factors_post = bucket.with_factors[0]

        other_candidates = bucket.without_factors + bucket.with_factors[1:]
        random.shuffle(other_candidates)
        basic_post = other_candidates[0] if other_candidates else None

        if not basic_post:
            continue

        topics.append(
            {
                "name": bucket.project.name,
                "emoji": bucket.project.emoji or "📊",
                "questions": [basic_post.id, factors_post.id],
            }
        )
        post_ids.extend([basic_post.id, factors_post.id])

    return {"topics": topics, "post_ids": post_ids}
