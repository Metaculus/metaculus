import datetime

from django.shortcuts import render
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from metac_ai_tournament.utils_openai_forecast import (
    ForecastResult,
    _get_question_last_cp,
    forecast_with_gpt,
)
from metac_question.models import Question
from metac_question.models.question import QuestionTypes


class GPTForecastView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_random_question(self):
        questions = (
            Question.objects.filter(
                type=QuestionTypes.FORECAST, possibilities__type="binary"
            )
            .exclude_private()
            .order_by("?")
        )

        for _ in range(100):
            question = questions.first()
            predictions = question.recency_weighted_community_prediction_v2.aggregation.get_active_predictions_at_time(
                timezone.now()
            )
            if predictions and question.is_open():
                return question
            questions = questions.exclude(id=question.id).order_by("?")

        raise Exception("No suitable question found")

    def _fill_cp(self, question: Question, forecasting_result: ForecastResult):
        try:
            forecasting_result["last_cp"] = _get_question_last_cp(question)
        except Exception:
            forecasting_result["last_cp"] = None
        return forecasting_result

    def _handle_gpt_forecast_request(self, request) -> ForecastResult:
        prompt = request.data.pop("prompt")
        question_id = request.data.pop("question_id")
        if question_id == "random":
            question = self._get_random_question()
        else:
            question = Question.objects.get(id=question_id)

        prompt_context = {
            "today": datetime.date.today().isoformat(),
            "title": question.title,
            "background": question.description,
            "resolution_criteria": question.resolution_criteria,
            "fine_print": question.fine_print,
        }
        forecasting_result = forecast_with_gpt(
            prompt=prompt, prompt_context=prompt_context, question=question
        )
        return self._fill_cp(question, forecasting_result)

    def post(self, request):
        try:
            forecasting_result = self._handle_gpt_forecast_request(request)
        except Exception as e:
            return Response(str(e), status=status.HTTP_400_BAD_REQUEST)
        return Response(forecasting_result, status=status.HTTP_200_OK)


def ai_benchmarking_tournament_page(request):
    if request.user.is_authenticated:
        token_qs = Token.objects.filter(user=request.user)
        if not token_qs.exists():
            token = Token.objects.create(user=request.user)
        else:
            token = token_qs.get()
    else:
        token = None
    context = {
        "METACULUS_TOKEN": token.key if token else "",
    }
    return render(request, "ai-benchmarking-tournament.html", context)


def ai_benchmarking_demo_page(request):
    if request.user.is_authenticated:
        token_qs = Token.objects.filter(user=request.user)
        if not token_qs.exists():
            token = Token.objects.create(user=request.user)
        else:
            token = token_qs.get()
    else:
        token = None
    context = {
        "METACULUS_TOKEN": token.key if token else "",
    }
    return render(request, "ai-benchmarking-demo.html", context)
