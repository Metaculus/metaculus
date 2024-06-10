from django.urls import path

from migrator.services.migrate_forecasts import create_forecast

urlpatterns = [
    path("forecasts/create/", create_forecast, name="create-forecast"),
]
