from datetime import datetime

import pytest
from django.utils.timezone import make_aware

from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.conftest import *  # noqa


@pytest.fixture()
def post_binary_public(user1, question_binary):
    question_binary.open_time = make_aware(datetime(2024, 1, 1))
    question_binary.scheduled_close_time = make_aware(datetime.max)
    question_binary.scheduled_resolve_time = make_aware(datetime.max)
    question_binary.save()
    return factory_post(
        author=user1,
        published_at=make_aware(datetime(2024, 1, 1)),
        open_time=make_aware(datetime(2024, 1, 1)),
        scheduled_close_time=make_aware(datetime.max),
        scheduled_resolve_time=make_aware(datetime.max),
        question=question_binary,
    )


@pytest.fixture()
def post_multiple_choice_public(user1, question_multiple_choice):
    question_multiple_choice.open_time = make_aware(datetime(2024, 1, 1))
    question_multiple_choice.scheduled_close_time = make_aware(datetime.max)
    question_multiple_choice.scheduled_resolve_time = make_aware(datetime.max)
    question_multiple_choice.save()
    return factory_post(
        author=user1,
        published_at=make_aware(datetime(2024, 1, 1)),
        open_time=make_aware(datetime(2024, 1, 1)),
        scheduled_close_time=make_aware(datetime.max),
        scheduled_resolve_time=make_aware(datetime.max),
        question=question_multiple_choice,
    )


@pytest.fixture()
def post_numeric_public(user1, question_numeric):
    question_numeric.open_time = make_aware(datetime(2024, 1, 1))
    question_numeric.scheduled_close_time = make_aware(datetime.max)
    question_numeric.scheduled_resolve_time = make_aware(datetime.max)
    question_numeric.save()
    return factory_post(
        author=user1,
        published_at=make_aware(datetime(2024, 1, 1)),
        open_time=make_aware(datetime(2024, 1, 1)),
        scheduled_close_time=make_aware(datetime.max),
        scheduled_resolve_time=make_aware(datetime.max),
        question=question_numeric,
    )


@pytest.fixture()
def post_discrete_public(user1, question_discrete):
    question_discrete.open_time = make_aware(datetime(2024, 1, 1))
    question_discrete.scheduled_close_time = make_aware(datetime.max)
    question_discrete.scheduled_resolve_time = make_aware(datetime.max)
    question_discrete.save()
    return factory_post(
        author=user1,
        published_at=make_aware(datetime(2024, 1, 1)),
        open_time=make_aware(datetime(2024, 1, 1)),
        scheduled_close_time=make_aware(datetime.max),
        scheduled_resolve_time=make_aware(datetime.max),
        question=question_discrete,
    )


@pytest.fixture()
def post_date_public(user1, question_date):
    question_date.open_time = make_aware(datetime(2024, 1, 1))
    question_date.scheduled_close_time = make_aware(datetime.max)
    question_date.scheduled_resolve_time = make_aware(datetime.max)
    question_date.save()
    return factory_post(
        author=user1,
        published_at=make_aware(datetime(2024, 1, 1)),
        open_time=make_aware(datetime(2024, 1, 1)),
        scheduled_close_time=make_aware(datetime.max),
        scheduled_resolve_time=make_aware(datetime.max),
        question=question_date,
    )
