from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from comments.models import (
    Comment,
    KeyFactor,
    KeyFactorVote,
)
from comments.serializers.common import serialize_comment_many
from comments.services.key_factors import (
    create_key_factors,
    generate_keyfactors_for_comment,
    key_factor_vote,
)


@api_view(["POST"])
def key_factor_vote_view(request: Request, pk: int):
    key_factor = get_object_or_404(KeyFactor, pk=pk)
    vote = serializers.ChoiceField(
        required=False, allow_null=True, choices=KeyFactorVote.VoteScore.choices
    ).run_validation(request.data.get("vote"))
    # vote_type is always required, and when vote is None, the type is being used to
    # decide which vote to delete based on the type
    vote_type = serializers.ChoiceField(
        required=True, allow_null=False, choices=KeyFactorVote.VoteType.choices
    ).run_validation(request.data.get("vote_type"))

    score = key_factor_vote(
        key_factor, user=request.user, vote=vote, vote_type=vote_type
    )

    return Response({"score": score})


@api_view(["POST"])
@transaction.atomic
def comment_add_key_factors_view(request: Request, pk: int):
    comment = get_object_or_404(Comment, pk=pk)

    if comment.author != request.user:
        raise PermissionDenied(
            "You do not have permission to add key factors to this comment."
        )

    key_factors = serializers.ListField(
        child=serializers.CharField(allow_blank=False), allow_null=True
    ).run_validation(request.data.get("key_factors"))

    create_key_factors(comment, key_factors)

    return Response(
        serialize_comment_many([comment], with_key_factors=True)[0],
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def comment_suggested_key_factors_view(request: Request, pk: int):
    comment = get_object_or_404(Comment, pk=pk)

    existing_keyfactors = [
        keyfactor.driver.text
        for keyfactor in KeyFactor.objects.for_posts([comment.on_post])
        .filter_active()
        .filter(driver__isnull=False)
        .select_related("driver")
    ]

    suggested_key_factors = generate_keyfactors_for_comment(
        comment.text,
        existing_keyfactors,
        comment.on_post,  # type: ignore (on_post is not None)
    )

    return Response(
        suggested_key_factors,
        status=status.HTTP_200_OK,
    )
