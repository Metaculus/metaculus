from django.urls import path

from .views import common

urlpatterns = [
    path("auth/login/token", common.login_api_view),
    path("auth/signup", common.signup_api_view),
    path("auth/signup/resend", common.resend_activation_link_api_view),
    path("auth/signup/activate", common.signup_activate_api_view),
]
