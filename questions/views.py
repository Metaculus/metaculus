from datetime import datetime

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from questions.models import Forecast, Question


@api_view(["POST"])
def create_forecast_api_view(request, pk: int):
    print(pk)
    question = get_object_or_404(Question.objects.all(), pk=pk)
    data = request.data
    now = datetime.now()
    prev_forecasts = (
        Forecast.objects.filter(question=question, author=request.user)
        .order_by("start_time")
        .last()
    )
    if prev_forecasts:
        prev_forecasts.end_time = now
        prev_forecasts.save()

    forecast = Forecast.objects.create(
        question=question,
        author=request.user,
        start_time=now,
        end_time=None,
        continuous_cdf=data.get("continuous_cdf", None),
        probability_yes=data.get("probability_yes", None),
        probability_yes_per_category=data.get("probability_yes_per_category", None),
        distribution_components=None,
    )
    forecast.save()

    return Response({}, status=status.HTTP_201_CREATED)
