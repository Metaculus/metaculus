from django.urls import path

from . import views

urlpatterns = [
    path(
        "leaderboards/global/",
        views.global_leaderboard,
        name="global-leaderboard",
    ),
    path(
        "leaderboards/project/<int:project_id>/",
        views.project_leaderboard,
        name="project-leaderboard",
    ),
    path(
        "medals/",
        views.user_medals,
        name="user-medals",
    ),
    path(
        "medals/contributions/",
        views.medal_contributions,
        name="medal-contributions",
    ),
    path(
        "metaculus_track_record",
        views.metaculus_track_record,
        name="metaculus-track-record",
    ),
]
