from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from posts.services.common import get_post_permission_for_user
from projects.permissions import ObjectPermission
from questions.models import Question
from questions.serializers import serialize_question
from questions.types import AggregationMethod
from utils.the_math.aggregations import get_aggregation_history


@api_view(["GET"])
@permission_classes([AllowAny])
def aggregation_explorer_api_view(request):
    question_id = request.GET.get("question_id")
    question: Question = get_object_or_404(Question.objects.all(), pk=question_id)
    # Check permissions
    permission = get_post_permission_for_user(question.get_post(), user=request.user)
    ObjectPermission.can_view(permission, raise_exception=True)

    # get and validate aggregation_methods
    aggregation_methods = request.GET.get("aggregation_methods", None)
    if aggregation_methods:
        aggregation_methods = aggregation_methods.split(",")
        for method in aggregation_methods:
            if method not in AggregationMethod.values:
                raise PermissionDenied(f"Invalid aggregation method: {method}")
    else:
        aggregation_methods = [
            AggregationMethod.RECENCY_WEIGHTED,
            AggregationMethod.UNWEIGHTED,
            AggregationMethod.SINGLE_AGGREGATION,
            AggregationMethod.METACULUS_PREDICTION,
        ]

    # get user_ids
    user_ids = request.GET.get("user_ids", None)
    if user_ids:
        user_ids = user_ids.split(",")
    if user_ids and not request.user.is_staff:
        # if user_ids provided, check user is staff
        raise PermissionDenied("Current user can not view user-specific data")
    include_bots = request.GET.get("include_bots", False)

    aggregations = get_aggregation_history(
        question,
        aggregation_methods,
        user_ids=user_ids,
        minimize=False,
        include_stats=True,
        include_bots=include_bots,
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
