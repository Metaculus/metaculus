from django.contrib.auth.models import UserManager as DjangoUserManager

from users.constants import ApiForecastingAccess


class UserManager(DjangoUserManager):
    def create_user(
        self, *args, api_forecasting_access=None, is_bot=False, **extra_fields
    ):
        """
        Create and save a User. API forecasting access defaults by account
        type: bots are enabled, human accounts start disabled.
        """
        api_forecasting_access = api_forecasting_access or (
            ApiForecastingAccess.ENABLED if is_bot else ApiForecastingAccess.DISABLED
        )
        return super().create_user(
            *args,
            is_bot=is_bot,
            api_forecasting_access=api_forecasting_access,
            **extra_fields,
        )
