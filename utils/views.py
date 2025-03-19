from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from django.db.models import Q

from misc.models import WhitelistUser
from posts.models import Post
from posts.serializers import DownloadDataSerializer
from posts.services.common import get_post_permission_for_user
from projects.permissions import ObjectPermission
from questions.models import Question
from questions.serializers import serialize_question
from users.models import User
from utils.the_math.aggregations import get_aggregation_history


@api_view(["GET"])
@permission_classes([AllowAny])
def aggregation_explorer_api_view(request):
    user: User = request.user
    post: Post

    question_id = request.GET.get("question_id")
    if question_id:
        question: Question | None = Question.objects.filter(id=question_id).first()
        if question is None:
            raise ValidationError(f"Question with id {question_id} not found")
        post = question.get_post()
    else:
        post_id = request.GET.get("post_id")
        post = Post.objects.filter(id=post_id).first()
        if post is None:
            raise ValidationError(f"Post with id {post_id} not found")
        if post.question is None:
            raise ValidationError(
                f"Post with id {post_id} has no question, please submit a subquestion."
            )
        question = post.question

    # Check permissions
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_view(permission, raise_exception=True)

    # Context for the serializer
    is_staff = user.is_authenticated and user.is_staff
    is_whitelisted = user.is_authenticated and (
        WhitelistUser.objects.filter(
            Q(post=post)
            | Q(project=post.default_project)
            | (Q(post__isnull=True) & Q(project__isnull=True)),
            user=user,
        ).exists()
    )
    serializer_context = {
        "user": user if user.is_authenticated else None,
        "is_staff": is_staff,
        "is_whitelisted": is_whitelisted,
    }

    serializer = DownloadDataSerializer(
        data=request.query_params, context=serializer_context
    )
    serializer.is_valid(raise_exception=True)
    params = serializer.validated_data
    aggregation_methods = params.get("aggregation_methods")
    user_ids = params.get("user_ids")
    include_bots = params.get("include_bots")
    minimize = params.get("minimize", True)

    aggregations = get_aggregation_history(
        question,
        aggregation_methods=aggregation_methods,
        user_ids=user_ids,
        minimize=minimize,
        include_stats=True,
        include_bots=(
            include_bots
            if include_bots is not None
            else question.include_bots_in_aggregates
        ),
        histogram=True,
    )
    aggregate_forecasts = []
    for aggregation in aggregations.values():
        aggregate_forecasts.extend(aggregation)

    data: dict = serialize_question(
        question,
        post=question.get_post(),
        aggregate_forecasts=aggregate_forecasts,
        full_forecast_values=True,
    )
    return Response(data)
