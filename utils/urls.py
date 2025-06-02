from django.urls import path

from utils import views

urlpatterns = [
    path(
        "aggregation_explorer/",
        views.aggregation_explorer_api_view,
        name="aggregation_explorer",
    ),
    path(
        "data/email/",
        views.email_data_view,
        name="email_data",
    ),
    path(
        "data/download/",
        views.download_data_view,
        name="download_data",
    ),
]
