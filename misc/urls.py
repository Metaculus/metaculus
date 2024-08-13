from django.urls import path

from . import views

urlpatterns = [
    path("contact-form", views.contact_api_view),
]
