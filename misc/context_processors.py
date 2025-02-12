from django.conf import settings


def common_context(request):
    return {
        "FRONTEND_BASE_URL": settings.FRONTEND_BASE_URL,
        "IS_SCREENSHOT_SERVICE_ENABLED": bool(settings.SCREENSHOT_SERVICE_API_KEY),
    }
