from django_dynamic_fixture import G

from users.models import User
from utils.dtypes import setdefaults_not_null


def factory_user(*, email: str = None, username: str = None, **kwargs) -> User:
    return G(
        User,
        **setdefaults_not_null(
            kwargs,
            email=email,
            username=username,
        )
    )
