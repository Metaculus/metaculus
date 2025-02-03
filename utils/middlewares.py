import os
import logging

from django.conf import settings
from django.http import JsonResponse
from django.utils.translation import activate
from django.urls import reverse
from django.shortcuts import redirect

from users.models import User

logger = logging.getLogger(__name__)


class LocaleOverrideMiddleware:
    # We store the original content in fields corresponding to the ORIGINAL_LANGUAGE_CODE
    # code, but this is not an officially supported language by Django, so its builtin
    # locale middleware will default to english for any non-supported languages. We want to
    # bypass that, and activate the ORIGINAL_LANGUAGE_CODE when that's
    # what the client requests, or when the client doesn't set the Accept-Language header
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        original_lang_code = settings.ORIGINAL_LANGUAGE_CODE
        if request.headers.get("Accept-Language", None) in [original_lang_code, None]:
            activate(original_lang_code)
        response = self.get_response(request)
        return response


class PrivateSiteMiddleware:

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if os.getenv("PRIVATE_SITE_MODE", "false").lower() == "true":

            # 1) Always allow the user to submmit a password
            if request.path == reverse("private-site-password-submit"):
                return self.get_response(request)

            # 2) Check if the user is already a real logged-in user
            # Unsure why request.user is always Anonymous as this is the last middleware
            token = request.headers.get("Authorization")
            if token:
                try:
                    user = User.objects.get(auth_token=token.split(" ")[1])
                    request.user = user
                    return self.get_response(request)
                except User.DoesNotExist:
                    pass

            # 3) Check if the user has the "private-site-token" session/cookie
            private_site_token = request.headers.get("private-site-token")
            if not private_site_token:
                return JsonResponse(
                    {"detail": "Not authorized to access this site"}, status=401
                )
            if private_site_token != os.getenv("PRIVATE_SITE_TOKEN"):
                return JsonResponse(
                    {"detail": "Private Site Token is invalid"}, status=401
                )

        return self.get_response(request)


def middleware_alpha_access_check(get_response):
    # One-time configuration and initialization.

    def middleware(request):
        # Code to be executed for each request before
        # the view (and later middleware) are called.
        if (
            not request.path.startswith("/admin/")
            and not request.path.startswith("/static/")
            and settings.ALPHA_ACCESS_TOKEN
            and settings.ALPHA_ACCESS_TOKEN != request.headers.get("x-alpha-auth-token")
        ):
            return JsonResponse(
                {"detail": "Not authorized to use Alpha environment"}, status=401
            )

        response = get_response(request)

        # Code to be executed for each request/response after
        # the view is called.

        return response

    return middleware
