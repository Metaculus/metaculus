from django.urls import path

from . import views

urlpatterns = [
    path("projects/topics", views.topics_list_api_view),
    path("projects/categories", views.categories_list_api_view),
    path("projects/tournaments", views.tournaments_list_api_view),
]
