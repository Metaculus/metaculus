from django.urls import path

from questions import views

urlpatterns = [
    path(
        "questions/forecast/",
        views.bulk_create_forecasts_api_view,
        name="create-forecast",
    ),
    path(
        "questions/<int:pk>/resolve/", views.resolve_api_view, name="question-resolve"
    ),
]
old_api = [
    path(
        "questions/<int:pk>/predict/",
        views.create_binary_forecast_oldapi_view,
        name="oldapi-create-forecast",
    )
]
