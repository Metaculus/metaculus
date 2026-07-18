from django.urls import path, include

from . import views

urlpatterns = [
    path("ad-tiles/", views.ad_tiles_api_view, name="ad-tiles"),
    path(
        "ad-tiles/<str:dismiss_id>/dismiss/",
        views.dismiss_ad_tile_api_view,
        name="ad-tiles-dismiss",
    ),
    path("sidebar/", views.sidebar_api_view),
    path("contact-form/", views.contact_api_view),
    path("contact-form/services/", views.contact_service_api_view),
    path("get-bulletins/", views.get_bulletins),
    path("get-dismissed-bulletin-ids/", views.get_dismissed_bulletin_ids),
    path("get-site-stats/", views.get_site_stats),
    path("cancel-bulletin/<int:pk>/", views.cancel_bulletin),
    path(
        "itn-articles/<int:pk>/remove/",
        views.remove_article_api_view,
        name="itn-article-remove",
    ),
    path("select2/", include("django_select2.urls")),
    path(
        "get-data-access-status/",
        views.get_data_access_status_api_view,
        name="get-data-access-status",
    ),
]
