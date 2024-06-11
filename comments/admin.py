from django.contrib import admin
from django.apps import apps

# Register your models here.
app_models = apps.get_app_config('comments').get_models()
for model in app_models:
    admin.site.register(model)
    