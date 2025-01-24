from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from posts.services.common import get_post_permission_for_user
from posts.models import Post
from projects.permissions import ObjectPermission
from questions.models import Question
from questions.serializers import serialize_question
from questions.types import AggregationMethod
from utils.the_math.aggregations import get_aggregation_history


@api_view(["GET"])
@permission_classes([AllowAny])
def aggregation_explorer_api_view(request):
    question_id = request.GET.get("question_id")
    if question_id:
        question: Question | None = Question.objects.filter(id=question_id).first()
        if question is None:
            raise ValidationError(f"Question with id {question_id} not found")
        post = question.get_post()
    else:
        post_id = request.GET.get("post_id")
        post: Post | None = Post.objects.filter(id=post_id).first()
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

    # get and validate aggregation_methods
    aggregation_methods: str | None = request.GET.get("aggregation_methods", None)
    if aggregation_methods:
        methods: list[AggregationMethod] = [
            m.strip() for m in aggregation_methods.split(",")
        ]
        for method in methods:
            if method not in AggregationMethod.values:
                raise PermissionDenied(f"Invalid aggregation method: {method}")
        if not request.user.is_staff:
            methods = [
                method
                for method in methods
                if method != AggregationMethod.SINGLE_AGGREGATION
            ]
    else:
        methods = [
            AggregationMethod.RECENCY_WEIGHTED,
            AggregationMethod.UNWEIGHTED,
            AggregationMethod.METACULUS_PREDICTION,
        ]
        if request.user.is_staff:
            methods.append(AggregationMethod.SINGLE_AGGREGATION)

    # get user_ids
    user_ids = request.GET.get("user_ids", None)
    if user_ids:
        user_ids = user_ids.split(",")
    if user_ids and not request.user.is_staff:
        # if user_ids provided, check user is staff
        raise PermissionDenied("Current user can not view user-specific data")
    include_bots = request.GET.get("include_bots", None)

    # to minimize the aggregation history or not
    minimize = str(request.GET.get("minimize", "true")).lower() == "true"

    aggregations = get_aggregation_history(
        question,
        methods,
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
        with_cp=True,
        post=question.get_post(),
        aggregate_forecasts=aggregate_forecasts,
        full_forecast_values=True,
    )
    return Response(data)
