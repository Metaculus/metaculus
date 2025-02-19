from projects.models import Project
from users.models import User
from utils.models import model_update


def get_communities_feed(
    qs: Project.objects = None,
    user: User = None,
    ids: list[int] = None,
    unlisted: bool = None,
    is_subscribed: bool = None,
    **kwargs,
) -> Project.objects:
    user = user if user and user.is_authenticated else None

    if qs is None:
        qs = Project.objects.all()

    # If ids provided
    if ids:
        qs = qs.filter(id__in=ids)

    # Filter by permission level
    qs = qs.filter_permission(user=user)

    # Filter communities
    qs = qs.filter_communities()

    if user:
        qs = qs.annotate_is_subscribed(user, include_members=True)

    # If hidden from the main feed
    if not ids and unlisted is not None:
        if unlisted:
            qs = qs.filter(visibility=Project.Visibility.UNLISTED)
        else:
            qs = qs.exclude(visibility=Project.Visibility.UNLISTED)

    if is_subscribed is not None and user:
        qs = qs.filter(is_subscribed=is_subscribed)

    if user:
        qs = qs.order_by("-is_subscribed", "-followers_count")
    else:
        qs = qs.order_by("-followers_count")

    return qs


def update_community(
    community: Project,
    **kwargs,
):
    # Updating non-side effect fields
    community, _ = model_update(
        instance=community,
        fields=["slug", "name", "description", "default_permission", "visibility"],
        data=kwargs,
    )

    return community
