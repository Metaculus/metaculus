from django.urls import path

from . import views

urlpatterns = [
    path("users/", views.users_list_api_view, name="users-list"),
    path("users/me/", views.current_user_api_view, name="user-me"),
    path("users/<int:pk>/", views.user_profile_api_view, name="user-profile"),
    path(
        "users/<int:pk>/soft-delete/",
        views.soft_delete_user_api_view,
        name="user-soft-delete",
    ),
    path(
        "users/change-username/",
        views.change_username_api_view,
        name="user-change-username",
    ),
    path("users/me/update/", views.update_profile_api_view, name="user-update-profile"),
    path(
        "users/me/password/",
        views.password_change_api_view,
        name="user-change-password",
    ),
    path("users/me/email/", views.email_change_api_view, name="user-change-email"),
    path(
        "users/me/email/confirm/",
        views.email_change_confirm_api_view,
        name="user-change-email-confirm",
    ),
]
