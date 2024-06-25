from django.urls import path

from . import views

urlpatterns = [
    path("posts", views.posts_list_api_view, name="post-list"),
    path("posts/upload-image", views.upload_image_api_view, name="post-upload-image"),
    path("posts/<int:pk>/", views.post_detail, name="post-detail"),
    path("posts/<int:pk>/vote", views.post_vote_api_view, name="question-detail"),
    path("posts/create/", views.post_create_api_view, name="post-create"),
    path("posts/<int:pk>/update/", views.post_update_api_view, name="update-question"),
    path("posts/<int:pk>/delete/", views.post_delete_api_view, name="delete-question"),
]
