from django.urls import path

from .views import common, key_factors

urlpatterns = [
    path("comments/", common.comments_list_api_view, name="comment-list"),
    path(
        "comments/<int:pk>/delete/",
        common.comment_delete_api_view,
        name="comment-delete",
    ),
    path("comments/<int:pk>/edit/", common.comment_edit_api_view, name="comment-edit"),
    path("comments/<int:pk>/vote/", common.comment_vote_api_view, name="comment-vote"),
    path(
        "comments/<int:pk>/toggle_cmm/",
        common.comment_toggle_cmm_view,
        name="comment-toggle-cmm",
    ),
    path(
        "comments/<int:pk>/report/",
        common.comment_report_api_view,
        name="comment-report",
    ),
    path(
        "comments/<int:pk>/toggle-pin/",
        common.comment_toggle_pin_view,
        name="comment-togle-pin",
    ),
    path("comments/create/", common.comment_create_api_view, name="comment-create"),
    path(
        "comments/<int:pk>/set-excluded-from-week-top/",
        common.comment_set_excluded_from_week_top_view,
        name="comment-set-excluded-from-week-top",
    ),
    path(
        "comments/comments-of-week/",
        common.comments_of_week_view,
        name="comments-of-week",
    ),
    # Key Factors layer
    path(
        "key-factors/<int:pk>/vote/",
        key_factors.key_factor_vote_view,
        name="key-factor-vote",
    ),
    path(
        "key-factors/<int:pk>/delete/",
        key_factors.key_factor_delete,
        name="key-factor-delete",
    ),
    path(
        "key-factors/<int:pk>/report/",
        key_factors.key_factor_report_api_view,
        name="key-factor-report",
    ),
    path(
        "comments/<int:pk>/add-key-factors/",
        key_factors.comment_add_key_factors_view,
        name="comment-add-key-factors",
    ),
    path(
        "comments/<int:pk>/suggested-key-factors/",
        key_factors.comment_suggested_key_factors_view,
        name="comment-suggested-key-factors",
    ),
]

old_api = [
    path("comments/", common.comment_create_oldapi_view, name="oldapi-comment-create")
]
