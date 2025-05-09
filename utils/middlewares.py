import logging

from http.cookies import SimpleCookie
from django.conf import settings
from django.http import JsonResponse, HttpResponse, Http404
from django.utils.deprecation import MiddlewareMixin
from django.utils.translation import activate, gettext_lazy as _
from rest_framework.authentication import TokenAuthentication
from rest_framework import exceptions

logger = logging.getLogger(__name__)


def get_authorization_cookie_value(request, key="auth_token"):
    auth = request.META.get("HTTP_COOKIE", "")
    cookie = SimpleCookie()
    cookie.load(auth)
    c = cookie.get(key)
    return c.value if c else ""


class CookieAuthentication(TokenAuthentication):

    keyword = "Token"  # optional
    model = None

    def authenticate(self, request):
        auth = get_authorization_cookie_value(request, "auth_token").split()

        if not auth or (
            len(auth) == 2 and auth[0].lower() != self.keyword.lower().encode()
        ):
            return None
        elif len(auth) > 2:
            msg = _("Invalid token header. Token string should not contain spaces.")
            raise exceptions.AuthenticationFailed(msg)

        return self.authenticate_credentials(auth[-1])


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

            if not TokenAuthentication().authenticate(request):
                raise Http404()
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
