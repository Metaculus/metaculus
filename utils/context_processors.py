from django.conf import settings


def common_context(request):
    return {
        "FRONTEND_BASE_URL": settings.FRONTEND_BASE_URL,
    }
