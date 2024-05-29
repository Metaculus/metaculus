from django.conf import settings
from django.utils.module_loading import import_string
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_social_auth.views import SocialTokenOnlyAuthView
from social_core.backends.oauth import BaseOAuth2

from utils.frontend import build_frontend_social_auth_redirect


@api_view(["GET"])
@permission_classes([AllowAny])
def social_providers_api_view(request):
    providers = [import_string(x) for x in settings.AUTHENTICATION_BACKENDS]
    response = []

    for cls in providers:
        # Select only social auth backends
        if not issubclass(cls, BaseOAuth2):
            continue

        backend = cls(
            redirect_uri=build_frontend_social_auth_redirect(cls.name), strategy=None
        )

        response.append(
            {
                "name": backend.name,
                "auth_url": backend.auth_url(),
            }
        )

    return Response(response)


class SocialCodeAuth(SocialTokenOnlyAuthView):
    def post(self, request, provider: str, *args, **kwargs):
        # TODO: migrate social relations

        request.data.setdefault(
            "redirect_uri", build_frontend_social_auth_redirect(provider)
        )

        return super().post(request, provider, *args, **kwargs)
