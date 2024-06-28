from django.urls import path

from . import views

urlpatterns = [
    path("comments", views.comments_list_api_view, name="comment-list"),
    path("comments/<int:pk>/delete", views.comment_delete_api_view, name="comment-delete"),
    path("comments/create", views.comment_create_api_view, name="comment-create"),
]
