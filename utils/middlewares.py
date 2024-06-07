from django.conf import settings
from django.http import JsonResponse
from rest_framework.response import Response


def middleware_dev_restricted_access(get_response):
    # One-time configuration and initialization.

    def middleware(request):
        # Code to be executed for each request before
        # the view (and later middleware) are called.

        if (
            settings.DEV_ACCESS_TOKEN
            and settings.DEV_ACCESS_TOKEN != request.headers.get("x-dev-auth-token")
        ):
            return JsonResponse({"detail": "Not authorized to use Dev server"}, status=401)

        response = get_response(request)

        # Code to be executed for each request/response after
        # the view is called.

        return response

    return middleware
