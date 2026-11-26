from pathlib import Path

import sqlparse
from django.db import connection, transaction

ANONYMIZE_SQL_PATH = Path(__file__).parent / "anonymize.sql"


def get_anonymization_statements() -> list[str]:
    statements = [
        sqlparse.format(statement, strip_comments=True).strip()
        for statement in sqlparse.split(ANONYMIZE_SQL_PATH.read_text())
    ]

    return [statement for statement in statements if statement]


def run_anonymization() -> list[tuple[str, int]]:
    """
    Runs every statement of anonymize.sql in one transaction.
    Returns (statement summary, affected rows) pairs.
    """

    results = []

    with transaction.atomic(), connection.cursor() as cursor:
        for statement in get_anonymization_statements():
            cursor.execute(statement)
            results.append((" ".join(statement.split())[:80], cursor.rowcount))

    return results
