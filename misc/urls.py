from django.urls import path

from . import views

urlpatterns = [
    path("contact-form", views.contact_api_view),
    path(
        "itn-articles/<int:pk>/remove",
        views.remove_article_api_view,
        name="itn-article-remove",
    ),
]
