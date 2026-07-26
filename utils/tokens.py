from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.exceptions import ImproperlyConfigured
from django.utils.http import base36_to_int


class ScopedTokenGenerator(PasswordResetTokenGenerator):
    """
    PasswordResetTokenGenerator with a mandatory unique key_salt (generators
    sharing a salt mint interchangeable tokens across flows) and a
    configurable max token age. Effective TTL is
    min(token_timeout, PASSWORD_RESET_TIMEOUT).
    """

    key_salt: str | None = None
    # Max token age, seconds
    token_timeout: int = 60 * 60 * 24

    def __init__(self):
        super().__init__()
        if self.key_salt is None:
            raise ImproperlyConfigured(
                f"{type(self).__name__} must define its own key_salt - generators "
                "sharing a salt mint interchangeable tokens across flows."
            )

    def check_token(self, user, token) -> bool:
        if not token or not super().check_token(user, token):
            return False

        try:
            ts_b36, _ = token.split("-", 1)
            ts = base36_to_int(ts_b36)
        except ValueError:
            return False

        return (self._num_seconds(self._now()) - ts) <= self.token_timeout
