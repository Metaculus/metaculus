from django.urls import path

from . import views

urlpatterns = [
    path("posts", views.posts_list_api_view, name="post-list"),
    path("posts/upload-image", views.upload_image_api_view, name="post-upload-image"),
    path("posts/<int:pk>/", views.post_detail, name="post-detail"),
    path("posts/<int:pk>/boost", views.activity_boost_api_view, name="post-boost"),
    path(
        "posts/<int:pk>/related-articles/",
        views.post_related_articles_api_view,
        name="post-related-articles",
    ),
    path(
        "posts/<int:pk>/subscriptions",
        views.post_subscriptions_create,
        name="post-subscriptions",
    ),
    path("posts/<int:pk>/read", views.post_view_event_api_view, name="post-mark-read"),
    path("posts/<int:pk>/vote", views.post_vote_api_view, name="question-detail"),
    path("posts/create/", views.post_create_api_view, name="post-create"),
    path("posts/<int:pk>/update/", views.post_update_api_view, name="update-question"),
    path("posts/<int:pk>/delete/", views.post_delete_api_view, name="delete-question"),
]

old_api = [
    path("questions/", views.posts_list_oldapi_view, name="oldapi-post-list"),
    path("questions/<int:pk>/", views.post_detail_oldapi_view, name="oldapi-post-list"),
]
