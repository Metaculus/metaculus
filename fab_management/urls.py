from django.urls import path

from . import views

urlpatterns = [
    path("", views.fab_management_view, name="fab-management"),
]
