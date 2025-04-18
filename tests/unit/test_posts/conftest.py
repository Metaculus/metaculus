from datetime import datetime

import pytest
from django.utils.timezone import make_aware

from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.conftest import *  # noqa


@pytest.fixture()
def post_binary_public(user1, question_binary):
    return factory_post(
        author=user1,
        published_at=make_aware(datetime(2024, 1, 1)),
        open_time=make_aware(datetime(2024, 1, 1)),
        scheduled_close_time=make_aware(datetime.max),
        scheduled_resolve_time=make_aware(datetime.max),
        question=question_binary,
    )
