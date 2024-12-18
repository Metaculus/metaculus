from django.urls import path

from . import views

urlpatterns = [
    path("projects/topics/", views.topics_list_api_view),
    path("projects/news-categories/", views.news_categories_list_api_view),
    path("projects/categories/", views.categories_list_api_view),
    path("projects/tournaments/", views.tournaments_list_api_view),
    path("projects/site_main/", views.site_main_view),
    path("projects/tournaments/<str:slug>/", views.tournament_by_slug_api_view),
    path("projects/tags/", views.tags_list_api_view),
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
        "projects/<int:project_id>/download-data/",
        views.download_data,
        name="download-data",
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
