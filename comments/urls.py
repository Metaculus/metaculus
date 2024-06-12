from django.urls import path

from . import views

urlpatterns = [
    path("comments", views.comments_list_api_view, name="comment-list"),
]
