from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import common, social

urlpatterns = [
    path("auth/login/token/", common.login_api_view),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("auth/verify_token/", common.verify_token_api_view),
    # DEPRECATED: Legacy token migration endpoint (remove after 30 days)
    path("auth/exchange-legacy-token/", common.exchange_legacy_token_api_view),
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
]
