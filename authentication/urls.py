from django.urls import path

from . import views

urlpatterns = [
    path("auth/login/token", views.login_api_view),
    path("auth/signup", views.signup_api_view),
    path("auth/signup/activate", views.signup_activate_api_view),
]
