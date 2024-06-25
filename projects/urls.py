from django.urls import path

from . import views

urlpatterns = [
    path("projects/topics", views.topics_list_api_view),
    path("projects/categories", views.categories_list_api_view),
    path("projects/tournaments", views.tournaments_list_api_view),
    path("projects/tournaments/<str:slug>", views.tournament_by_slug_api_view),
    path("projects/tags", views.tags_list_api_view),
    path(
        "projects/<int:project_id>/invite",
        views.project_invite_api_view,
        name="project-invite",
    ),
]
