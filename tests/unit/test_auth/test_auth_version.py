from datetime import timedelta

import pytest
from django.core.cache import cache
from django.utils import timezone
from freezegun import freeze_time
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken

from authentication.auth import SessionJWTAuthentication
from authentication.jwt_session import (
    SessionAccessToken,
    SessionRefreshToken,
    get_auth_version,
    refresh_tokens_with_grace_period,
    revoke_all_user_tokens,
)
from tests.unit.test_users.factories import factory_user
from users.models import User


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


def authenticate(refresh):
    return SessionJWTAuthentication().get_user(refresh.access_token)


@pytest.mark.parametrize("previously_revoked", [False, True])
@freeze_time("2026-01-01 12:00:00.000001")
def test_same_second_revocation_rejects_old_tokens(previously_revoked):
    user = factory_user(is_active=True)
    if previously_revoked:
        revoke_all_user_tokens(user)
    old = SessionRefreshToken.for_user(user)
    # Populate the refresh grace cache: it must not bypass global revocation.
    refresh_tokens_with_grace_period(str(old))

    with freeze_time("2026-01-01 12:00:00.000020"):
        revoke_all_user_tokens(user)
        user.refresh_from_db()
        new = SessionRefreshToken.for_user(user)
        assert old["iat"] == new["iat"]
        assert old["auth_version"] != new["auth_version"]
        with pytest.raises(AuthenticationFailed, match="invalidated"):
            authenticate(old)
        with pytest.raises(InvalidToken, match="invalidated"):
            refresh_tokens_with_grace_period(str(old))
        assert authenticate(new).pk == user.pk
        result = refresh_tokens_with_grace_period(str(new))
        assert SessionAccessToken(result["access"])["auth_version"] == get_auth_version(
            user
        )
        assert SessionRefreshToken(result["refresh"])[
            "auth_version"
        ] == get_auth_version(user)


@pytest.mark.parametrize(
    "account_revoked,token_version,accepted",
    [
        (False, None, True),
        (False, "old-version", False),
        (True, None, False),
        (True, "old-version", False),
        (True, "matching", True),
    ],
)
def test_explicit_version_must_match_account(account_revoked, token_version, accepted):
    user = factory_user(is_active=True)
    if account_revoked:
        revoke_all_user_tokens(user)
        user.refresh_from_db()
    refresh = SessionRefreshToken.for_user(user)
    refresh["auth_version"] = (
        get_auth_version(user) if token_version == "matching" else token_version
    )
    if accepted:
        assert authenticate(refresh).pk == user.pk
        result = refresh_tokens_with_grace_period(str(refresh))
        assert (
            SessionRefreshToken(result["refresh"])["auth_version"]
            == refresh["auth_version"]
        )
    else:
        with pytest.raises(AuthenticationFailed, match="invalidated"):
            authenticate(refresh)
        with pytest.raises(InvalidToken, match="invalidated"):
            refresh_tokens_with_grace_period(str(refresh))


@pytest.mark.parametrize("revocation_age", [None, 0, 1, 10])
@freeze_time("2026-01-01 12:00:00")
def test_legacy_tokens_keep_cutoff_and_gain_version_on_refresh(revocation_age):
    user = factory_user(is_active=True)
    refresh = SessionRefreshToken.for_user(user)
    del refresh["auth_version"]
    access = refresh.access_token

    with freeze_time(timezone.now() + timedelta(seconds=revocation_age or 0)):
        if revocation_age is not None:
            revoke_all_user_tokens(user)
        if revocation_age is not None and revocation_age > 0:
            with pytest.raises(AuthenticationFailed, match="invalidated"):
                SessionJWTAuthentication().get_user(access)
            with pytest.raises(InvalidToken, match="invalidated"):
                refresh_tokens_with_grace_period(str(refresh))
        else:
            assert SessionJWTAuthentication().get_user(access).pk == user.pk
            result = refresh_tokens_with_grace_period(str(refresh))
            upgraded_access = SessionAccessToken(result["access"])
            upgraded_refresh = SessionRefreshToken(result["refresh"])
            assert upgraded_access["auth_version"] == get_auth_version(user)
            assert upgraded_refresh["auth_version"] == get_auth_version(user)
            assert refresh_tokens_with_grace_period(str(refresh)) == result

            revoke_all_user_tokens(user)
            with pytest.raises(AuthenticationFailed, match="invalidated"):
                SessionJWTAuthentication().get_user(upgraded_access)
            with pytest.raises(InvalidToken, match="invalidated"):
                refresh_tokens_with_grace_period(result["refresh"])


@freeze_time("2026-01-01 12:00:00.123456")
def test_repeated_revocation_changes_version_even_with_stale_user_and_same_clock():
    user = factory_user(is_active=True)
    stale_user = User.objects.get(pk=user.pk)
    revoke_all_user_tokens(user)
    user.refresh_from_db()
    assert user.auth_revoked_at == timezone.now()
    old = SessionRefreshToken.for_user(user)
    revoke_all_user_tokens(stale_user)
    user.refresh_from_db()
    assert user.auth_revoked_at == timezone.now() + timedelta(microseconds=1)
    assert get_auth_version(user) == get_auth_version(stale_user)
    with pytest.raises(AuthenticationFailed, match="invalidated"):
        authenticate(old)


def test_in_flight_issuance_keeps_validated_user_version():
    user = factory_user(is_active=True)
    stale_user = User.objects.get(pk=user.pk)
    revoke_all_user_tokens(user)
    refresh = SessionRefreshToken.for_user(stale_user)
    with pytest.raises(AuthenticationFailed, match="invalidated"):
        authenticate(refresh)
    with pytest.raises(InvalidToken, match="invalidated"):
        refresh_tokens_with_grace_period(str(refresh))
