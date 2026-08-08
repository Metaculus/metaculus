import pytest


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests():
    """Override the package-wide autouse `db` fixture.

    These tests shell out to a bash script and never touch the ORM, so they
    should not require a database to run.
    """
