from django.urls import path

from questions.views import create_forecast_api_view

urlpatterns = [
    path(
        "questions/<int:pk>/forecast", create_forecast_api_view, name="create-forecast"
    ),
]
