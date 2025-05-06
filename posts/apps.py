from django.apps import AppConfig
import posthog
from django.conf import settings


class PostsConfig(AppConfig):
    name = "posts"

    def ready(self):
        if settings.PUBLIC_POSTHOG_KEY and settings.PUBLIC_POSTHOG_BASE_URL:
            print(
                "Setting up PostHog ",
                settings.PUBLIC_POSTHOG_KEY,
                settings.PUBLIC_POSTHOG_BASE_URL,
            )
            posthog.api_key = settings.PUBLIC_POSTHOG_KEY
            posthog.host = settings.PUBLIC_POSTHOG_BASE_URL
