from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from projects.permissions import ObjectPermission
from projects.services.common import get_project_permission_for_user
from projects.services.communities import get_communities_feed, update_community
from utils.paginator import CountlessLimitOffsetPagination
from ..serializers.communities import (
    serialize_community_many,
    CommunityFilterSerializer,
    CommunityUpdateSerializer,
    serialize_community,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def communities_list_api_view(request: Request):
    paginator = CountlessLimitOffsetPagination()

    # Apply filtering
    filters_serializer = CommunityFilterSerializer(data=request.query_params)
    filters_serializer.is_valid(raise_exception=True)

    qs = get_communities_feed(
        user=request.user,
        # Show only listed communities
        unlisted=False,
        **filters_serializer.validated_data
    )

    # Paginating queryset
    communities = paginator.paginate_queryset(qs, request)

    data = serialize_community_many(
        communities,
        current_user=request.user,
    )

    return paginator.get_paginated_response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def community_detail_api_view(request: Request, slug):
    qs = get_communities_feed(user=request.user).filter(slug=slug)

    communities = serialize_community_many(
        qs,
        current_user=request.user,
    )

    if not communities:
        raise NotFound("Community not found")

    return Response(communities[0])


@api_view(["PUT"])
def community_update_api_view(request, pk):
    community = get_object_or_404(get_communities_feed(user=request.user), pk=pk)

    permission = get_project_permission_for_user(community, user=request.user)
    ObjectPermission.can_edit_community_project(permission, raise_exception=True)

    serializer = CommunityUpdateSerializer(community, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)

    community = update_community(community, **serializer.validated_data)

    return Response(serialize_community(community))
