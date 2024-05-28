from django.db import models
from django.shortcuts import get_object_or_404
from django_filters import rest_framework as filters
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from questions.models import Forecast, Question
from questions.serializers import QuestionSerializer, QuestionWriteSerializer
from utils.the_math.community_prediction import compute_binary_cp


class QuestionListFilters(filters.FilterSet):
    class MyPredictionType(models.TextChoices):
        OLDEST = "oldest"
        NEWEST = "newest"
        DIVERGENCE = "divergence"

    my_predictions = filters.ChoiceFilter(
        choices=MyPredictionType.choices, method="apply_my_predictions"
    )

    # Ordering
    class OrderType(models.TextChoices):
        MOST_PREDICTIONS = "most_predictions", "Most Predictions"

    order = filters.OrderingFilter(
        choices=OrderType.choices,
        method="apply_order",
    )

    def apply_my_predictions(self, queryset, name, value):
        """
        Custom implementation of my_predictions filter
        """

        print("name: ", name)
        print("value: ", value)

        return queryset

    def apply_order(self, queryset, name, value):
        """
        Custom implementation of ordering
        """

        print("name: ", name)
        print("value: ", value)

        if any(v == self.OrderType.MOST_PREDICTIONS for v in value):
            return queryset.annotate_predictions_count().order_by("-predictions_count")

        return queryset


class QuestionsListApiView(generics.ListAPIView):
    permission_classes = [AllowAny]
    queryset = Question.objects.all().prefetch_projects()
    serializer_class = QuestionSerializer
    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = QuestionListFilters
    ordering_fields = ["username", "email"]


@api_view(["POST"])
@permission_classes([AllowAny])
def question_list(request):
    questions = Question.objects.all()
    search_query = request.query_params.get("search", None)
    ordering = request.query_params.get("ordering", None)

    if search_query:
        questions = questions.filter(title__icontains=search_query) | questions.filter(
            author__username__icontains=search_query
        )

    if ordering:
        questions = questions.order_by(ordering)

    # Prefetching related objects
    questions = questions.prefetch_projects()

    serializer = QuestionSerializer(questions, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def question_detail(request: Request, pk):
    print(request, pk)
    question = get_object_or_404(Question, pk=pk)
    forecasts = Forecast.objects.filter(question=question)
    forecast_times = [x.start_time for x in forecasts]
    forecasts_data = {
        "timestamps": [],
        "values_mean": [],
        "values_max": [],
        "values_min": [],
        "nr_forecasters": [],
    }
    for forecast_time in forecast_times:
        cp = compute_binary_cp(forecasts, forecast_time)
        forecasts_data["timestamps"].append(forecast_time.timestamp())
        forecasts_data["values_mean"].append(cp["mean"])
        forecasts_data["values_max"].append(cp["max"])
        forecasts_data["values_min"].append(cp["min"])
        forecasts_data["nr_forecasters"].append(cp["nr_forecasters"])

    serializer = QuestionSerializer(question)
    data = serializer.data
    data["forecasts"] = forecasts_data
    return Response(data)


@api_view(["POST"])
def create_question(request):
    serializer = QuestionWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    question = serializer.save(author=request.user)
    return Response(QuestionSerializer(question).data, status=status.HTTP_201_CREATED)


@api_view(["PUT"])
def update_question(request, pk):
    question = get_object_or_404(Question, pk=pk)
    if request.user != question.author:
        return Response(status=status.HTTP_403_FORBIDDEN)

    serializer = QuestionSerializer(question, data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response(serializer.data)


@api_view(["DELETE"])
def delete_question(request, pk):
    question = get_object_or_404(Question, pk=pk)
    if request.user != question.author:
        return Response(status=status.HTTP_403_FORBIDDEN)
    question.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
