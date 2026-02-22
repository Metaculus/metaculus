import random

from django.db.models import Exists, F, OuterRef, Q
from django.utils import timezone

from comments.models import KeyFactor
from posts.models import Post
from projects.models import Project
from questions.models import AggregateForecast, Question


ONBOARDING_PROJECT_ID = 32812
MAX_TOPICS = 4


def _base_queryset(now):
    """Common filters: approved, published, open, binary, has CP."""
    return (
        Post.objects.filter(
            curation_status=Post.CurationStatus.APPROVED,
            published_at__lte=now,
            open_time__lte=now,
            question__isnull=False,
            question__type=Question.QuestionType.BINARY,
        )
        .filter(Q(actual_close_time__isnull=True) | Q(actual_close_time__gte=now))
        .filter(
            Exists(
                AggregateForecast.objects.filter(
                    question_id=OuterRef("question_id"),
                    method=F("question__default_aggregation_method"),
                    end_time__isnull=True,
                    forecast_values__isnull=False,
                )
            )
        )
        .annotate(
            has_key_factors=Exists(
                KeyFactor.objects.filter(
                    comment__on_post_id=OuterRef("pk"),
                    is_active=True,
                )
            )
        )
        .select_related("question")
        .prefetch_related("projects")
    )


def get_onboarding_feed() -> dict:
    now = timezone.now()

    project_posts = list(
        _base_queryset(now).filter(default_project_id=ONBOARDING_PROJECT_ID)
    )

    def within_duration_limit(post: Post) -> bool:
        if not post.open_time or not post.scheduled_close_time:
            return False
        duration = (post.scheduled_close_time - post.open_time).total_seconds()
        if duration <= 0:
            return False
        elapsed = (now - post.open_time).total_seconds()
        return elapsed / duration < 0.8

    # Tier 1: learning project + duration filter
    tier1_posts = [p for p in project_posts if within_duration_limit(p)]
    tier1_categories = _group_and_qualify(tier1_posts)

    # Tier 2: learning project, no duration filter
    tier2_categories = _group_and_qualify(project_posts)

    selected = _pick_categories(tier1_categories, tier2_categories)

    if len(selected) < MAX_TOPICS:
        # Tier 3: all questions site-wide (exclude already-fetched posts)
        project_post_ids = {p.id for p in project_posts}
        global_posts = [
            p
            for p in _base_queryset(now).exclude(id__in=project_post_ids)
            if within_duration_limit(p)
        ]
        tier3_categories = _group_and_qualify(global_posts)
        selected = _pick_categories(selected, tier3_categories)

    return _build_topics(selected)


def _pick_categories(
    higher: list[tuple[int, str, str, list, list]],
    lower: list[tuple[int, str, str, list, list]],
) -> list[tuple[int, str, str, list, list]]:
    """Fill up to MAX_TOPICS from higher-priority first, then lower-priority.

    Avoids duplicate categories by id.
    """
    selected = list(higher)
    if len(selected) >= MAX_TOPICS:
        return selected

    used_ids = {entry[0] for entry in selected}
    for entry in lower:
        if entry[0] not in used_ids:
            selected.append(entry)
            used_ids.add(entry[0])
            if len(selected) >= MAX_TOPICS:
                break

    return selected


def _group_and_qualify(
    posts: list[Post],
) -> list[tuple[int, str, str, list, list]]:
    """Group posts by category and return qualifying categories.

    Returns list of (category_id, name, emoji, with_factors, without_factors)
    tuples for categories with >= 1 key_factors post and >= 2 total posts.
    """
    categories: dict[int, tuple[int, str, str, list, list]] = {}

    for post in posts:
        category = None
        for project in post.projects.all():
            if project.type == Project.ProjectTypes.CATEGORY:
                category = project
                break
        if not category:
            continue

        if category.id not in categories:
            categories[category.id] = (
                category.id,
                category.name,
                category.emoji or "📊",
                [],
                [],
            )

        entry = categories[category.id]
        if post.has_key_factors:
            entry[3].append(post)
        else:
            entry[4].append(post)

    return [
        entry
        for entry in categories.values()
        if len(entry[3]) >= 1 and len(entry[3]) + len(entry[4]) >= 2
    ]


def _build_topics(
    categories: list[tuple[int, str, str, list, list]],
) -> dict:
    random.shuffle(categories)
    selected = categories[:MAX_TOPICS]

    topics = []
    post_ids = []

    for _, name, emoji, with_factors, without_factors in selected:
        random.shuffle(with_factors)
        factors_post = with_factors[0]

        other_candidates = without_factors + with_factors[1:]
        random.shuffle(other_candidates)
        basic_post = other_candidates[0] if other_candidates else None

        if not basic_post:
            continue

        topics.append(
            {
                "name": name,
                "emoji": emoji,
                "questions": [basic_post.id, factors_post.id],
            }
        )
        post_ids.extend([basic_post.id, factors_post.id])

    return {"topics": topics, "post_ids": post_ids}
