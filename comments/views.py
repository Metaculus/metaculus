import difflib

from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response

from comments.constants import CommentReportType
from comments.models import (
    ChangedMyMindEntry,
    Comment,
    CommentVote,
    CommentDiff,
    KeyFactor,
    KeyFactorVote,
)
from comments.serializers import (
    CommentWriteSerializer,
    OldAPICommentWriteSerializer,
    serialize_comment,
    serialize_comment_many,
    CommentFilterSerializer,
)
from comments.services.common import create_comment, trigger_update_comment_translations
from comments.services.feed import get_comments_feed
from comments.services.key_factors import key_factor_vote
from notifications.services import send_comment_report_notification_to_staff
from posts.services.common import get_post_permission_for_user
from projects.permissions import ObjectPermission
from users.models import User
from users.services.spam_detection import (
    check_new_comment_for_spam,
    send_deactivation_email,
)


class RootCommentsPagination(LimitOffsetPagination):
    """
    Paginates by Root comments and includes all child comments
    """

    total_count: int

    def paginate_queryset(self, queryset, request, view=None):
        # All comments from the queryset
        self.total_count = self.get_count(queryset)

        root_qs = queryset.filter(root__isnull=True)

        # Fetches only root comments
        root_objects = super().paginate_queryset(root_qs, request, view=view)

        # Re-apply filter to the original queryset
        # To keep original ordering
        paginated_data = list(
            queryset.filter(
                Q(root__in=root_objects) | Q(pk__in=[x.pk for x in root_objects])
            )
        )

        return paginated_data

    def get_paginated_response(self, data):
        return Response(
            {
                "total_count": self.total_count,
                "count": self.count,
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def comments_list_api_view(request: Request):
    comments = Comment.objects.all()
    use_root_comments_pagination = serializers.BooleanField(
        allow_null=True
    ).run_validation(request.query_params.get("use_root_comments_pagination"))

    # Validate query parameters using the serializer
    filters_serializer = CommentFilterSerializer(data=request.query_params)
    filters_serializer.is_valid(raise_exception=True)

    validated_data = filters_serializer.validated_data

    # Filter the queryset using the service function
    comments = get_comments_feed(comments, user=request.user, **validated_data)

    paginator = (
        RootCommentsPagination()
        if use_root_comments_pagination
        else LimitOffsetPagination()
    )
    paginated_comments = paginator.paginate_queryset(comments, request)

    data = serialize_comment_many(
        paginated_comments, request.user, with_key_factors=True
    )

    return paginator.get_paginated_response(data)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def comment_delete_api_view(request: Request, pk: int):
    comment = get_object_or_404(Comment, pk=pk)

    comment.is_soft_deleted = True
    comment.save()

    return Response({}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def comment_create_api_view(request: Request):
    user: User = request.user
    serializer = CommentWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    on_post = serializer.validated_data["on_post"]
    parent = serializer.validated_data.get("parent")
    included_forecast = serializer.validated_data.pop("included_forecast", False)

    # Small validation
    permission = get_post_permission_for_user(
        parent.on_post if parent else on_post, user=user
    )
    ObjectPermission.can_comment(permission, raise_exception=True)

    forecast = (
        (
            on_post.question.user_forecasts.filter(author_id=user.id)
            .order_by("-start_time")
            .first()
        )
        if included_forecast
        else None
    )

    # Check for spam
    is_spam, _ = check_new_comment_for_spam(
        user=user, comment_text=serializer.validated_data["text"]
    )

    if is_spam:
        user.mark_as_spam()
        send_deactivation_email(user.email)
        return Response(
            data={
                "message": "This comment seems to be spam. Please contact "
                "support@metaculus.com if you believe this was a mistake.",
                "error_code": "SPAM_DETECTED",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    new_comment = create_comment(
        **serializer.validated_data, included_forecast=forecast, user=user
    )

    return Response(
        serialize_comment_many([new_comment])[0], status=status.HTTP_201_CREATED
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def comment_edit_api_view(request: Request, pk: int):
    # Small validation
    comment = get_object_or_404(Comment, pk=pk)
    text = serializers.CharField().run_validation(request.data.get("text"))

    if not (comment.author == request.user):
        raise PermissionDenied("You do not have permission to edit this comment.")

    differ = difflib.Differ()

    diff = list(differ.compare(comment.text.splitlines(), text.splitlines()))
    text_diff = "\n".join(diff)

    with transaction.atomic():
        comment_diff = CommentDiff.objects.create(
            comment=comment,
            author=comment.author,
            text_diff=text_diff,
        )

        comment.edit_history.append(comment_diff.id)
        comment.text = text
        comment.save(update_fields=["text", "edit_history"])
    trigger_update_comment_translations(comment, force=False)

    return Response({}, status=status.HTTP_200_OK)


@api_view(["POST"])
@transaction.atomic
def comment_vote_api_view(request: Request, pk: int):
    comment = get_object_or_404(Comment, pk=pk)

    permission = get_post_permission_for_user(comment.on_post, user=request.user)
    ObjectPermission.can_view(permission, raise_exception=True)

    if comment.author_id == request.user.pk:
        raise ValidationError("You can not vote your own comment.")

    direction = serializers.ChoiceField(
        required=False, allow_null=True, choices=CommentVote.VoteDirection.choices
    ).run_validation(request.data.get("vote"))

    # Deleting existing vote
    CommentVote.objects.filter(user=request.user, comment=comment).delete()

    if direction:
        CommentVote.objects.create(
            user=request.user, comment=comment, direction=direction
        )

    return Response(
        {"score": Comment.objects.annotate_vote_score().get(pk=comment.pk).vote_score}
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def comment_toggle_cmm_view(request, pk=int):
    enabled = request.data.get("enabled", False)
    comment = get_object_or_404(Comment, pk=pk)
    user = request.user
    cmm = ChangedMyMindEntry.objects.filter(user=user, comment=comment)

    if not enabled and cmm.exists():
        cmm.delete()

        return Response(status=status.HTTP_200_OK)

    if not cmm.exists():
        cmm = ChangedMyMindEntry.objects.create(user=user, comment=comment)
        return Response(status=status.HTTP_200_OK)

    return Response(
        {"error": "Already set as changed my mind"},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["POST"])
def comment_report_api_view(request, pk=int):
    comment = get_object_or_404(Comment, pk=pk)
    post = comment.on_post

    reason = serializers.ChoiceField(choices=CommentReportType.choices).run_validation(
        request.data.get("reason")
    )

    if post:
        send_comment_report_notification_to_staff(comment, reason, request.user)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def comment_create_oldapi_view(request: Request):
    """
    This has to respond to requests of this form:
    response = requests.post(
         f"metaculus.com/api2/comments/",
         json={
             "comment_text": comment_text,
             "submit_type": "N",
             "include_latest_prediction": True,
             "question": question_id,
         },
         **AUTH_HEADERS,
     )
    """
    user = request.user
    serializer = OldAPICommentWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    on_post = serializer.validated_data["question"]
    is_private = serializer.validated_data.get("submit_type") == "N"
    included_forecast = serializer.validated_data.pop("include_latest_prediction", None)
    text = serializer.validated_data["comment_text"]

    permission = get_post_permission_for_user(on_post, user=user)
    ObjectPermission.can_comment(permission, raise_exception=True)

    forecast = (
        (
            on_post.question.user_forecasts.filter(author_id=user.id)
            .order_by("-start_time")
            .first()
        )
        if included_forecast
        else None
    )

    new_comment = create_comment(
        on_post=on_post,
        is_private=is_private,
        included_forecast=forecast,
        user=user,
        text=text,
    )

    return Response(serialize_comment(new_comment), status=status.HTTP_201_CREATED)


@api_view(["POST"])
def key_factor_vote_view(request: Request, pk: int):
    key_factor = get_object_or_404(KeyFactor, pk=pk)
    vote = serializers.ChoiceField(
        required=False, allow_null=True, choices=KeyFactorVote.VoteScore.choices
    ).run_validation(request.data.get("vote"))

    score = key_factor_vote(key_factor, user=request.user, vote=vote)

    return Response({"score": score})
