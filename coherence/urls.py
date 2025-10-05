from django.urls import path

from . import views

urlpatterns = [
    path(
        "coherence/links/create/",
        views.create_link_api_view,
        name="coherence-create-link",
    ),
    path(
        "coherence/links/<int:pk>/",
        views.get_links_for_question_api_view,
        name="get-links-for-question",
    ),
    path(
        "coherence/aggregate-links/<int:pk>/",
        views.get_aggregate_links_for_question_api_view,
        name="get-aggregate-links-for-question",
    ),
    path(
        "coherence/links/<int:pk>/delete/",
        views.delete_link_api_view,
        name="delete-link",
    ),
]
