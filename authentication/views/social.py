from django.conf import settings
from django.utils.module_loading import import_string
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_social_auth.views import SocialTokenOnlyAuthView
from social_core.backends.oauth import BaseOAuth2

from authentication.services import get_tokens_for_user
from users.models import User


@api_view(["GET"])
@permission_classes([AllowAny])
def social_providers_api_view(request):
    redirect_uri = (
        serializers.CharField()
        .run_validation(request.query_params.get("redirect_uri"))
        .rstrip("/")
    )
    providers = [import_string(x) for x in settings.AUTHENTICATION_BACKENDS]
    response = []

    for cls in providers:
        # Select only social auth backends
        if not issubclass(cls, BaseOAuth2):
            continue

        backend = cls(redirect_uri=f"{redirect_uri}/{cls.name}", strategy=None)

        # Check whether backend is configured with secrets
        if not all(backend.get_key_and_secret()):
            continue

        response.append(
            {
                "name": backend.name,
                "auth_url": backend.auth_url(),
            }
        )

    return Response(response)


class SocialCodeAuth(SocialTokenOnlyAuthView):
    class TokenSerializer(serializers.Serializer):
        tokens = serializers.SerializerMethodField()

        def get_tokens(self, obj: User):
            return get_tokens_for_user(obj)

    serializer_class = TokenSerializer
    authentication_classes = (JWTAuthentication,)

    def respond_error(self, error):
        response = super().respond_error(error)

        return Response({"detail": response.data}, status=status.HTTP_400_BAD_REQUEST)
