from django.urls import path
from question_links import views

urlpatterns=[
    path("question_links/",
         views.question_link_view,
         name="question-linkw")
]