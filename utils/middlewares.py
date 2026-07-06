import logging

from django.conf import settings
from django.http import JsonResponse, HttpResponse, Http404
from django.utils.deprecation import MiddlewareMixin
from django.utils.translation import activate
from rest_framework.request import Request as DRFRequest
from rest_framework.settings import api_settings

logger = logging.getLogger(__name__)


def authenticate_request(request):
    """
    Try each of the authentication classes until one returns a (user, auth) tuple
    """
    request = DRFRequest(request)

    for authenticator_cls in api_settings.DEFAULT_AUTHENTICATION_CLASSES:
        authenticator = authenticator_cls()
        result = authenticator.authenticate(request)

        if result:
            return result

    return None, None


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
    def process_view(self, request, view_func, view_args, view_kwargs):
        if settings.PUBLIC_AUTHENTICATION_REQUIRED:
            if any(
                [
                    request.path.startswith("/admin/"),
                    request.path.startswith("/api/auth/"),
                    request.path.startswith("/static/"),
                    # Swagger doc
                    request.path == "/api/",
                ]
            ):
                return None

            user, _ = authenticate_request(request)

            if not user:
                raise Http404()

        return None


class IsStaffQueryParamRequiredMiddleware(MiddlewareMixin):
    def process_view(self, request, view_func, view_args, view_kwargs):
        if request.GET.get("is_staff", "").lower() != "true":
            return None

        user, _ = authenticate_request(request)

        if not user:
            return JsonResponse(
                {"detail": "Authentication credentials were not provided."}, status=401
            )

        if not user.is_staff:
            return JsonResponse(
                {
                    "detail": "You do not have permission to perform this action. Remove the is_staff query param and try again."
                },
                status=403,
            )

        return None


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
