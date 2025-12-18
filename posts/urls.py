from django.urls import path

from . import views

urlpatterns = [
    path("posts/", views.posts_list_api_view, name="post-list"),
    path(
        "posts/homepage/", views.posts_list_homeage_api_view, name="post-list-homepage"
    ),
    path("posts/upload-image/", views.upload_image_api_view, name="post-upload-image"),
    path("posts/<int:pk>/", views.post_detail, name="post-detail"),
    path("posts/<int:pk>/boost/", views.activity_boost_api_view, name="post-boost"),
    path("posts/<int:pk>/repost/", views.repost_api_view, name="post-repost"),
    path("posts/<int:pk>/approve/", views.post_approve_api_view, name="post-approve"),
    path(
        "posts/<int:pk>/send-back-to-review/",
        views.post_send_back_to_review_api_view,
        name="post-send-back-to-review",
    ),
    path(
        "posts/<int:pk>/submit-for-review/",
        views.post_submit_for_review_api_view,
        name="post-submit-for-review",
    ),
    path(
        "posts/<int:pk>/reject/",
        views.post_reject_api_view,
        name="post-reject",
    ),
    path(
        "posts/<int:pk>/make-draft/",
        views.post_make_draft_api_view,
        name="post-make-draft",
    ),
    path(
        "posts/<int:pk>/similar-posts/",
        views.post_similar_posts_api_view,
        name="post-similar-posts",
    ),
    path(
        "posts/<int:pk>/related-articles/",
        views.post_related_articles_api_view,
        name="post-related-articles",
    ),
    path(
        "posts/<int:pk>/subscriptions/",
        views.post_subscriptions_create,
        name="post-subscriptions",
    ),
    path(
        "posts/<int:pk>/private-note/",
        views.post_private_note_api_view,
        name="post-private-note",
    ),
    path(
        "posts/private-notes/",
        views.private_notes_list_api_view,
        name="private-notes-list",
    ),
    path(
        "posts/subscriptions/",
        views.all_post_subscriptions,
        name="all-post-subscriptions",
    ),
    path("posts/<int:pk>/read/", views.post_view_event_api_view, name="post-mark-read"),
    path("posts/<int:pk>/vote/", views.post_vote_api_view, name="post-vote"),
    path("posts/create/", views.post_create_api_view, name="post-create"),
    path("posts/<int:pk>/update/", views.post_update_api_view, name="post-update"),
    path("posts/<int:pk>/delete/", views.post_delete_api_view, name="post-delete"),
    path(
        "posts/<int:pk>/remove_from_project/",
        views.remove_from_project,
        name="remove-post-from-project",
    ),
    path(
        "posts/<int:post_id>/email-data/",
        views.email_data,
        name="posts-email-data",
    ),
    path(
        "posts/<int:post_id>/download-data/",
        views.download_data,
        name="posts-download-data",
    ),
    path("posts/random/", views.random_post_id, name="random-post"),
]

old_api = [
    path("questions/", views.posts_list_oldapi_view, name="oldapi-post-list"),
    path("questions/<int:pk>/", views.post_detail_oldapi_view, name="oldapi-post-list"),
]
