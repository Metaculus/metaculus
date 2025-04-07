from django.apps import apps
from django.contrib import admin
from rest_framework.authtoken.models import TokenProxy

# Register your models here.
app_models = apps.get_app_config("authentication").get_models()
for model in app_models:
    admin.site.register(model)

admin.site.unregister(TokenProxy)
