from datetime import timedelta

from django.db import connection
from django.test.utils import CaptureQueriesContext
from freezegun import freeze_time

from authentication.auth import FallbackTokenAuthentication
from authentication.models import ApiKey


def test_last_used_at_is_updated_once_per_window(user1):
    key = ApiKey.objects.create(user=user1).key
    auth = FallbackTokenAuthentication()

    with freeze_time() as frozen, CaptureQueriesContext(connection) as ctx:
        auth.authenticate_credentials(key)
        auth.authenticate_credentials(key)
        frozen.tick(timedelta(minutes=10))
        auth.authenticate_credentials(key)

    updates = [q for q in ctx.captured_queries if q["sql"].startswith("UPDATE")]
    assert len(updates) == 2
