from django.urls import path

from . import views

urlpatterns = [
    path("comments/", views.comments_list_api_view, name="comment-list"),
    path(
        "comments/<int:pk>/delete/", views.comment_delete_api_view, name="comment-delete"
    ),
    path("comments/<int:pk>/edit/", views.comment_edit_api_view, name="comment-edit"),
    path("comments/<int:pk>/vote/", views.comment_vote_api_view, name="comment-vote"),
    path(
        "comments/<int:pk>/toggle_cmm/",
        views.comment_toggle_cmm_view,
        name="comment-toggle-cmm",
    ),
    path(
        "comments/<int:pk>/report/", views.comment_report_api_view, name="comment-report"
    ),
    path(
        "comments/<int:pk>/toggle-pin/", views.comment_toggle_pin_view, name="comment-togle-pin"
    ),
    path("comments/create/", views.comment_create_api_view, name="comment-create"),
    path("key-factors/<int:pk>/vote/", views.key_factor_vote_view, name="key-factor-vote"),
]


old_api = [
    path("comments/", views.comment_create_oldapi_view, name="oldapi-comment-create")
]
