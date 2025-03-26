import contextlib
import re
from io import StringIO

from django.apps import apps
from django.core.management import call_command
from django.db import connections, connection
from utils.db import paginate_cursor
from users.models import User


@contextlib.contextmanager
def old_db_cursor():
    connection = connections["old"]
    cursor = connection.cursor()
    try:
        yield cursor
    finally:
        cursor.close()


def dictfetchall(cursor):
    """
    Return all rows from a cursor as a dict.
    Assume the column names are unique.
    """
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def paginated_query(
    query,
    *args,
    itersize: int = 2000,
    only_columns: list = None,
    flat: bool = False,
    **kwargs,
):
    """
    Performs chunked SELECT query against the old database
    """

    with old_db_cursor() as cursor:
        yield from paginate_cursor(
            cursor,
            query,
            *args,
            itersize=itersize,
            only_columns=only_columns,
            flat=flat,
            **kwargs,
        )


def one2one_query(query, *args, **kwargs):
    """
    Performs One2One query
    """

    with old_db_cursor() as cursor:
        cursor.execute(query, *args, **kwargs)
        data = dictfetchall(cursor)

        if len(data) == 0:
            return
        if len(data) > 1:
            raise ValueError("More than one record found")

        return data[0]


def reset_sequence():
    # Resetting DB auto-incremented sequences of Primary keys
    # Very important since migrate objects keeping their ids
    cursor = connection.cursor()

    for app in apps.get_app_configs():
        label = app.label
        commands = StringIO()
        call_command(
            "sqlsequencereset", label, stdout=commands, no_color=True, verbosity=0
        )

        if sql_query := commands.getvalue():
            cursor.execute(sql_query)


def cleanup_markdown(md):
    parts = re.split(r"(<iframe[^>]*>.*?</iframe>)", md, flags=re.DOTALL)

    converted_parts = []
    for part in parts:
        if part.startswith("<iframe"):
            match = re.search(r"questions/question_embed/(\d+)/", part)
            if match:
                question_id = match.group(1)
                part = f'<EmbeddedQuestion id="{question_id}" />'

        converted_parts.append(part)

    md = "".join(converted_parts)

    # Remove \n since they are treated as newlines here
    # md = re.sub(r"\n(?!\n)", " ", md)

    # Close unclosed img/br tags
    md = re.sub(r"(<(img|br)[^>]*)(?<!/)>", r"\1 />", md)

    return md


def filter_for_existing_users(query_generator, user_id_field="user_id"):
    user_ids = list(User.objects.values_list("id", flat=True))

    for obj in query_generator:
        if obj.get(user_id_field) in user_ids:
            yield obj
