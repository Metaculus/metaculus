import logging

from http.cookies import SimpleCookie
from django.conf import settings
from django.http import JsonResponse, HttpResponse, Http404
from django.utils.deprecation import MiddlewareMixin
from django.utils.translation import activate
from rest_framework.authentication import BaseAuthentication, TokenAuthentication
from rest_framework.authtoken.models import Token

logger = logging.getLogger(__name__)


def get_authorization_cookie(request, key="auth_token"):
    auth = request.META.get("HTTP_COOKIE", b"")
    cookie = SimpleCookie()
    cookie.load(auth)
    return cookie.get(key)


class CookieAuthentication(BaseAuthentication):

    key = "auth_token"
    keyword = "Token"
    model = None

    def get_model(self):
        if self.model is not None:
            return self.model
        from rest_framework.authtoken.models import Token

        return Token

    def authenticate(self, request):
        cookie = get_authorization_cookie(request, self.key)

        if not cookie:
            return None

        auth = cookie.value.split()
        if not auth:
            return None
        token = auth[-1]

        return self.authenticate_credentials(token)

    def authenticate_credentials(self, token):
        model = self.get_model()
        try:
            token = model.objects.select_related("user").get(key=token)
        except model.DoesNotExist:
            return None

        if not token.user.is_active:
            return None

        return (token.user, token)


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
                if not CookieAuthentication().authenticate(request):
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
