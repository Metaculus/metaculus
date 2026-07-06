from unittest.mock import patch

import pytest
from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from authentication.services import check_password_reset
from tests.unit.test_users.factories import factory_user
from users.services.common import (
    EmailChangeTokenGenerator,
    change_email_from_token,
    change_user_password,
    generate_email_change_token,
)


class TestEmailChangeToken:
    """Tests for email change token generation and validation."""

    def test_successful_email_change(self):
        """Email change succeeds with valid token."""
        user = factory_user(is_active=True)
        user.set_password("old_password")
        user.save()

        new_email = "new_email@example.com"
        token = generate_email_change_token(user, new_email)

        change_email_from_token(user, token)

        user.refresh_from_db()
        assert user.email == new_email

    def test_expired_token(self):
        """Expired token is rejected."""
        user = factory_user(is_active=True)
        user.set_password("password")
        user.save()

        token = generate_email_change_token(user, "new@example.com")

        # Simulate token expiration by mocking unsign with max_age check
        with patch.object(
            EmailChangeTokenGenerator,
            "check_token",
            return_value=None,
        ):
            with pytest.raises(ValidationError) as exc_info:
                change_email_from_token(user, token)
            assert "Invalid or expired token" in str(exc_info.value)

    def test_invalid_token(self):
        """Malformed token is rejected."""
        user = factory_user(is_active=True)

        with pytest.raises(ValidationError) as exc_info:
            change_email_from_token(user, "invalid_token_format")
        assert "Invalid or expired token" in str(exc_info.value)

    def test_user_mismatch(self):
        """Token for different user is rejected."""
        user1 = factory_user(is_active=True)
        user1.set_password("password")
        user1.save()

        user2 = factory_user(is_active=True)
        user2.set_password("password")
        user2.save()

        token = generate_email_change_token(user1, "new@example.com")

        # Try to use user1's token for user2
        with pytest.raises(ValidationError) as exc_info:
            change_email_from_token(user2, token)
        assert "Invalid or expired token" in str(exc_info.value)

    def test_email_already_in_use_at_generation(self):
        """Cannot generate token if email is already taken."""
        factory_user(email="taken@example.com", is_active=True)
        user2 = factory_user(is_active=True)

        with pytest.raises(ValidationError) as exc_info:
            generate_email_change_token(user2, "taken@example.com")
        assert "already in use" in str(exc_info.value)

    def test_email_taken_between_generation_and_use(self):
        """Token rejected if email becomes taken after generation."""
        user1 = factory_user(is_active=True)
        user1.set_password("password")
        user1.save()

        user2 = factory_user(is_active=True)

        token = generate_email_change_token(user1, "contested@example.com")

        # Another user takes the email
        user2.email = "contested@example.com"
        user2.save()

        with pytest.raises(ValidationError) as exc_info:
            change_email_from_token(user1, token)
        assert "already in use" in str(exc_info.value)


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

    def test_two_email_change_tokens_first_invalidates_second(self):
        """Using first email change token invalidates the second."""
        user = factory_user(is_active=True)
        user.set_password("password")
        user.save()

        # Generate two tokens
        token1 = generate_email_change_token(user, "email1@example.com")
        token2 = generate_email_change_token(user, "email2@example.com")

        # Use first token
        change_email_from_token(user, token1)
        user.refresh_from_db()
        assert user.email == "email1@example.com"

        # Second token should be invalid (email changed, so hash doesn't match)
        with pytest.raises(ValidationError) as exc_info:
            change_email_from_token(user, token2)
        assert "Invalid or expired token" in str(exc_info.value)

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

    def test_password_change_invalidates_email_change_token(self):
        """Changing password invalidates pending email change tokens."""
        user = factory_user(is_active=True)
        user.set_password("old_password")
        user.save()

        # Generate email change token
        email_token = generate_email_change_token(user, "new@example.com")

        # Change password
        change_user_password(user, "new_password123!")
        user.refresh_from_db()

        # Email change token should be invalid
        with pytest.raises(ValidationError) as exc_info:
            change_email_from_token(user, email_token)
        assert "Invalid or expired token" in str(exc_info.value)

    def test_email_change_invalidates_password_reset_token(self):
        """Changing email invalidates pending password reset tokens."""
        user = factory_user(is_active=True)
        user.set_password("password")
        user.save()

        # Generate password reset token
        password_token = default_token_generator.make_token(user)

        # Generate and use email change token
        email_token = generate_email_change_token(user, "new@example.com")
        change_email_from_token(user, email_token)
        user.refresh_from_db()

        # Password reset token should be invalid (email changed)
        with pytest.raises(ValidationError) as exc_info:
            check_password_reset(user.id, password_token)
        assert "expired or invalid" in str(exc_info.value)

    def test_login_invalidates_email_change_token(self):
        """Logging in invalidates pending email change tokens."""
        user = factory_user(is_active=True)
        user.set_password("password")
        user.last_login = None
        user.save()

        # Generate email change token
        email_token = generate_email_change_token(user, "new@example.com")

        # Simulate login (updates last_login)
        user.last_login = timezone.now()
        user.save()

        # Email change token should be invalid (last_login changed)
        with pytest.raises(ValidationError) as exc_info:
            change_email_from_token(user, email_token)
        assert "Invalid or expired token" in str(exc_info.value)

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
