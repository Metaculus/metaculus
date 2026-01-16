from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response

from comments.constants import CommentReportType
from comments.models import (
    ChangedMyMindEntry,
    Comment,
    CommentVote,
    CommentsOfTheWeekEntry,
)
from comments.serializers.common import (
    CommentWriteSerializer,
    OldAPICommentWriteSerializer,
    serialize_comment,
    serialize_comment_many,
    CommentFilterSerializer,
    serialize_comments_of_the_week_many,
)
from comments.services.common import (
    set_comment_excluded_from_week_top,
    create_comment,
    pin_comment,
    unpin_comment,
    soft_delete_comment,
    update_comment,
)
from comments.services.feed import get_comments_feed
from comments.services.key_factors.common import create_key_factors
from comments.utils import validate_predictors_mention
from notifications.services import send_comment_report_notification_to_staff
from posts.services.common import get_post_permission_for_user
from projects.permissions import ObjectPermission
from users.models import User
from utils.paginator import LimitOffsetPagination


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

    soft_delete_comment(comment)

    return Response({}, status=status.HTTP_200_OK)


@api_view(["POST"])
@transaction.atomic
def comment_create_api_view(request: Request):
    user: User = request.user
    serializer = CommentWriteSerializer(data=request.data, context={"user": user})
    serializer.is_valid(raise_exception=True)

    on_post = serializer.validated_data["on_post"]
    parent = serializer.validated_data.get("parent")
    included_forecast = serializer.validated_data.pop("included_forecast", False)
    key_factors = serializer.validated_data.pop("key_factors", None)

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
        if included_forecast and on_post.question_id
        else None
    )

    new_comment = create_comment(
        **serializer.validated_data, included_forecast=forecast, user=user
    )

    if key_factors:
        create_key_factors(new_comment, key_factors)

    return Response(
        serialize_comment_many([new_comment], with_key_factors=True)[0],
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def comment_edit_api_view(request: Request, pk: int):
    # Small validation
    comment = get_object_or_404(Comment, pk=pk)
    text = serializers.CharField().run_validation(request.data.get("text"))
    include_forecast = serializers.BooleanField(
        required=False, allow_null=True
    ).run_validation(request.data.get("include_forecast"))

    if not (comment.author == request.user):
        raise PermissionDenied("You do not have permission to edit this comment.")

    post = comment.on_post

    # Validate @predictors mention restriction
    validate_predictors_mention(text, request.user, post)

    forecast = None

    if include_forecast and not comment.included_forecast and post and post.question_id:
        active_time = comment.created_at
        question = post.question

        # If question was closed, take the forecast active on the date of closure
        if question.actual_close_time and question.actual_close_time <= timezone.now():
            active_time = question.actual_close_time

        forecast = (
            question.user_forecasts.filter(author=comment.author)
            .filter_active_at(active_time)
            .order_by("-start_time")
            .first()
        )

    update_comment(comment, text, included_forecast=forecast)
    comment.refresh_from_db()

    return Response(serialize_comment(comment), status=status.HTTP_200_OK)


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
def comment_toggle_pin_view(request: Request, pk: int):
    pin = serializers.BooleanField(allow_null=True).run_validation(
        request.data.get("pin")
    )

    comment = get_object_or_404(Comment, pk=pk)

    permission = get_post_permission_for_user(comment.on_post, user=request.user)
    ObjectPermission.can_pin_comment(permission, raise_exception=True)

    if pin:
        pin_comment(comment)
    else:
        unpin_comment(comment)

    return Response(serialize_comment(comment))


@api_view(["GET"])
@permission_classes([AllowAny])
def comments_of_week_view(request: Request):
    user = request.user
    # Parse and validate the start_date query parameter
    week_start_date = serializers.DateField(input_formats=["%Y-%m-%d"]).run_validation(
        request.query_params.get("start_date")
    )

    # Admins can see all top (max 18) candidates for the weekly top comments
    top_comments_of_week_entries = CommentsOfTheWeekEntry.objects.filter(
        week_start_date=week_start_date
    ).order_by("-score", "comment__created_at")

    # Users only see the top 6 comments which are not excluded
    if not (user.is_staff or user.is_superuser):
        top_comments_of_week_entries = top_comments_of_week_entries.filter(
            excluded=False
        )[:6]

    return Response(serialize_comments_of_the_week_many(top_comments_of_week_entries))


@api_view(["POST"])
@permission_classes([IsAdminUser])
def comment_set_excluded_from_week_top_view(request: Request, pk: int):
    comment = get_object_or_404(Comment, pk=pk)
    excluded = serializers.BooleanField(allow_null=False).run_validation(
        request.data.get("excluded")
    )

    set_comment_excluded_from_week_top(comment, excluded=excluded)
    return Response(status=status.HTTP_200_OK)
