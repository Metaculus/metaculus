import datetime

import pytest
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ImproperlyConfigured
from django.utils import timezone

from utils.tokens import ScopedTokenGenerator


class AlphaTokenGenerator(ScopedTokenGenerator):
    key_salt = "tests.AlphaTokenGenerator"


class BetaTokenGenerator(ScopedTokenGenerator):
    key_salt = "tests.BetaTokenGenerator"
    token_timeout = 3600


class TestScopedTokenGenerator:
    def test_roundtrip(self, user1):
        generator = AlphaTokenGenerator()
        token = generator.make_token(user1)

        assert generator.check_token(user1, token)

    def test_missing_key_salt_raises(self):
        with pytest.raises(ImproperlyConfigured):
            ScopedTokenGenerator()

        class ForgotSalt(ScopedTokenGenerator):
            pass

        with pytest.raises(ImproperlyConfigured):
            ForgotSalt()

    def test_salt_scoping(self, user1):
        alpha, beta = AlphaTokenGenerator(), BetaTokenGenerator()
        alpha_token = alpha.make_token(user1)
        default_token = default_token_generator.make_token(user1)

        assert not beta.check_token(user1, alpha_token)
        assert not alpha.check_token(user1, default_token)
        assert not default_token_generator.check_token(user1, alpha_token)

    def test_invalidated_by_sign_in(self, user1):
        generator = AlphaTokenGenerator()
        token = generator.make_token(user1)

        user1.last_login = timezone.now()
        user1.save(update_fields=["last_login"])

        assert not generator.check_token(user1, token)

    def test_token_timeout_enforced(self, user1, mocker):
        generator = BetaTokenGenerator()
        token = generator.make_token(user1)

        assert generator.check_token(user1, token)

        mocker.patch.object(
            BetaTokenGenerator,
            "_now",
            return_value=datetime.datetime.now() + datetime.timedelta(seconds=3700),
        )
        assert not generator.check_token(user1, token)

    def test_default_token_timeout_is_one_day(self, user1, mocker):
        generator = AlphaTokenGenerator()
        token = generator.make_token(user1)

        mocker.patch.object(
            AlphaTokenGenerator,
            "_now",
            return_value=datetime.datetime.now() + datetime.timedelta(hours=23),
        )
        assert generator.check_token(user1, token)

        mocker.patch.object(
            AlphaTokenGenerator,
            "_now",
            return_value=datetime.datetime.now() + datetime.timedelta(hours=25),
        )
        assert not generator.check_token(user1, token)

    def test_garbage_tokens(self, user1):
        generator = AlphaTokenGenerator()

        assert not generator.check_token(user1, "garbage")
        assert not generator.check_token(user1, "")
