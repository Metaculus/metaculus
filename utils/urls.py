from django.urls import path

from utils import views

urlpatterns = [
    path(
        "aggregation_explorer/",
        views.aggregation_explorer_api_view,
        name="aggregation_explorer",
    ),
]
