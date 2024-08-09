from django.urls import path

from questions import views

urlpatterns = [
    path(
        "questions/<int:pk>/forecast/",
        views.create_forecast_api_view,
        name="create-forecast",
    ),
    path(
        "questions/<int:pk>/resolve/", views.resolve_api_view, name="question-resolve"
    ),
    path("questions/<int:pk>/close/", views.close_api_view, name="question-close"),
]
old_api = [
    path(
        "questions/<int:pk>/predict/",
        views.create_binary_forecast_oldapi_view,
        name="oldapi-create-forecast",
    )
]
