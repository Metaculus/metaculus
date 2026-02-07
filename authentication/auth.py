from django.utils import timezone
from rest_framework.authentication import TokenAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import (
    AuthenticationFailed as JWTAuthenticationFailed,
)

from .models import ApiKey


class SessionJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that:
    1. Uses SessionAccessToken for session-based revocation
    2. Checks user.auth_revoked_at for user-level token invalidation
    """

    def get_user(self, validated_token):
        """
        Override to check auth_revoked_at after loading user.
        """
        from .jwt_session import is_user_global_token_revoked

        user = super().get_user(validated_token)

        # Check user-level token revocation
        if is_user_global_token_revoked(user, validated_token.get("iat", 0)):
            raise JWTAuthenticationFailed(
                "Token has been invalidated. Please log in again.",
                code="token_invalidated",
            )

        return user


class FallbackTokenAuthentication(TokenAuthentication):
    """
    TokenAuthentication, but also accepts an Authorization header with no 'Token' prefix.
    """

    model = ApiKey

    def authenticate(self, request):
        auth = get_authorization_header(request).split()

        if not auth:
            return None

        # single part -> assume it's the raw token
        if len(auth) == 1:
            try:
                token = auth[0].decode()
            except UnicodeError:
                msg = "Invalid token header. Token string should not contain invalid characters."
                raise AuthenticationFailed(msg)

            return self.authenticate_credentials(token)

        return super().authenticate(request)

    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)
        ApiKey.objects.filter(key=key).update(last_used_at=timezone.now())

        return user, token
