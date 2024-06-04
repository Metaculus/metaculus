from django.urls import path

from . import views

urlpatterns = [
    path("users/me", views.current_user_api_view, name="user-me"),
    path("users/<int:pk>/", views.user_profile_api_view, name="user-profile"),
    path(
        "users/change-username",
        views.change_username_api_view,
        name="user-change-username",
    ),
    path("users/me/update", views.update_profile_api_view, name="user-update-profile"),
]
