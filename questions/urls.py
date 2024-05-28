from django.urls import path

from .views import (
    question_detail,
    create_question,
    update_question,
    delete_question,
    QuestionsListApiView,
)

urlpatterns = [
    path("questions/list/", QuestionsListApiView.as_view(), name="question-list"),
    path("questions/<int:pk>/", question_detail, name="question-detail"),
    path("questions/create/", create_question, name="create-question"),
    path("questions/<int:pk>/update/", update_question, name="update-question"),
    path("questions/<int:pk>/delete/", delete_question, name="delete-question"),
]
