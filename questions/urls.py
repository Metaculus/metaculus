from django.urls import path

from questions import views

urlpatterns = [
    path(
        "questions/forecast/",
        views.bulk_create_forecasts_api_view,
        name="create-forecast",
    ),
    path(
        "questions/withdraw/",
        views.bulk_withdraw_forecasts_api_view,
        name="create-withdraw",
    ),
    path(
        "questions/<int:pk>/", views.question_detail_api_view, name="question-details"
    ),
    path(
        "questions/<int:pk>/resolve/", views.resolve_api_view, name="question-resolve"
    ),
    path(
        "questions/<int:pk>/unresolve/",
        views.unresolve_api_view,
        name="question-unresolve",
    ),
    path(
        "questions/<int:pk>/post/",
        views.legacy_question_api_view,
        name="oldapi-get-question-post",
    ),

    # Question Link MVP Additions
    path(
        "question-links/causal/",
        views.causal_links_list_create_api_view,
        name="causal-links-list-create",
    ),
    path(
        "question-links/causal/<int:pk>/",
        views.causal_link_delete_api_view,
        name="causal-link-delete",
    ),
    path(
        "questions/<int:question_id>/causal-links/",
        views.question_causal_links_api_view,
        name="question-causal-links",
    ),
    path(
        "questions/<int:question_id>/linked-questions/",
        views.question_linked_questions_api_view,
        name="question-linked-questions",
    ),
]
old_api = [
    path(
        "questions/<int:pk>/predict/",
        views.create_binary_forecast_oldapi_view,
        name="oldapi-create-forecast",
    ),
]
