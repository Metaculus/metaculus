from django.urls import path

from . import views

urlpatterns = [
    path("comments", views.comments_list_api_view, name="comment-list"),
    path(
        "comments/<int:pk>/delete", views.comment_delete_api_view, name="comment-delete"
    ),
    path("comments/<int:pk>/edit", views.comment_edit_api_view, name="comment-edit"),
    path("comments/<int:pk>/vote", views.comment_vote_api_view, name="comment-vote"),
    path("comments/create", views.comment_create_api_view, name="comment-create"),
]
