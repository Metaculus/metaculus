from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from comments.constants import CommentReportType
from comments.models import Comment, KeyFactor
from comments.serializers.common import serialize_comment_many
from comments.serializers.key_factors import (
    KeyFactorWriteSerializer,
    serialize_key_factor_votes,
)
from comments.services.key_factors.common import (
    create_key_factors,
    key_factor_vote,
    delete_key_factor,
    get_key_factor_vote_type_and_choices,
)
from comments.services.key_factors.suggestions import generate_key_factors_for_comment
from notifications.services import send_key_factor_report_notification_to_staff
from posts.services.common import get_post_permission_for_user
from projects.permissions import ObjectPermission


@api_view(["POST"])
def key_factor_vote_view(request: Request, pk: int):
    key_factor = get_object_or_404(KeyFactor, pk=pk)

    vote_type, vote_choices = get_key_factor_vote_type_and_choices(key_factor)

    vote = serializers.ChoiceField(
        required=False, allow_null=True, choices=vote_choices
    ).run_validation(request.data.get("vote"))

    key_factor_vote(key_factor, user=request.user, vote=vote, vote_type=vote_type)

    return Response(
        serialize_key_factor_votes(
            key_factor, list(key_factor.votes.all()), user_vote=vote
        )
    )


@api_view(["POST"])
@transaction.atomic
def comment_add_key_factors_view(request: Request, pk: int):
    comment = get_object_or_404(Comment, pk=pk)

    if comment.author != request.user:
        raise PermissionDenied(
            "You do not have permission to add key factors to this comment."
        )

    serializer = KeyFactorWriteSerializer(data=request.data, many=True)
    serializer.is_valid(raise_exception=True)

    create_key_factors(comment, serializer.validated_data)

    return Response(
        serialize_comment_many([comment], with_key_factors=True)[0],
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def comment_suggested_key_factors_view(request: Request, pk: int):
    comment = get_object_or_404(Comment, pk=pk)

    existing_keyfactors = (
        KeyFactor.objects.for_posts([comment.on_post])
        .filter_active()
        .select_related("driver", "base_rate", "news")
    )

    suggested_key_factors = generate_key_factors_for_comment(
        comment.text, existing_keyfactors, comment.on_post
    )

    # TODO: check N+1 query
    return Response(KeyFactorWriteSerializer(suggested_key_factors, many=True).data)


@api_view(["DELETE"])
def key_factor_delete(request: Request, pk: int):
    key_factor = get_object_or_404(KeyFactor, pk=pk)

    # Check access
    permission = (
        ObjectPermission.CREATOR
        if key_factor.comment.author_id == request.user.id
        else get_post_permission_for_user(key_factor.comment.on_post, user=request.user)
    )
    ObjectPermission.can_delete_key_factor(permission, raise_exception=True)

    delete_key_factor(key_factor)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def key_factor_report_api_view(request, pk=int):
    class InputSerializer(serializers.Serializer):
        reason = serializers.ChoiceField(choices=CommentReportType.choices)

    key_factor = get_object_or_404(KeyFactor, pk=pk)
    serializer = InputSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    reason = serializer.validated_data["reason"]

    send_key_factor_report_notification_to_staff(key_factor, reason, request.user)

    return Response(status=status.HTTP_204_NO_CONTENT)
