from django.urls import path

from .views import common, social

urlpatterns = [
    path("auth/login/token", common.login_api_view),
    path("auth/signup", common.signup_api_view),
    path("auth/signup/resend", common.resend_activation_link_api_view),
    path("auth/signup/activate", common.signup_activate_api_view),
    # Social auth
    path("auth/social", social.social_providers_api_view),
    path("auth/social/<str:provider>/", social.SocialCodeAuth.as_view()),
]
