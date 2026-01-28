import pytest
from django.core.cache import cache
from django.utils import timezone
from freezegun import freeze_time
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from authentication.jwt_session import (
    SessionRefreshToken,
    is_token_revoked,
    refresh_tokens_with_grace_period,
    revoke_session,
    revoke_all_user_tokens,
    get_session_enforce_at,
    _get_whitelist_key,
    _get_grace_key,
)
from authentication.services import get_tokens_for_user
from tests.unit.test_users.factories import factory_user


@pytest.fixture(autouse=True)
def clear_cache():
    """Clear cache before each test."""
    cache.clear()
    yield
    cache.clear()


class TestSessionTokenBasics:
    """Basic token creation and structure tests."""

    def test_token_includes_session_id(self):
        user = factory_user()
        refresh = SessionRefreshToken.for_user(user)
        access = refresh.access_token

        assert "session_id" in refresh
        assert len(refresh["session_id"]) == 36  # UUID format
        assert access["session_id"] == refresh["session_id"]

    def test_each_login_creates_unique_session(self):
        user = factory_user()
        tokens1 = get_tokens_for_user(user)
        tokens2 = get_tokens_for_user(user)

        refresh1 = SessionRefreshToken(tokens1["refresh"])
        refresh2 = SessionRefreshToken(tokens2["refresh"])

        assert refresh1["session_id"] != refresh2["session_id"]


class TestLogoutRevocation:
    """Tests for logout (immediate revocation)."""

    def test_logout_immediately_revokes_all_tokens(self):
        user = factory_user()
        refresh = SessionRefreshToken.for_user(user)
        access = refresh.access_token
        session_id = refresh["session_id"]

        assert is_token_revoked(refresh) is False
        assert is_token_revoked(access) is False

        revoke_session(session_id)

        assert is_token_revoked(refresh) is True
        assert is_token_revoked(access) is True
        assert get_session_enforce_at(session_id) == 0

    def test_logout_prevents_token_refresh(self):
        user = factory_user()
        refresh = SessionRefreshToken.for_user(user)

        revoke_session(refresh["session_id"])

        with pytest.raises(InvalidToken, match="revoked"):
            refresh_tokens_with_grace_period(str(refresh))

    def test_access_token_verify_raises_after_logout(self):
        user = factory_user()
        refresh = SessionRefreshToken.for_user(user)
        access = refresh.access_token

        revoke_session(refresh["session_id"])

        with pytest.raises(TokenError, match="revoked"):
            access.verify()


class TestTokenRefreshFlow:
    """Integration tests for the token refresh flow with grace period."""

    def test_full_refresh_lifecycle(self):
        """
        Test the complete token refresh lifecycle:
        1. Login -> get tokens A
        2. Refresh A -> get tokens B (A whitelisted for 60s)
        3. During grace period: A refresh still works (returns cached B)
        4. After grace period: A is rejected, B works
        5. Refresh B -> get tokens C
        """
        user = factory_user()

        # Step 1: Login - get initial tokens (T=0)
        with freeze_time("2024-01-01 12:00:00"):
            tokens_a = get_tokens_for_user(user)
            refresh_a_str = tokens_a["refresh"]
            refresh_a = SessionRefreshToken(refresh_a_str)
            session_id = refresh_a["session_id"]

            assert is_token_revoked(refresh_a) is False

        # Step 2: Refresh token A -> get token B (T=10s)
        with freeze_time("2024-01-01 12:00:10"):
            result_b = refresh_tokens_with_grace_period(refresh_a_str)
            refresh_b_str = result_b["refresh"]
            refresh_b = SessionRefreshToken(refresh_b_str)

            # A is whitelisted, so still valid
            assert is_token_revoked(refresh_a) is False
            # B is new (iat >= enforce_at), so valid
            assert is_token_revoked(refresh_b) is False

        # Step 3: Within grace period (T=40s) - A still works
        with freeze_time("2024-01-01 12:00:40"):
            assert is_token_revoked(refresh_a) is False

            # Refresh with A returns cached B (deduplication)
            result_cached = refresh_tokens_with_grace_period(refresh_a_str)
            assert result_cached == result_b

        # Step 4: After grace period (T=80s) - A is rejected
        with freeze_time("2024-01-01 12:01:20"):
            # Simulate whitelist expiry (cache TTL doesn't respect freeze_time)
            cache.delete(_get_whitelist_key(session_id, refresh_a["iat"]))
            cache.delete(_get_grace_key(session_id))

            # A's whitelist expired
            assert is_token_revoked(refresh_a) is True

            # B still works (iat >= enforce_at)
            assert is_token_revoked(refresh_b) is False

            # Refresh with A fails
            with pytest.raises(InvalidToken, match="revoked"):
                refresh_tokens_with_grace_period(refresh_a_str)

        # Step 5: Refresh B -> get C (T=90s)
        with freeze_time("2024-01-01 12:01:30"):
            result_c = refresh_tokens_with_grace_period(refresh_b_str)
            refresh_c = SessionRefreshToken(result_c["refresh"])

            assert is_token_revoked(refresh_c) is False
            assert refresh_c["session_id"] == session_id  # Same session

    def test_old_token_cannot_hijack_new_token_from_cache(self):
        """
        Edge case: Old token A should not get new token C from cache.

        Flow:
        1. Token A refreshed -> Token B (A whitelisted)
        2. Wait 70s (whitelist + cache expire)
        3. Token A refresh -> ERROR (not cached result)
        4. Token B refresh -> Token C
        5. Token A refresh -> ERROR (not Token C from cache)
        """
        user = factory_user()

        # Get initial tokens (T=0)
        with freeze_time("2024-01-01 12:00:00"):
            tokens_a = get_tokens_for_user(user)
            refresh_a_str = tokens_a["refresh"]

        # Step 1: Refresh A -> B (T=10s)
        with freeze_time("2024-01-01 12:00:10"):
            result_b = refresh_tokens_with_grace_period(refresh_a_str)
            refresh_b_str = result_b["refresh"]

        # Step 2-3: After grace period, A should be rejected (T=80s)
        with freeze_time("2024-01-01 12:01:20"):
            refresh_a = SessionRefreshToken(refresh_a_str)
            session_id = refresh_a["session_id"]

            # Simulate whitelist/cache expiry
            cache.delete(_get_whitelist_key(session_id, refresh_a["iat"]))
            cache.delete(_get_grace_key(session_id))

            with pytest.raises(InvalidToken, match="revoked"):
                refresh_tokens_with_grace_period(refresh_a_str)

            # Step 4: Token B refresh -> Token C
            result_c = refresh_tokens_with_grace_period(refresh_b_str)
            assert result_c["refresh"] != result_b["refresh"]

        # Step 5: A should STILL fail, not get C from cache (T=85s)
        with freeze_time("2024-01-01 12:01:25"):
            with pytest.raises(InvalidToken, match="revoked"):
                refresh_tokens_with_grace_period(refresh_a_str)

    def test_concurrent_refresh_returns_same_tokens(self):
        """Multiple rapid refresh requests return the same tokens (deduplication)."""
        user = factory_user()

        with freeze_time("2024-01-01 12:00:00"):
            tokens = get_tokens_for_user(user)

        with freeze_time("2024-01-01 12:00:10"):
            result1 = refresh_tokens_with_grace_period(tokens["refresh"])
            result2 = refresh_tokens_with_grace_period(tokens["refresh"])
            result3 = refresh_tokens_with_grace_period(tokens["refresh"])

            assert result1 == result2 == result3

    def test_refresh_with_invalid_token_fails(self):
        """Invalid tokens are rejected."""
        with pytest.raises(InvalidToken):
            refresh_tokens_with_grace_period("invalid-token")

        # Token without session_id
        from rest_framework_simplejwt.tokens import RefreshToken

        user = factory_user()
        plain_refresh = RefreshToken.for_user(user)

        with pytest.raises(InvalidToken, match="session_id"):
            refresh_tokens_with_grace_period(str(plain_refresh))


class TestUserLevelRevocation:
    """Tests for user-level token revocation (auth_revoked_at)."""

    def test_revoke_all_user_tokens_sets_auth_revoked_at(self):
        """revoke_all_user_tokens sets auth_revoked_at to now."""
        user = factory_user()
        assert user.auth_revoked_at is None

        revoke_all_user_tokens(user)
        user.refresh_from_db()

        assert user.auth_revoked_at is not None
        # Should be recent (within last minute)
        assert (timezone.now() - user.auth_revoked_at).total_seconds() < 60

    def test_old_tokens_rejected_after_user_revocation(self):
        """Tokens issued before auth_revoked_at are rejected on refresh."""
        user = factory_user()

        # Get tokens before revocation
        with freeze_time("2024-01-01 12:00:00"):
            tokens = get_tokens_for_user(user)
            refresh_str = tokens["refresh"]

        # Revoke all tokens
        with freeze_time("2024-01-01 12:00:10"):
            revoke_all_user_tokens(user)

        # Old token should be rejected
        with freeze_time("2024-01-01 12:00:20"):
            with pytest.raises(InvalidToken, match="invalidated"):
                refresh_tokens_with_grace_period(refresh_str)

    def test_new_tokens_work_after_user_revocation(self):
        """Tokens issued after auth_revoked_at work normally."""
        user = factory_user()

        # Revoke all tokens
        with freeze_time("2024-01-01 12:00:00"):
            revoke_all_user_tokens(user)

        # Get new tokens after revocation
        with freeze_time("2024-01-01 12:00:10"):
            tokens = get_tokens_for_user(user)
            refresh_str = tokens["refresh"]

        # New tokens should work
        with freeze_time("2024-01-01 12:00:20"):
            result = refresh_tokens_with_grace_period(refresh_str)
            assert "access" in result
            assert "refresh" in result

    def test_user_revocation_affects_all_sessions(self):
        """auth_revoked_at revokes tokens from ALL sessions."""
        user = factory_user()

        # Create multiple sessions
        with freeze_time("2024-01-01 12:00:00"):
            session1 = get_tokens_for_user(user)
            session2 = get_tokens_for_user(user)
            session3 = get_tokens_for_user(user)

        # Revoke all
        with freeze_time("2024-01-01 12:00:10"):
            revoke_all_user_tokens(user)

        # All sessions should be rejected
        with freeze_time("2024-01-01 12:00:20"):
            with pytest.raises(InvalidToken, match="invalidated"):
                refresh_tokens_with_grace_period(session1["refresh"])
            with pytest.raises(InvalidToken, match="invalidated"):
                refresh_tokens_with_grace_period(session2["refresh"])
            with pytest.raises(InvalidToken, match="invalidated"):
                refresh_tokens_with_grace_period(session3["refresh"])
