from django.urls import path

from . import views

urlpatterns = [
    path("coherence/create-link/", views.create_link_api_view, name="coherence-create-link"),
    path("coherence/get-links/<int:pk>", views.get_links_for_question, name="get-links-for-question")
]