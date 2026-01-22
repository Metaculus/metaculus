import json
import time
import uuid

from django.conf import settings
from django.core.cache import cache
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from users.models import User

# Grace period in seconds - old tokens still work during this window after refresh
REFRESH_GRACE_PERIOD = 60

# Redis key prefixes
GRACE_KEY_PREFIX = "jwt:grace:"
REVOKED_KEY_PREFIX = "jwt:revoked:"
WHITELIST_KEY_PREFIX = "jwt:whitelist:"


def _get_grace_key(session_id: str) -> str:
    """Grace period cache key - ensures one set of tokens per session."""
    return f"{GRACE_KEY_PREFIX}{session_id}"


def _get_revoked_key(session_id: str) -> str:
    return f"{REVOKED_KEY_PREFIX}{session_id}"


def _get_whitelist_key(session_id: str, iat: int) -> str:
    """Whitelist key for a specific token (by session + iat)."""
    return f"{WHITELIST_KEY_PREFIX}{session_id}:{iat}"


def whitelist_token(session_id: str, iat: int) -> None:
    """Whitelist a token for the grace period."""
    key = _get_whitelist_key(session_id, iat)
    cache.set(key, 1, timeout=REFRESH_GRACE_PERIOD)


def is_token_whitelisted(session_id: str, iat: int) -> bool:
    """Check if a token is whitelisted."""
    key = _get_whitelist_key(session_id, iat)
    return cache.get(key) is not None


def get_session_enforce_at(session_id: str) -> int | None:
    """Get the enforcement timestamp for session revocation."""
    key = _get_revoked_key(session_id)
    value = cache.get(key)
    return int(value) if value is not None else None


def set_session_enforce_at(session_id: str, enforce_at: int) -> None:
    """
    Set the revocation timestamp for a session.
    Tokens with iat < enforce_at will be revoked (unless whitelisted).
    """
    key = _get_revoked_key(session_id)
    ttl = int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())
    cache.set(key, enforce_at, timeout=ttl)


def is_token_revoked(token) -> bool:
    """
    Check if a token has been revoked based on session timestamp.
    Works with both RefreshToken and AccessToken.

    A token is revoked if:
    - enforce_at=0 (logout), OR
    - token_iat < enforce_at AND token is not whitelisted
    """
    session_id = token.get("session_id")
    if not session_id:
        return False

    enforce_at = get_session_enforce_at(session_id)
    if enforce_at is None:
        return False

    # Special case: enforce_at=0 means immediate revocation (logout)
    if enforce_at == 0:
        return True

    token_iat = token.get("iat", 0)

    # Token is new enough - not revoked
    if token_iat >= enforce_at:
        return False

    # Token is old - check whitelist
    if is_token_whitelisted(session_id, token_iat):
        return False

    return True


class SessionAccessToken(AccessToken):
    """
    AccessToken with session-based revocation check.
    Used for authenticating API requests.
    """

    def verify(self):
        super().verify()
        if is_token_revoked(self):
            raise TokenError("Token has been revoked")


class SessionRefreshToken(RefreshToken):
    """
    RefreshToken with session-based revocation.

    - Automatically adds session_id claim on creation
    - Checks session revocation during verification
    - Uses SessionAccessToken for access token generation
    """

    access_token_class = SessionAccessToken

    @classmethod
    def for_user(cls, user):
        token = super().for_user(user)
        token["session_id"] = str(uuid.uuid4())
        return token

    def verify(self):
        super().verify()
        if is_token_revoked(self):
            raise TokenError("Token has been revoked")


def refresh_tokens_with_grace_period(refresh_token_str: str) -> dict:
    """
    Refresh tokens with grace period deduplication and invalidation check.

    Returns:
        dict with 'access' and 'refresh' token strings

    Raises:
        InvalidToken if the token is revoked or invalid
        AuthenticationFailed if user is no longer active
    """
    try:
        refresh = SessionRefreshToken(refresh_token_str, verify=False)
    except Exception:
        # Do not expose internal exception details to the client
        raise InvalidToken("Invalid token")

    session_id = refresh.get("session_id")
    if not session_id:
        raise InvalidToken("Token missing session_id claim")

    old_token_iat = refresh.get("iat")
    grace_key = _get_grace_key(session_id)

    # Check if token is revoked before anything else
    if is_token_revoked(refresh):
        raise InvalidToken("Token has been revoked")

    # Check grace period cache - only reached if token is valid
    cached = cache.get(grace_key)
    if cached:
        return json.loads(cached)

    # Verify token (includes signature, expiry check - revocation already checked)
    try:
        refresh.verify()
    except TokenError as e:
        raise InvalidToken(str(e))

    # Generate new tokens with lock to handle race conditions
    lock_key = f"{grace_key}:lock"

    with cache.lock(lock_key, timeout=5, blocking_timeout=1):
        # Re-check revocation in case it changed while waiting for lock
        if is_token_revoked(refresh):
            raise InvalidToken("Token has been revoked")

        cached = cache.get(grace_key)
        if cached:
            return json.loads(cached)

        # Check user is still active
        user_id = refresh.get(api_settings.USER_ID_CLAIM)
        if user_id:
            user = User.objects.get(pk=user_id)
            if not api_settings.USER_AUTHENTICATION_RULE(user):
                raise AuthenticationFailed(
                    "No active account found for the given token."
                )

        data = {"access": str(refresh.access_token)}

        if api_settings.ROTATE_REFRESH_TOKENS:
            refresh.set_jti()
            refresh.set_exp()
            refresh.set_iat()
            refresh["session_id"] = session_id
            data["refresh"] = str(refresh)

        cache.set(grace_key, json.dumps(data), timeout=REFRESH_GRACE_PERIOD)

        # Whitelist the old token for the grace period
        if old_token_iat:
            whitelist_token(session_id, old_token_iat)

        # Set enforce_at to now - tokens with iat < now are revoked (unless whitelisted)
        set_session_enforce_at(session_id, int(time.time()))

        return data


def revoke_session(session_id: str) -> None:
    """
    Immediately revoke all tokens for a session (no grace period).
    Call this on logout.
    """
    set_session_enforce_at(session_id, 0)
