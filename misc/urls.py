from django.urls import path, include

from . import views

urlpatterns = [
    path("healthcheck/", views.health_check),
    path("contact-form/", views.contact_api_view),
    path("get-bulletins/", views.get_bulletins),
    path("cancel-bulletin/<int:pk>/", views.cancel_bulletin),
    path(
        "itn-articles/<int:pk>/remove/",
        views.remove_article_api_view,
        name="itn-article-remove",
    ),
    path("select2/", include("django_select2.urls")),
]
