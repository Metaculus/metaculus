from django.urls import path

from . import views

urlpatterns = [
    path("projects/topics/", views.topics_list_api_view),
    path("projects/news-categories/", views.news_categories_list_api_view),
    path("projects/categories/", views.categories_list_api_view),
    path("projects/homepage_categories/", views.homepage_categories_list_api_view),
    path("projects/leaderboard-tags/", views.leaderboard_tags_list_api_view),
    path("projects/tournaments/", views.tournaments_list_api_view),
    path("projects/minibenches/", views.minibench_tournaments_api_view),
    path("projects/site_main/", views.site_main_view),
    path("projects/tournaments/<str:slug>/", views.tournament_by_slug_api_view),
    path(
        "projects/tournaments/<str:slug>/forecast-flow-posts/",
        views.tournament_forecast_flow_posts_api_view,
    ),
    path("projects/create/", views.project_create_api_view, name="project-create"),
    path(
        "projects/<int:project_id>/delete/",
        views.project_delete_api_view,
        name="project-delete",
    ),
    path(
        "projects/<int:project_id>/update/",
        views.project_update_api_view,
        name="project-update",
    ),
    path(
        "projects/<int:project_id>/members/",
        views.project_members_api_view,
        name="project-members",
    ),
    path(
        "projects/<int:project_id>/members/invite/",
        views.project_members_invite_api_view,
        name="project-members-invite",
    ),
    path(
        "projects/<int:project_id>/members/<int:user_id>/",
        views.project_members_manage_api_view,
        name="project-members-manage",
    ),
    path(
        "projects/<int:pk>/subscribe/",
        views.project_subscribe_api_view,
        name="project-subscribe",
    ),
    path(
        "projects/<int:pk>/unsubscribe/",
        views.project_unsubscribe_api_view,
        name="project-unsubscribe",
    ),
    path(
        "projects/<int:project_id>/email-data/",
        views.email_data,
        name="projects-email-data",
    ),
    path(
        "projects/<int:project_id>/download-data/",
        views.download_data,
        name="projects-download-data",
    ),
    # Communities
    path(
        "projects/communities/",
        views.communities_list_api_view,
        name="communities-list",
    ),
    path(
        "projects/communities/<str:slug>/",
        views.community_detail_api_view,
        name="community-detail",
    ),
    path(
        "projects/communities/<int:pk>/update/",
        views.community_update_api_view,
        name="community-update",
    ),
]
