from django.conf import settings
from rest_framework.request import Request

from authentication.auth import FallbackTokenAuthentication


def get_request_ip(request: Request):
    return (
        # Header coming from Cloudflare
        request.headers.get("CF-Connecting-IP")
        # Or coming from Nginx
        or request.headers.get("X-Real-IP")
    )


def is_internal_request(request: Request) -> bool:
    """
    Identify whether the request originated from our FE Next.js server (internal)
    or arrived via the public route as a direct API consumer (external).

    Note: this is not a security primitive. It assumes the
    BE is only publicly reachable via Cloudflare on the public domain
    """

    authenticator = getattr(request, "successful_authenticator", None)

    # Hard external signal: ApiKey auth is never used by the FE.
    if isinstance(authenticator, FallbackTokenAuthentication):
        return False

    host = (request.get_host() or "").split(":")[0].lower()

    return host != settings.APP_DOMAIN
