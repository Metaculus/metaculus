import logging

import pytest
from django.contrib.auth.models import AnonymousUser
from django.http import Http404
from rest_framework.exceptions import PermissionDenied

from users.models import User
from utils.acting_user import resolve_acting_user


class TestResolveActingUser:
    def test_no_target_returns_requester(self, user1):
        assert resolve_acting_user(user1) == user1

    def test_anonymous_without_target_returns_requester(self):
        anon = AnonymousUser()

        assert resolve_acting_user(anon) is anon

    def test_any_user_can_target_self(self, user1):
        assert resolve_acting_user(user1, user1.id) == user1
        assert resolve_acting_user(user1, user1.username) == user1

    def test_any_user_cannot_target_other_account(self, user1, user2, metac_bot):
        for target in (user2, metac_bot):
            with pytest.raises(PermissionDenied):
                resolve_acting_user(user1, target.id)

    def test_value_forms(self, user1):
        # Ids may come as ints or digit strings; anything else is a username
        assert resolve_acting_user(user1, str(user1.id)) == user1
        assert resolve_acting_user(user1, f" {user1.username} ") == user1
        assert resolve_acting_user(user1, "") == user1

    def test_superuser_can_target_any_account(self, user_admin, user1):
        assert resolve_acting_user(user_admin, user1.id) == user1
        assert resolve_acting_user(user_admin, user1.username) == user1

    def test_superuser_can_target_inactive_account(self, user_admin, metac_bot):
        metac_bot.is_active = False
        metac_bot.save()

        assert resolve_acting_user(user_admin, metac_bot.id) == metac_bot

    def test_superuser_missing_target_is_404(self, user_admin):
        with pytest.raises(Http404):
            resolve_acting_user(user_admin, 999999)

        with pytest.raises(Http404):
            resolve_acting_user(user_admin, "does_not_exist")

    def test_runner_can_target_metac_bot(self, metac_bot_runner, metac_bot):
        assert resolve_acting_user(metac_bot_runner, metac_bot.id) == metac_bot
        assert resolve_acting_user(metac_bot_runner, metac_bot.username) == metac_bot

    @pytest.mark.parametrize(
        "is_bot,is_active,metadata",
        [
            # Regular account
            (False, True, None),
            # Metac marker without being a bot
            (False, True, {"bot_details": {"metac_bot": True}}),
            # Third-party bot
            (True, True, {"bot_details": {"metac_bot": False}}),
            (True, True, None),
            # Truthy but not `true`
            (True, True, {"bot_details": {"metac_bot": "true"}}),
            # Deactivated metac bot
            (False, False, {"bot_details": {"metac_bot": True}}),
            (True, False, {"bot_details": {"metac_bot": True}}),
            # Malformed metadata
            (True, True, ["bot_details"]),
            (True, True, "bot_details"),
        ],
    )
    def test_runner_denied_for_other_targets(
        self, metac_bot_runner, is_bot, is_active, metadata
    ):
        target = User.objects.create(
            email="target@metaculus.com",
            username="target",
            is_bot=is_bot,
            is_active=is_active,
            metadata=metadata,
        )

        with pytest.raises(PermissionDenied):
            resolve_acting_user(metac_bot_runner, target.id)

    def test_runner_missing_target_is_403(self, metac_bot_runner):
        with pytest.raises(PermissionDenied):
            resolve_acting_user(metac_bot_runner, 999999)

        with pytest.raises(PermissionDenied):
            resolve_acting_user(metac_bot_runner, "does_not_exist")

    @pytest.mark.parametrize(
        "metadata",
        [
            None,
            {},
            {"can_act_as_metac_bots": False},
            {"can_act_as_metac_bots": 1},
            ["can_act_as_metac_bots"],
            "can_act_as_metac_bots",
        ],
    )
    def test_account_without_capability_denied(self, user1, metac_bot, metadata):
        user1.metadata = metadata
        user1.save()

        with pytest.raises(PermissionDenied):
            resolve_acting_user(user1, metac_bot.id)

    def test_owner_can_target_own_bot(self, user1, user2):
        own_bot = User.objects.create(
            email="own-bot@metaculus.com",
            username="own_bot",
            is_bot=True,
            bot_owner=user1,
        )

        assert resolve_acting_user(user1, own_bot.id) == own_bot

        with pytest.raises(PermissionDenied):
            resolve_acting_user(user2, own_bot.id)

    def test_anonymous_denied(self, metac_bot):
        with pytest.raises(PermissionDenied):
            resolve_acting_user(AnonymousUser(), metac_bot.id)

    def test_logs_successful_resolution(self, metac_bot_runner, metac_bot, caplog):
        with caplog.at_level(logging.INFO, logger="utils.acting_user"):
            resolve_acting_user(metac_bot_runner, metac_bot.id, path="/api/posts/")

        assert len(caplog.records) == 1
        message = caplog.records[0].getMessage()
        assert str(metac_bot_runner.id) in message
        assert str(metac_bot.id) in message
        assert "/api/posts/" in message

    def test_does_not_log_acting_as_self(self, user1, caplog):
        with caplog.at_level(logging.INFO, logger="utils.acting_user"):
            resolve_acting_user(user1, user1.id)

        assert not caplog.records
