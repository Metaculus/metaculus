from django.db import connection
from django.test.utils import CaptureQueriesContext

from posts.serializers import serialize_post_many


def test_author_username_without_user_row(post_binary_public):
    with CaptureQueriesContext(connection) as ctx:
        data = serialize_post_many([post_binary_public.id])

    assert data[0]["author_username"] == "user1"
    assert not [q for q in ctx.captured_queries if '."password"' in q["sql"]]
