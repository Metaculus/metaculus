from django.utils import timezone
from rest_framework.authentication import TokenAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed

from authentication.models import ApiKey


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
