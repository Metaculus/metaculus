from dataclasses import asdict

from django_dynamic_fixture import G

from notifications.models import Notification
from users.models import User
from utils.dtypes import setdefaults_not_null


def factory_notification(
    *, notification_type: str = None, recipient: User = None, params=None, **kwargs
) -> Notification:
    return G(
        Notification,
        **setdefaults_not_null(
            kwargs,
            type=notification_type,
            recipient=recipient,
            params=asdict(params) if params else None,
        )
    )
