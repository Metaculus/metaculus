from contextlib import contextmanager

from django.db import connections, transaction
from django.db.models import Func, TextField, Value

# Characters str.strip() removes
PYTHON_WHITESPACE = (
    "\t\n\x0b\x0c\r\x1c\x1d\x1e\x1f \x85\xa0\u1680\u2000\u2001\u2002\u2003\u2004"
    "\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000"
)


class LStrip(Func):
    function = "LTRIM"
    output_field = TextField()

    def __init__(self, expression, **extra):
        super().__init__(expression, Value(PYTHON_WHITESPACE), **extra)


class RStrip(LStrip):
    function = "RTRIM"


def paginate_cursor(
    cursor,
    query,
    *args,
    itersize: int = 2000,
    only_columns: list = None,
    flat: bool = False,
    **kwargs,
):
    """
    Performs chunked SELECT query against the raw connection
    """

    cursor.execute(query, *args, **kwargs)
    columns = [col[0] for col in cursor.description]

    while True:
        rows = cursor.fetchmany(itersize)

        if len(rows) > 0:
            for row in rows:
                row = dict(zip(columns, row))

                # Filter out columns not used
                if only_columns:
                    row = {k: v for k, v in row.items() if k in only_columns}

                # Return just a value if flat == True
                if flat:
                    yield next(iter(row.values()))
                else:
                    yield row
        else:
            break


@contextmanager
def transaction_repeatable_read(using: str = "default"):
    """
    Creates an atomic transaction that works in REPEATABLE READ isolation mode
    """

    with transaction.atomic():
        with connections[using].cursor() as cursor:
            cursor.execute("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;")

            yield
