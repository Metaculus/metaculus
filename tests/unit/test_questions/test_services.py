from datetime import datetime

import freezegun
import pytest  # noqa
from django.utils.timezone import make_aware

from posts.services.common import create_post, approve_post
from questions.services import resolve_question
from tests.unit.fixtures import *  # noqa
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.fixtures import *  # noqa


@freezegun.freeze_time("2024-11-1")
class TestResolveConditionalQuestion:
    @pytest.fixture()
    def post_parent(self, user1):
        return factory_post(
            author=user1,
            question=create_question(
                question_type=Question.QuestionType.BINARY,
                open_time=make_aware(datetime(2023, 1, 1)),
                scheduled_close_time=make_aware(datetime(2025, 1, 1)),
            ),
        )

    @pytest.fixture()
    def post_child(self, user1):
        return factory_post(
            author=user1,
            question=create_question(
                question_type=Question.QuestionType.BINARY,
                open_time=make_aware(datetime(2023, 1, 1)),
                scheduled_close_time=make_aware(datetime(2025, 1, 1)),
            ),
        )

    @pytest.fixture()
    def post_conditional(self, user1, post_parent, post_child):
        post = create_post(
            conditional={
                "condition_id": post_parent.question_id,
                "condition_child_id": post_child.question_id,
            },
            author=user1,
        )
        approve_post(
            post, make_aware(datetime(2024, 10, 1)), make_aware(datetime(2024, 10, 1))
        )

        return post

    def test_conditional_child_and_parent_resolved(
        self, post_conditional, post_child, post_parent
    ):
        """
        Both Condition and Child are resolved
        """

        assert not post_conditional.resolved

        # Close child question
        resolve_question(
            post_child.question,
            "yes",
            actual_resolve_time=make_aware(datetime(2024, 11, 1)),
        )
        resolve_question(
            post_parent.question,
            "no",
            actual_resolve_time=make_aware(datetime(2024, 11, 1)),
        )
        post_conditional.refresh_from_db()

        assert post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 11, 1))

        assert post_conditional.conditional.question_no.resolution == "yes"
        assert post_conditional.conditional.question_no.actual_close_time == make_aware(
            datetime(2024, 11, 1)
        )
        assert (
            post_conditional.conditional.question_no.actual_resolve_time
            == make_aware(datetime(2024, 11, 1))
        )

        assert post_conditional.conditional.question_yes.resolution == "annulled"
        assert (
            post_conditional.conditional.question_yes.actual_close_time
            == make_aware(datetime(2024, 11, 1))
        )
        assert (
            post_conditional.conditional.question_yes.actual_resolve_time
            == make_aware(datetime(2024, 11, 1))
        )

    def test_conditional_parent_resolved(
        self, post_conditional, post_child, post_parent
    ):
        """
        Both Condition and Child are resolved
        """

        assert not post_conditional.resolved

        # Resolve condition
        resolve_question(
            post_parent.question,
            "no",
            actual_resolve_time=make_aware(datetime(2024, 11, 1)),
        )
        post_conditional.refresh_from_db()

        assert not post_conditional.resolved
        assert post_conditional.actual_close_time

        assert not post_conditional.conditional.question_no.resolution
        assert post_conditional.conditional.question_no.actual_close_time == make_aware(
            datetime(2024, 11, 1)
        )
        assert not post_conditional.conditional.question_no.actual_resolve_time

        assert post_conditional.conditional.question_yes.resolution == "annulled"
        assert (
            post_conditional.conditional.question_yes.actual_close_time
            == make_aware(datetime(2024, 11, 1))
        )
        assert (
            post_conditional.conditional.question_yes.actual_resolve_time
            == make_aware(datetime(2024, 11, 1))
        )

    def test_conditional_child_resolved(self, post_conditional, post_child):
        """
        Both Condition and Child are resolved
        """

        assert not post_conditional.resolved

        # Resolve condition
        resolve_question(
            post_child.question,
            "no",
            actual_resolve_time=make_aware(datetime(2024, 11, 1)),
        )
        post_conditional.refresh_from_db()

        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 11, 1))

        assert not post_conditional.conditional.question_yes.resolution
        assert (
            post_conditional.conditional.question_yes.actual_close_time
            == make_aware(datetime(2024, 11, 1))
        )
        assert not post_conditional.conditional.question_yes.actual_resolve_time

        assert not post_conditional.conditional.question_no.resolution
        assert post_conditional.conditional.question_no.actual_close_time == make_aware(
            datetime(2024, 11, 1)
        )
        assert not post_conditional.conditional.question_no.actual_resolve_time
