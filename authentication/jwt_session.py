import json
import time
import uuid

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

# Grace period in seconds - old tokens still work during this window after refresh
REFRESH_GRACE_PERIOD = 60

# Redis key prefixes
GRACE_KEY_PREFIX = "jwt:grace:"
REVOKED_KEY_PREFIX = "jwt:revoked:"


def _get_grace_key(session_id: str) -> str:
    """Grace period cache key - ensures one set of tokens per session."""
    return f"{GRACE_KEY_PREFIX}{session_id}"


def _get_revoked_key(session_id: str) -> str:
    return f"{REVOKED_KEY_PREFIX}{session_id}"


def get_session_enforce_at(session_id: str) -> int | None:
    """Get the enforcement timestamp for session revocation."""
    key = _get_revoked_key(session_id)
    value = cache.get(key)
    return int(value) if value else None


def set_session_enforce_at(session_id: str, enforce_at: int) -> None:
    """
    Set when to start enforcing revocation for a session.
    Tokens with iat < (enforce_at - GRACE_PERIOD) will be revoked after enforce_at.
    """
    key = _get_revoked_key(session_id)
    ttl = int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())
    cache.set(key, enforce_at, timeout=ttl)


def is_token_revoked(token) -> bool:
    """
    Check if a token has been revoked based on session timestamp.
    Works with both RefreshToken and AccessToken.
    """
    session_id = token.get("session_id")
    if not session_id:
        return False

    enforce_at = get_session_enforce_at(session_id)
    if enforce_at is None:
        return False

    now = int(time.time())
    if now < enforce_at:
        return False

    token_iat = token.get("iat", 0)
    revoked_at = enforce_at - REFRESH_GRACE_PERIOD
    return token_iat < revoked_at


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
    except Exception as e:
        raise InvalidToken(str(e))

    session_id = refresh.get("session_id")
    if not session_id:
        raise InvalidToken("Token missing session_id claim")

    grace_key = _get_grace_key(session_id)

    # Check grace period cache first
    cached = cache.get(grace_key)
    if cached:
        return json.loads(cached)

    # Verify token (includes signature, expiry, revocation check)
    try:
        refresh.verify()
    except TokenError as e:
        raise InvalidToken(str(e))

    # Generate new tokens with lock to handle race conditions
    lock_key = f"{grace_key}:lock"

    with cache.lock(lock_key, timeout=5, blocking_timeout=1):
        cached = cache.get(grace_key)
        if cached:
            return json.loads(cached)

        # Check user is still active
        user_id = refresh.get(api_settings.USER_ID_CLAIM)
        if user_id:
            User = get_user_model()
            user = User.objects.get(**{api_settings.USER_ID_FIELD: user_id})
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

        # Revoke tokens with iat <= now after grace period
        set_session_enforce_at(session_id, int(time.time()) + REFRESH_GRACE_PERIOD)

        return data


def revoke_session(session_id: str) -> None:
    """
    Immediately revoke all tokens for a session (no grace period).
    Call this on logout.
    """
    set_session_enforce_at(session_id, 0)
