from django.urls import path

from . import views

urlpatterns = [
    path("coherence/create-link/", views.create_link_api_view, name="coherence-create-link")
]