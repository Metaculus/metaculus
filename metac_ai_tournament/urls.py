from django.urls import path

from .views import (
    GPTForecastView,
    ai_benchmarking_demo_page,
    ai_benchmarking_tournament_page,
)

urlpatterns = [
    path("gpt-forecast/", GPTForecastView.as_view(), name="gpt-forecast"),
    path("ai-benchmarking-tournament/", ai_benchmarking_tournament_page),
    path("aib/", ai_benchmarking_tournament_page),
    path("ai-benchmarking-tournament/demo", ai_benchmarking_demo_page),
    path("aib/demo", ai_benchmarking_demo_page),
]
