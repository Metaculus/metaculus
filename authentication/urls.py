from django.urls import path

from .views import common, social

urlpatterns = [
    path("auth/login/token/", common.login_api_view),
    path("auth/logout/", common.logout_api_view),
    path("auth/refresh/", common.token_refresh_api_view, name="token_refresh"),
    path("auth/verify_token/", common.verify_token_api_view),
    path("auth/signup/", common.signup_api_view, name="auth-signup"),
    path(
        "auth/signup/simplified/",
        common.signup_simplified_api_view,
        name="auth-signup-simplified",
    ),
    path("auth/signup/resend/", common.resend_activation_link_api_view),
    path("auth/signup/activate/", common.signup_activate_api_view),
    # Social auth
    path("auth/social/", social.social_providers_api_view),
    path("auth/social/<str:provider>/", social.SocialCodeAuth.as_view()),
    # Password Reset
    path("auth/password-reset/", common.password_reset_api_view),
    path("auth/password-reset/change/", common.password_reset_confirm_api_view),
    # Invite user
    path("auth/invite/", common.invite_user_api_view),
    # API Key
    path("auth/api-key/", common.api_key_api_view),
    path("auth/api-key/rotate/", common.api_key_rotate_api_view),
]
