from datetime import timedelta
from unittest.mock import Mock

import pytest
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from authentication.social_pipeline import create_user as social_create_user
from users.models import User


@pytest.mark.django_db
class TestUsernameSetAt:
    def test_create_user_stamps_by_default(self):
        before = timezone.now()
        user = User.objects.create_user(username="chooser", email="c@example.com")

        assert user.username_set_at is not None
        assert user.username_set_at >= before

    def test_update_username_refreshes_stamp(self, user1: User):
        user1.username_set_at = timezone.now() - timedelta(days=30)
        user1.save(update_fields=["username_set_at"])

        user1.update_username("renamed_user")
        user1.save()
        user1.refresh_from_db()

        assert user1.username == "renamed_user"
        assert user1.username_set_at >= timezone.now() - timedelta(seconds=5)

    def test_social_new_user_gets_null_stamp_and_email(self):
        result = social_create_user(
            Mock(), {"username": "social_new", "email": "s@example.com"}, Mock()
        )

        assert result["is_new"] is True
        assert result["user"].email == "s@example.com"
        assert result["user"].username_set_at is None

    def test_social_signup_disabled_raises(self, settings):
        settings.PUBLIC_ALLOW_SIGNUP = False

        with pytest.raises(ValidationError):
            social_create_user(
                Mock(), {"username": "blocked", "email": "b@example.com"}, Mock()
            )
