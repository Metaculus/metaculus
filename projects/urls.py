from django.urls import path

from . import views

urlpatterns = [
    path("projects/topics", views.topics_list_api_view),
    path("projects/categories", views.categories_list_api_view),
    path("projects/tournaments", views.tournaments_list_api_view),
    path("projects/tournaments/<str:slug>", views.tournament_by_slug_api_view),
    path("projects/tags", views.tags_list_api_view),
    path(
        "projects/<int:project_id>/leaderboard",
        views.project_leaderboard,
        name="project-leaderboard",
    ),
    path(
        "projects/<int:project_id>/members",
        views.project_members_api_view,
        name="project-members",
    ),
    path(
        "projects/<int:project_id>/members/invite",
        views.project_members_invite_api_view,
        name="project-members-invite",
    ),
    path(
        "projects/<int:project_id>/members/<int:user_id>",
        views.project_members_manage_api_view,
        name="project-members-manage",
    ),
]
