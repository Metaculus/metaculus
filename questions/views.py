from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from questions.models import Forecast, Question
from questions.serializers import QuestionSerializer, QuestionWriteSerializer
from utils.the_math.community_prediction import compute_binary_cp


def get_forecasts_for_question(question: Question):
    try:
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
    except:
        return None

@api_view(["GET"])
@permission_classes([AllowAny])
def question_list(request):
    questions = Question.objects.all()
    search_query = request.query_params.get("search", None)
    ordering = request.query_params.get("ordering", None)
    with_forecasts = request.query_params.get("with_forecasts", None) == "true"

    if search_query:
        questions = questions.filter(title__icontains=search_query) | questions.filter(
            author__username__icontains=search_query
        )
    
    questions.order_by(request.query_params["order"])

    if ordering:
        questions = questions.order_by(ordering)

    questions = questions[0:100]

    question_data = []
    for q in questions:
        question_data.append(QuestionSerializer(q).data)
        if with_forecasts:
            question_data[-1]["forecasts"] = get_forecasts_for_question(q)

    return Response(question_data)


@api_view(["GET"])
@permission_classes([AllowAny])
def question_detail(request: Request, pk):
    print(request, pk)
    question = get_object_or_404(Question, pk=pk)
    forecasts_data = get_forecasts_for_question(question)
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
