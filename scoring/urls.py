from django.urls import path

from . import views

urlpatterns = [
    path(
        "leaderboards/global/",
        views.global_leaderboard_view,
        name="global-leaderboard",
    ),
    path(
        "leaderboards/project/<int:project_id>/",
        views.project_leaderboard_view,
        name="project-leaderboard",
    ),
    path(
        "leaderboards/project/<int:project_id>/update/",
        views.update_project_leaderboard_api_view,
        name="update-project-leaderboard",
    ),
    path(
        "medals/",
        views.user_medals,
        name="user-medals",
    ),
    path(
        "medal_ranks/",
        views.user_medal_ranks,
        name="user-medal-ranks",
    ),
    path(
        "medals/contributions/",
        views.leaderboard_contributions,
        name="medal-contributions",
    ),
    path(
        "metaculus_track_record/",
        views.metaculus_track_record,
        name="metaculus-track-record",
    ),
]
