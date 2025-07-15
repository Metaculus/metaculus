from django.urls import path

from . import views

urlpatterns = [
    path(
        "coherence/create-link/",
        views.create_link_api_view,
        name="coherence-create-link",
    ),
    path(
        "coherence/get-links/<int:pk>",
        views.get_links_for_question_api_view,
        name="get-links-for-question",
    ),
    path("coherence/delete/<int:pk>", views.delete_link_api_view, name="delete-link"),
]
