from django.urls import path
from rest_framework.authtoken import views as authtoken_views

from . import views

urlpatterns = [
    path("auth/token", authtoken_views.obtain_auth_token),
    path("auth/signup/", views.signup_api_view),
    path("auth/signup/activate", views.signup_activate_api_view),
]
