import logging

from django.conf import settings
from django.http import JsonResponse, HttpResponse, Http404
from django.utils.deprecation import MiddlewareMixin
from django.utils.translation import activate

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


class AuthenticationRequiredMiddleware(MiddlewareMixin):

    def process_request(self, request):
        if settings.AUTHENTICATION_REQUIRED:
            # Always allow the user to log in or sign up
            if any(
                [
                    request.path.startswith("/admin/"),
                    request.path.startswith("/api/auth/"),
                    request.path.startswith("/accounts/signup/"),
                    request.path.startswith("/static/"),
                ]
            ):
                return self.get_response(request)

            # Check if the user is already a real logged-in user
            if request.user.is_authenticated:
                return self.get_response(request)
            # # Unsure why request.user is always Anonymous as this is the last middleware
            # token = request.headers.get("Authorization", "").split(" ")[-1]
            # if token:
            #     user = User.objects.filter(auth_token=token).first()
            #     if user:
            #         return self.get_response(request)
            raise Http404()

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


class HealthCheckMiddleware(MiddlewareMixin):
    """
    Health check middleware to avoid host header validation
    """

    def process_request(self, request):
        if request.META["PATH_INFO"] == "/api/healthcheck/":
            return HttpResponse("ok")
