from django.conf import settings


def common_context(request):
    return {
        "PUBLIC_APP_URL": settings.PUBLIC_APP_URL,
        "IS_SCREENSHOT_SERVICE_ENABLED": bool(settings.SCREENSHOT_SERVICE_API_KEY),
    }
