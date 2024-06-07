from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

from users.models import User


class AuthLoginBackend(ModelBackend):
    """
    Auth backend that allows to authenticate via email or username as login
    """

    @classmethod
    def find_user(cls, login=None):
        return User.objects.filter(
            Q(username__iexact=login) | Q(email__iexact=login)
        ).first()

    def authenticate(self, request, login=None, password=None, **kwargs):
        if not login:
            return None

        user = self.find_user(login=login)

        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
