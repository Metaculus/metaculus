from rest_framework.authentication import TokenAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed


class FallbackTokenAuthentication(TokenAuthentication):
    """
    TokenAuthentication, but also accepts an Authorization header with no 'Token' prefix.
    """

    def authenticate(self, request):
        auth = get_authorization_header(request).split()

        if not auth:
            return None

        # single part → assume it's the raw token
        if len(auth) == 1:
            try:
                token = auth[0].decode()
            except UnicodeError:
                msg = "Invalid token header. Token string should not contain invalid characters."
                raise AuthenticationFailed(msg)

            return self.authenticate_credentials(token)

        return super().authenticate(request)
