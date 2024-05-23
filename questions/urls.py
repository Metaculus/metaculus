from django.urls import path
from .views import (
    question_list,
    question_detail,
    create_question,
    update_question,
    delete_question,
)

urlpatterns = [
    path("list/", question_list, name="question-list"),
    path("<int:pk>/", question_detail, name="question-detail"),
    path("create/", create_question, name="create-question"),
    path("<int:pk>/update/", update_question, name="update-question"),
    path("<int:pk>/delete/", delete_question, name="delete-question"),
]
