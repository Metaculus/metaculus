from django.urls import path

from . import views


urlpatterns = [
    path(
        "coherence/links/create/",
        views.create_link_api_view,
        name="coherence-create-link",
    ),
    # TODO: this is confusing because `/links/:id` represents the question ID, not the link ID.
    #   We should improve this in the future so that the URL always refers to the actual object ID.
    #   The question layer should be explicitly defined with a `/question/` prefix.
    path(
        "coherence/links/<int:pk>/",
        views.get_links_for_question_api_view,
        name="get-links-for-question-old",
    ),
    path(
        "coherence/aggregate-links/<int:pk>/",
        views.get_aggregate_links_for_question_api_view,
        name="get-aggregate-links-for-question-old",
    ),
    path(
        "coherence/aggregate-links/<int:pk>/votes/",
        views.aggregate_links_vote_view,
        name="aggregate-links-votes",
    ),
    path(
        "coherence/links/<int:pk>/delete/",
        views.delete_link_api_view,
        name="delete-link",
    ),
    path(
        "coherence/links/<int:pk>/needs-update",
        views.get_questions_requiring_update,
        name="needs-update",
    ),
    # Question-level links
    path(
        "coherence/question/<int:pk>/links/",
        views.get_links_for_question_api_view,
        name="get-links-for-question",
    ),
    path(
        "coherence/question/<int:pk>/aggregate-links/",
        views.get_aggregate_links_for_question_api_view,
        name="get-aggregate-links-for-question",
    ),
]
