from django.urls import path

from . import views
from .views import user_profile_api_view, change_username_api_view

urlpatterns = [
    path("users/me", views.current_user_api_view, name="user-me"),
    path("users/<int:pk>/", user_profile_api_view, name="user-profile"),
    path(
        "users/change-username", change_username_api_view, name="user-change-username"
    ),
]
