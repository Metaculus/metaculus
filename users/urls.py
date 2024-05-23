from django.urls import path

from . import views

urlpatterns = [
    path("users/me", views.current_user_api_view),
]
