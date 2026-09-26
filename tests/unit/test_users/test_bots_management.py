import logging

import pytest
from django.contrib.auth.models import AnonymousUser
from django.http import Http404
from rest_framework.exceptions import PermissionDenied

from users.models import User
from users.services.bots_management import resolve_staff_override_target


class TestResolveStaffOverrideTarget:
    def test_superuser_can_target_any_account(self, user_admin, user1):
        assert resolve_staff_override_target(user_admin, user_id=user1.id) == user1
        assert (
            resolve_staff_override_target(user_admin, username=user1.username) == user1
        )

    def test_superuser_can_target_inactive_account(self, user_admin, metac_bot):
        metac_bot.is_active = False
        metac_bot.save()

        assert (
            resolve_staff_override_target(user_admin, user_id=metac_bot.id) == metac_bot
        )

    def test_superuser_missing_target_is_404(self, user_admin):
        with pytest.raises(Http404):
            resolve_staff_override_target(user_admin, user_id=999999)

        with pytest.raises(Http404):
            resolve_staff_override_target(user_admin, username="does_not_exist")

    def test_runner_can_target_metac_bot(self, metac_bot_runner, metac_bot):
        assert (
            resolve_staff_override_target(metac_bot_runner, user_id=metac_bot.id)
            == metac_bot
        )
        assert (
            resolve_staff_override_target(metac_bot_runner, username=metac_bot.username)
            == metac_bot
        )

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
            resolve_staff_override_target(metac_bot_runner, user_id=target.id)

    def test_runner_missing_target_is_403(self, metac_bot_runner):
        with pytest.raises(PermissionDenied):
            resolve_staff_override_target(metac_bot_runner, user_id=999999)

        with pytest.raises(PermissionDenied):
            resolve_staff_override_target(metac_bot_runner, username="does_not_exist")

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
            resolve_staff_override_target(user1, user_id=metac_bot.id)

    def test_owner_without_capability_denied(self, user1):
        own_bot = User.objects.create(
            email="own-bot@metaculus.com",
            username="own_bot",
            is_bot=True,
            bot_owner=user1,
        )

        with pytest.raises(PermissionDenied):
            resolve_staff_override_target(user1, user_id=own_bot.id)

    def test_anonymous_denied(self, metac_bot):
        with pytest.raises(PermissionDenied):
            resolve_staff_override_target(AnonymousUser(), user_id=metac_bot.id)

    def test_logs_successful_resolution(self, metac_bot_runner, metac_bot, caplog):
        with caplog.at_level(logging.INFO, logger="users.services.bots_management"):
            resolve_staff_override_target(
                metac_bot_runner, user_id=metac_bot.id, path="/api/posts/"
            )

        assert len(caplog.records) == 1
        message = caplog.records[0].getMessage()
        assert str(metac_bot_runner.id) in message
        assert str(metac_bot.id) in message
        assert "/api/posts/" in message
