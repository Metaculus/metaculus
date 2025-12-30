from django.urls import path

from . import views

urlpatterns = [
    path("users/", views.users_list_api_view, name="users-list"),
    path("users/me/", views.current_user_api_view, name="user-me"),
    path("users/<int:pk>/", views.user_profile_api_view, name="user-profile"),
    path(
        "users/<int:pk>/mark-as-spam/",
        views.mark_as_spam_user_api_view,
        name="user-mark-as-spam",
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
        "users/me/email_me_my_data/",
        views.email_me_my_data_api_view,
        name="user-email-me-my-data",
    ),
    path(
        "users/me/email/confirm/",
        views.email_change_confirm_api_view,
        name="user-change-email-confirm",
    ),
    path(
        "users/me/register_campaign/",
        views.register_campaign,
        name="user-register-campaign",
    ),
    # Bots management
    path(
        "users/me/bots/",
        views.my_bots_api_view,
        name="my-bots-list",
    ),
    path(
        "users/me/bots/create/",
        views.create_bot_api_view,
        name="create-bot",
    ),
    path(
        "users/me/bots/<int:pk>/update/",
        views.update_bot_profile_api_view,
        name="update-bot",
    ),
    path(
        "users/me/bots/<int:pk>/token/",
        views.bot_token_api_view,
        name="reveal-bot-token",
    ),
]
