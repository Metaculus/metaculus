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

# Grace period for refresh token deduplication (seconds)
REFRESH_GRACE_PERIOD = 60

# Redis key prefixes
GRACE_KEY_PREFIX = "jwt:grace:"
REVOKED_KEY_PREFIX = "jwt:revoked:"


def _get_grace_key(token_jti: str) -> str:
    """Grace period key is based on old token's JTI for deduplication."""
    return f"{GRACE_KEY_PREFIX}{token_jti}"


def _get_revoked_key(session_id: str) -> str:
    return f"{REVOKED_KEY_PREFIX}{session_id}"


def get_session_revoked_timestamp(session_id: str) -> int | None:
    """Get the timestamp before which all tokens for this session are invalid."""
    key = _get_revoked_key(session_id)
    value = cache.get(key)
    return int(value) if value else None


def set_session_revoked_timestamp(session_id: str, timestamp: int) -> None:
    """Set the timestamp before which all tokens for this session are invalid."""
    key = _get_revoked_key(session_id)
    # TTL should match refresh token lifetime
    ttl = int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())
    cache.set(key, timestamp, timeout=ttl)


def is_token_revoked(token) -> bool:
    """
    Check if a token has been revoked based on session timestamp.
    Works with both RefreshToken and AccessToken.
    """
    session_id = token.get("session_id")
    if not session_id:
        return False

    revoked_before = get_session_revoked_timestamp(session_id)
    if revoked_before is None:
        return False

    token_iat = token.get("iat", 0)
    # Strictly less than - tokens issued at exactly revoked_before are valid
    # This handles the case where new tokens are issued in the same second
    return token_iat < revoked_before


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
    RefreshToken with session-based revocation instead of SimpleJWT's blacklist.

    - Automatically adds session_id claim on creation
    - Checks session revocation timestamp during verification
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

    Follows SimpleJWT's TokenRefreshSerializer logic with additions:
    1. Grace period - deduplicate concurrent refresh requests
    2. Session-based invalidation - reject tokens issued before revocation timestamp

    Returns:
        dict with 'access' and 'refresh' token strings

    Raises:
        InvalidToken if the token is revoked or invalid
        AuthenticationFailed if user is no longer active
    """
    # Decode the refresh token without verification first
    # We need to check grace period cache before rejecting revoked tokens
    try:
        refresh = SessionRefreshToken(refresh_token_str, verify=False)
    except Exception as e:
        raise InvalidToken(str(e))

    session_id = refresh.get("session_id")
    if not session_id:
        raise InvalidToken("Token missing session_id claim")

    token_jti = refresh.get("jti")
    if not token_jti:
        raise InvalidToken("Token missing jti claim")

    old_iat = refresh.get("iat", 0)

    # Grace key is based on old token's JTI - same old token = same cache
    grace_key = _get_grace_key(token_jti)

    # Try to get cached tokens from grace period FIRST
    # This allows concurrent requests with the same old token to succeed
    cached = cache.get(grace_key)
    if cached:
        return json.loads(cached)

    # Not in cache - now verify the token (includes signature, expiry, revocation)
    try:
        refresh.verify()
    except TokenError as e:
        raise InvalidToken(str(e))

    # No cached tokens - generate new ones
    # Use lock to handle race conditions (blocking_timeout waits up to 1s)
    lock_key = f"{grace_key}:lock"

    with cache.lock(lock_key, timeout=5, blocking_timeout=1):
        # Double-check cache after acquiring lock
        cached = cache.get(grace_key)
        if cached:
            return json.loads(cached)

        # Check user is still active (matches SimpleJWT behavior)
        user_id = refresh.get(api_settings.USER_ID_CLAIM)
        if user_id:
            User = get_user_model()
            user = User.objects.get(**{api_settings.USER_ID_FIELD: user_id})
            if not api_settings.USER_AUTHENTICATION_RULE(user):
                raise AuthenticationFailed(
                    "No active account found for the given token."
                )

        # Generate access token from current refresh token
        data = {"access": str(refresh.access_token)}

        # Handle token rotation (matches SimpleJWT ROTATE_REFRESH_TOKENS behavior)
        if api_settings.ROTATE_REFRESH_TOKENS:
            refresh.set_jti()
            refresh.set_exp()
            refresh.set_iat()

            # Preserve session_id across rotation
            refresh["session_id"] = session_id

            data["refresh"] = str(refresh)

        # Cache the new tokens for grace period (keyed by old token's JTI)
        cache.set(grace_key, json.dumps(data), timeout=REFRESH_GRACE_PERIOD)

        # Invalidate all tokens issued before this refresh (replaces blacklist)
        set_session_revoked_timestamp(session_id, old_iat)

        return data


def revoke_session(session_id: str) -> None:
    """
    Revoke all tokens for a session by setting revocation timestamp to now + 1.
    The +1 ensures tokens issued in the same second are also revoked.
    Call this on logout.
    """
    set_session_revoked_timestamp(session_id, int(time.time()) + 1)
