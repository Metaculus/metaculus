from django.urls import include, path

urlpatterns = [
    path("auth/login/", include("rest_social_auth.urls_token")),
]
