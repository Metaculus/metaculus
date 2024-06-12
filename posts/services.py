from django.db.models import Q
from django.utils import timezone

from posts.models import Post
from posts.serializers import PostFilterSerializer
from users.models import User


def get_posts_feed(*, qs: Post.objects = None, user: User = None, filters: dict = None) -> Post.objects:
    """
    Applies filtering on the Questions QuerySet
    """

    qs = qs or Post.objects.all()

    # Search
    if search_query := filters.get("search"):
        qs = qs.filter(
            Q(title__icontains=search_query)
            | Q(author__username__icontains=search_query)
        )

    # Filters
    if topic := filters.get("topic"):
        qs = qs.filter(projects=topic)

    if tags := filters.get("tags"):
        qs = qs.filter(projects__in=tags)

    if categories := filters.get("categories"):
        qs = qs.filter(projects__in=categories)

    # TODO: ensure projects filtering logic is correct
    #   I assume it might not work exactly as before
    if tournaments := filters.get("tournaments"):
        qs = qs.filter(projects__in=tournaments)

    if forecast_type := filters.get("forecast_type"):
        forecast_type_q = Q()

        if "conditional" in forecast_type:
            forecast_type.pop(forecast_type.index("conditional"))
            forecast_type_q |= Q(conditional__isnull=False)

        if "group_of_questions" in forecast_type:
            forecast_type.pop(forecast_type.index("group_of_questions"))
            forecast_type_q |= Q(group_of_questions__isnull=False)

        if forecast_type:
            forecast_type_q |= Q(question__type__in=forecast_type)

        qs = qs.filter(forecast_type_q)

    if status := filters.get("status"):
        if "resolved" in status:
            qs = qs.filter(question__resolved_at__isnull=False).filter(
                question__resolved_at__lte=timezone.now()
            )
        if "active" in status:
            qs = (
                qs.filter(question__resolved_at__isnull=False)
                .filter(published_at__lte=timezone.now())
                .filter(
                    Q(
                        Q(question__closed_at__gte=timezone.now())
                        | Q(question__closed_at__isnull=True)
                    )
                )
                .filter(
                    Q(
                        Q(question__resolved_at__gte=timezone.now())
                        | Q(question__resolved_at__isnull=True)
                    )
                )
            )
        if "closed" in status:
            qs = qs.filter(question__closed_at__isnull=False).filter(
                question__closed_at__lte=timezone.now()
            )

    answered_by_me = filters.get("answered_by_me")

    if answered_by_me is not None and not user.is_anonymous:
        condition = {"question__forecast__author": user}
        qs = qs.filter(**condition) if answered_by_me else qs.exclude(**condition)

    # Ordering
    if order := filters.get("order"):
        match order:
            case PostFilterSerializer.Order.MOST_FORECASTERS:
                qs = qs.annotate_predictions_count__unique().order_by("-nr_forecasters")
            case PostFilterSerializer.Order.CLOSED_AT:
                qs = qs.order_by("-closed_at")
            case PostFilterSerializer.Order.RESOLVED_AT:
                qs = qs.order_by("-resolved_at")
            case PostFilterSerializer.Order.CREATED_AT:
                qs = qs.order_by("-created_at")

    return qs
