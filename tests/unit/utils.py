import re
from contextlib import contextmanager
from datetime import datetime, timezone
from unittest import mock

from django.db.backends.utils import CursorWrapper
from django.utils.timezone import make_aware


def datetime_aware(*args, **kwargs):
    """
    Generates timezone-aware datetime object
    """

    return make_aware(datetime(*args, **kwargs))


@contextmanager
def mock_psql_now(fixed_dt: datetime):
    """
    Temporarily rewrite every SQL statement so that the literal token NOW()
    (case‑insensitive, no schema prefix) is replaced with a constant
    'YYYY‑MM‑DD hh:mm:ss+00'::timestamptz.

    Works for the duration of the context only, inside the current test
    process and connection pool.
    """
    if fixed_dt.tzinfo is None:
        # always use an explicit timezone, PostgreSQL 'NOW()' returns timestamptz
        fixed_dt = fixed_dt.replace(tzinfo=timezone.utc)

    literal = fixed_dt.isoformat(sep=" ")  # 2025‑07‑23 12:00:00+00:00
    literal_sql = f"'{literal}'::timestamptz"

    pattern = re.compile(r"\bNOW\(\)", flags=re.I)  # matches bare NOW()

    real_execute = CursorWrapper.execute

    def _execute(self, sql, params=None):
        sql = pattern.sub(literal_sql, sql)
        return real_execute(self, sql, params)

    with mock.patch.object(CursorWrapper, "execute", _execute):
        yield
