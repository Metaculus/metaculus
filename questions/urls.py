from django.urls import path

from .views import (
    question_detail,
    create_question,
    update_question,
    delete_question,
    QuestionsListApiView,
)

urlpatterns = [
    path("list/", QuestionsListApiView.as_view(), name="question-list"),
    path("<int:pk>/", question_detail, name="question-detail"),
    path("create/", create_question, name="create-question"),
    path("<int:pk>/update/", update_question, name="update-question"),
    path("<int:pk>/delete/", delete_question, name="delete-question"),
]
