from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "comments"

    def ready(self):
        import comments.signals  # noqa: F401
