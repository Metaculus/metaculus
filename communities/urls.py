from django.urls import path

from . import views

urlpatterns = [
    path(
        "projects/communities/",
        views.communities_list_api_view,
        name="communities-list",
    ),
    path(
        "projects/communities/<str:slug>",
        views.community_detail_api_view,
        name="community-detail",
    ),
    path(
        "projects/communities/<int:pk>/update",
        views.community_update_api_view,
        name="community-update",
    ),
]
