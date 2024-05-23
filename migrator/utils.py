from django.db import connections


def dictfetchall(cursor):
    """
    Return all rows from a cursor as a dict.
    Assume the column names are unique.
    """
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def paginated_query(query, *args, itersize: int = 2000, **kwargs):
    """
    Performs chunked SELECT query against the old database
    """

    with connections["old"].cursor() as cursor:
        cursor.execute(query)
        columns = [col[0] for col in cursor.description]

        while True:
            rows = cursor.fetchmany(itersize)

            if len(rows) > 0:
                for row in rows:
                    yield dict(zip(columns, row))
            else:
                break
