import pytest
from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from authentication.services.common import check_password_reset
from tests.unit.test_users.factories import factory_user
from users.services.common import change_user_password
from users.services.email_change import confirm_email_change, make_email_change_token


class TestPasswordResetToken:
    """Tests for password reset token generation and validation."""

    def test_successful_password_reset(self):
        """Password reset succeeds with valid token."""
        user = factory_user(is_active=True)
        user.set_password("old_password")
        user.save()

        token = default_token_generator.make_token(user)

        # Validate token
        validated_user = check_password_reset(user.id, token)
        assert validated_user.id == user.id

        # Change password
        change_user_password(user, "new_password123!")

        user.refresh_from_db()
        assert user.check_password("new_password123!")

    def test_invalid_token(self):
        """Malformed token is rejected."""
        user = factory_user(is_active=True)

        with pytest.raises(ValidationError) as exc_info:
            check_password_reset(user.id, "invalid_token")
        assert "expired or invalid" in str(exc_info.value)

    def test_inactive_user(self):
        """Token for inactive user is rejected."""
        user = factory_user(is_active=False)
        token = default_token_generator.make_token(user)

        with pytest.raises(ValidationError) as exc_info:
            check_password_reset(user.id, token)
        assert "expired or invalid" in str(exc_info.value)


class TestMultipleTokenInvalidation:
    """Tests for multiple tokens where first use invalidates others."""

    def test_two_password_reset_tokens_first_invalidates_second(self):
        """Using first password reset token invalidates the second."""
        user = factory_user(is_active=True)
        user.set_password("old_password")
        user.save()

        # Generate two tokens
        token1 = default_token_generator.make_token(user)
        token2 = default_token_generator.make_token(user)

        # Validate first token
        check_password_reset(user.id, token1)

        # Change password using first token
        change_user_password(user, "new_password123!")
        user.refresh_from_db()

        # Second token should be invalid (password changed)
        with pytest.raises(ValidationError) as exc_info:
            check_password_reset(user.id, token2)
        assert "expired or invalid" in str(exc_info.value)


class TestCrossInvalidation:
    """Tests for cross-invalidation between password and email changes."""

    def test_email_change_invalidates_password_reset_token(self):
        """Changing email invalidates pending password reset tokens."""
        user = factory_user(is_active=True)
        user.set_password("password")
        user.save()

        password_token = default_token_generator.make_token(user)

        confirm_email_change(user, make_email_change_token(user, "new@example.com"))
        user.refresh_from_db()

        with pytest.raises(ValidationError) as exc_info:
            check_password_reset(user.id, password_token)
        assert "expired or invalid" in str(exc_info.value)

    def test_login_invalidates_password_reset_token(self):
        """Logging in invalidates pending password reset tokens."""
        user = factory_user(is_active=True)
        user.set_password("password")
        user.last_login = None
        user.save()

        # Generate password reset token
        password_token = default_token_generator.make_token(user)

        # Simulate login (updates last_login)
        user.last_login = timezone.now()
        user.save()

        # Password reset token should be invalid (last_login changed)
        with pytest.raises(ValidationError) as exc_info:
            check_password_reset(user.id, password_token)
        assert "expired or invalid" in str(exc_info.value)
