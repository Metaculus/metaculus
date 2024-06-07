from django.urls import path

from migrator.services.migrate_forecasts import create_forecast

from .views import (
    question_detail,
    create_question,
    update_question,
    delete_question,
    questions_list_api_view,
    question_vote_api_view,
)

urlpatterns = [
    path("questions", questions_list_api_view, name="question-list"),
    path("questions/<int:pk>/", question_detail, name="question-detail"),
    path("questions/<int:pk>/vote", question_vote_api_view, name="question-detail"),
    path("questions/create/", create_question, name="create-question"),
    path("questions/<int:pk>/update/", update_question, name="update-question"),
    path("questions/<int:pk>/delete/", delete_question, name="delete-question"),
    path("forecasts/create/", create_forecast, name="create-forecast"),
]
