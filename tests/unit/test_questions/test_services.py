from datetime import datetime

import freezegun
import pytest  # noqa
from django.utils.timezone import make_aware

from posts.models import Post
from posts.services.common import create_post, approve_post
from questions.constants import QuestionStatus, UnsuccessfulResolutionType
from questions.jobs import job_close_question
from questions.models import Question, Forecast
from questions.services.lifecycle import resolve_question, unresolve_question
from questions.services.multiple_choice_handlers import (
    multiple_choice_add_options,
    multiple_choice_delete_options,
    multiple_choice_rename_option,
)
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_question
from tests.unit.utils import datetime_aware as dt
from users.models import User


@freezegun.freeze_time("2024-1-1")
class TestResolveConditionalQuestion:
    """
    Test cases: (Unresolved means resolved and then unresolved)

    1.  Parent Open, Child Open -> Branches Open
    2.  Parent Open, Child Closed -> Branches Closed
    3.  Parent Open, Child Resolved -> Branches Closed
    4.  Parent Open, Child Unresolved to Open -> Branches Open
    5.  Parent Open, Child Unresolved to Closed -> Branches Closed

    6.  Parent Closed, Child Open -> Branches Closed
    7.  Parent Closed, Child Closed -> Branches Closed
    8.  Parent Closed, Child Resolved -> Branches Closed
    9.  Parent Closed, Child Unresolved to Open -> Branches Closed
    10. Parent Closed, Child Unresolved to Closed -> Branches Closed

    11. Parent Resolved, Child Open -> One Branch Closed, Other Annulled
    12. Parent Resolved, Child Closed -> One Branch Closed, Other Annulled
    13. Parent Resolved, Child Resolved -> One Branch Resolved, Other Annulled
    14. Parent Resolved, Child Unresolved to Open -> One Branch Closed, Other Annulled
    15. Parent Resolved, Child Unresolved to Closed -> One Branch Closed, Other Annulled

    16. Parent Unresolved to Open, Child Open -> Branches Open
    17. Parent Unresolved to Open, Child Closed -> Branches Closed
    18. Parent Unresolved to Open, Child Resolved -> Branches Closed
    19. Parent Unresolved to Open, Child Unresolved to Open -> Branches Open
    20. Parent Unresolved to Open, Child Unresolved to Closed -> Branches Closed

    21. Parent Unresolved to Closed, Child Open -> Branches Closed
    22. Parent Unresolved to Closed, Child Closed -> Branches Closed
    23. Parent Unresolved to Closed, Child Resolved -> Branches Closed
    24. Parent Unresolved to Closed, Child Unresolved to Open -> Branches Closed
    25. Parent Unresolved to Closed, Child Unresolved to Closed -> Branches Closed

    # TODO: add test cases for QuestionStatus.UPCOMING
    # TODO: add test cases for resolve ordering
    """

    @pytest.fixture()
    def post_parent_open(self, user1):
        return factory_post(
            author=user1,
            question=create_question(
                question_type=Question.QuestionType.BINARY,
                open_time=make_aware(datetime(2023, 1, 1)),
                scheduled_close_time=make_aware(datetime(2025, 1, 1)),
                scheduled_resolve_time=make_aware(datetime(2026, 1, 1)),
            ),
        )

    @pytest.fixture()
    def post_parent_closed(self, post_parent_open):
        post_parent_open.question.scheduled_close_time = make_aware(
            datetime(2024, 1, 1)
        )
        post_parent_open.question.save()
        job_close_question()
        post_parent_open.refresh_from_db()
        return post_parent_open

    @pytest.fixture()
    def post_child_open(self, user1):
        return factory_post(
            author=user1,
            question=create_question(
                question_type=Question.QuestionType.BINARY,
                open_time=make_aware(datetime(2023, 1, 1)),
                scheduled_close_time=make_aware(datetime(2025, 1, 1)),
                scheduled_resolve_time=make_aware(datetime(2026, 1, 1)),
            ),
        )

    @pytest.fixture()
    def post_child_closed(self, post_child_open):
        post_child_open.question.scheduled_close_time = make_aware(datetime(2024, 1, 1))
        post_child_open.question.save()
        job_close_question()
        post_child_open.refresh_from_db()
        return post_child_open

    def create_post_conditional(self, user1, post_parent, post_child):
        post = create_post(
            conditional={
                "condition_id": post_parent.question_id,
                "condition_child_id": post_child.question_id,
            },
            author=user1,
        )
        approve_post(
            post,
            post.published_at or make_aware(datetime(2024, 1, 1)),
            post.conditional.question_yes.open_time or make_aware(datetime(2024, 1, 1)),
            post.conditional.question_yes.cp_reveal_time
            or make_aware(datetime(2024, 1, 1)),
            post.conditional.question_yes.scheduled_close_time
            or make_aware(datetime(2024, 1, 1)),
            post.conditional.question_yes.scheduled_resolve_time
            or make_aware(datetime(2024, 1, 1)),
        )
        post.update_pseudo_materialized_fields()

        return post

    def test_case_1_parent_open_child_open(
        self,
        user1: User,
        post_parent_open: Post,
        post_child_open: Post,
    ):
        """
        1.  Parent Open, Child Open -> Branches Open
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_open, post_child_open
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.OPEN
        assert child.status == QuestionStatus.OPEN

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time is None

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.OPEN
        assert question_no.status == QuestionStatus.OPEN

    def test_case_2_parent_open_child_closed(
        self,
        user1: User,  # noqa
        post_parent_open: Post,
        post_child_closed: Post,
    ):
        """
        2.   Parent Open, Child Closed -> Branches Closed
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_open, post_child_closed
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.OPEN
        assert child.status == QuestionStatus.CLOSED

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.CLOSED

    def test_case_3_parent_open_child_resolved(
        self,
        user1: User,  # noqa
        post_parent_open: Post,
        post_child_open: Post,
    ):
        """
        3.  Parent Open, Child resolved -> Branches Closed
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_open, post_child_open
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            child, "no", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.OPEN
        assert child.status == QuestionStatus.RESOLVED

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.CLOSED

    def test_case_4_parent_open_child_unresolved_to_open(
        self,
        user1: User,  # noqa
        post_parent_open: Post,
        post_child_open: Post,
    ):
        """
        4.  Parent Open, Child unresolved to Open -> Branches Open
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_open, post_child_open
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            child, "no", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(child)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.OPEN
        assert child.status == QuestionStatus.OPEN

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time is None

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.OPEN
        assert question_no.status == QuestionStatus.OPEN

    def test_case_5_parent_open_child_unresolved_to_closed(
        self,
        user1: User,  # noqa
        post_parent_open: Post,
        post_child_closed: Post,
    ):
        """
        5.  Parent Open, Child unresolved to Closed -> Branches Closed
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_open, post_child_closed
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            child, "no", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(child)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.OPEN
        assert child.status == QuestionStatus.CLOSED

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.CLOSED

    def test_case_6_parent_closed_child_open(
        self,
        user1: User,  # noqa
        post_parent_closed: Post,
        post_child_open: Post,
    ):
        """
        6.  Parent Closed, Child Open -> Branches Closed
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_closed, post_child_open
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.CLOSED
        assert child.status == QuestionStatus.OPEN

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.CLOSED

    def test_case_7_parent_closed_child_closed(
        self,
        user1: User,  # noqa
        post_parent_closed: Post,
        post_child_closed: Post,
    ):
        """
        7.  Parent Closed, Child Closed -> Branches Closed
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_closed, post_child_closed
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.CLOSED
        assert child.status == QuestionStatus.CLOSED

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.CLOSED

    def test_case_8_parent_closed_child_resolved(
        self,
        user1: User,  # noqa
        post_parent_closed: Post,
        post_child_open: Post,
    ):
        """
        8.  Parent Closed, Child Resolved -> Branches Closed
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_closed, post_child_open
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            child, "no", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.CLOSED
        assert child.status == QuestionStatus.RESOLVED

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.CLOSED

    def test_case_9_parent_closed_child_unresolved_to_open(
        self,
        user1: User,  # noqa
        post_parent_closed: Post,
        post_child_open: Post,
    ):
        """
        9.  Parent Closed, Child Unresolved to Open -> Branches Closed
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_closed, post_child_open
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            child, "no", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(child)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.CLOSED
        assert child.status == QuestionStatus.OPEN

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.CLOSED

    def test_case_10_parent_closed_child_unresolved_to_closed(
        self,
        user1: User,  # noqa
        post_parent_closed: Post,
        post_child_closed: Post,
    ):
        """
        10. Parent Closed, Child Unresolved to Closed -> Branches Closed
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_closed, post_child_closed
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            child, "no", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(child)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.CLOSED
        assert child.status == QuestionStatus.CLOSED

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.CLOSED

    def test_case_11_parent_resolved_child_open(
        self,
        user1: User,  # noqa
        post_parent_open: Post,
        post_child_open: Post,
    ):
        """
        11. Parent Resolved, Child Open -> One Branch Closed, Other Annulled
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_open, post_child_open
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            parent, "yes", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.RESOLVED
        assert child.status == QuestionStatus.OPEN

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.RESOLVED
        assert question_no.resolution == UnsuccessfulResolutionType.ANNULLED

    def test_case_12_parent_resolved_child_closed(
        self,
        user1: User,  # noqa
        post_parent_open: Post,
        post_child_closed: Post,
    ):
        """
        12. Parent Resolved, Child Closed -> One Branch Closed, Other Annulled
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_open, post_child_closed
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            parent, "yes", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.RESOLVED
        assert child.status == QuestionStatus.CLOSED

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.RESOLVED
        assert question_no.resolution == UnsuccessfulResolutionType.ANNULLED

    def test_case_13_parent_resolved_child_resolved(
        self,
        user1: User,  # noqa
        post_parent_open: Post,
        post_child_open: Post,
    ):
        """
        13. Parent Resolved, Child Resolved -> One Branch Resolved, Other Annulled
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_open, post_child_open
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            parent, "yes", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        resolve_question(
            child, "no", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.RESOLVED
        assert child.status == QuestionStatus.RESOLVED

        # conditional post status
        assert post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.RESOLVED
        assert question_yes.resolution == "no"
        assert question_no.status == QuestionStatus.RESOLVED
        assert question_no.resolution == UnsuccessfulResolutionType.ANNULLED

    def test_case_14_parent_resolved_child_unresolved_to_open(
        self,
        user1: User,  # noqa
        post_parent_open: Post,
        post_child_open: Post,
    ):
        """
        14. Parent Resolved, Child Unresolved to Open -> One Branch Closed, Other Annulled
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_open, post_child_open
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            parent, "yes", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        resolve_question(
            child, "no", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(child)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.RESOLVED
        assert child.status == QuestionStatus.OPEN

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.RESOLVED
        assert question_no.resolution == UnsuccessfulResolutionType.ANNULLED

    def test_case_15_parent_resolved_child_unresolved_to_closed(
        self,
        user1: User,  # noqa
        post_parent_open: Post,
        post_child_closed: Post,
    ):
        """
        15. Parent Resolved, Child Unresolved to Closed -> One Branch Closed, Other Annulled
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_open, post_child_closed
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            parent, "yes", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        resolve_question(
            child, "no", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(child)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.RESOLVED
        assert child.status == QuestionStatus.CLOSED

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.RESOLVED
        assert question_no.resolution == UnsuccessfulResolutionType.ANNULLED

    def test_case_16_parent_unresolved_to_open_child_open(
        self,
        user1: User,  # noqa
        post_parent_open: Post,
        post_child_open: Post,
    ):
        """
        16. Parent Unresolved to Open, Child Open -> Branches Open
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_open, post_child_open
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            parent, "yes", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(parent)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.OPEN
        assert child.status == QuestionStatus.OPEN

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time is None

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.OPEN
        assert question_no.status == QuestionStatus.OPEN

    def test_case_17_parent_unresolved_to_open_child_closed(
        self,
        user1: User,  # noqa
        post_parent_open: Post,
        post_child_closed: Post,
    ):
        """
        17. Parent Unresolved to Open, Child Closed -> Branches Closed
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_open, post_child_closed
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            parent, "yes", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(parent)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.OPEN
        assert child.status == QuestionStatus.CLOSED

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.CLOSED

    def test_case_18_parent_unresolved_to_open_child_resolved(
        self,
        user1: User,  # noqa
        post_parent_open: Post,
        post_child_open: Post,
    ):
        """
        18. Parent Unresolved to Open, Child Resolved -> Branches Closed
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_open, post_child_open
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            parent, "yes", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(parent)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        resolve_question(
            child, "no", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.OPEN
        assert child.status == QuestionStatus.RESOLVED

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.CLOSED

    def test_case_19_parent_unresolved_to_open_child_unresolved_to_open(
        self,
        user1: User,  # noqa
        post_parent_open: Post,
        post_child_open: Post,
    ):
        """
        19. Parent Unresolved to Open, Child Unresolved to Open -> Branches Open
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_open, post_child_open
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            parent, "yes", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(parent)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        resolve_question(
            child, "no", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(child)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.OPEN
        assert child.status == QuestionStatus.OPEN

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time is None

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.OPEN
        assert question_no.status == QuestionStatus.OPEN

    def test_case_20_parent_unresolved_to_open_child_unresolved_to_closed(
        self,
        user1: User,  # noqa
        post_parent_open: Post,
        post_child_closed: Post,
    ):
        """
        20. Parent Unresolved to Open, Child Unresolved to Closed -> Branches Closed
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_open, post_child_closed
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            parent, "yes", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(parent)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        resolve_question(
            child, "no", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(child)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.OPEN
        assert child.status == QuestionStatus.CLOSED

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.CLOSED

    def test_case_21_parent_unresolved_to_closed_child_open(
        self,
        user1: User,  # noqa
        post_parent_closed: Post,
        post_child_open: Post,
    ):
        """
        21. Parent Unresolved to Closed, Child Open -> Branches Closed
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_closed, post_child_open
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            parent, "yes", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(parent)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.CLOSED
        assert child.status == QuestionStatus.OPEN

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.CLOSED

    def test_case_22_parent_unresolved_to_closed_child_closed(
        self,
        user1: User,  # noqa
        post_parent_closed: Post,
        post_child_closed: Post,
    ):
        """
        22. Parent Unresolved to Closed, Child Closed -> Branches Closed
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_closed, post_child_closed
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            parent, "yes", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(parent)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.CLOSED
        assert child.status == QuestionStatus.CLOSED

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.CLOSED

    def test_case_23_parent_unresolved_to_closed_child_resolved(
        self,
        user1: User,  # noqa
        post_parent_closed: Post,
        post_child_open: Post,
    ):
        """
        23. Parent Unresolved to Closed, Child Resolved -> Branches Closed
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_closed, post_child_open
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            parent, "yes", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(parent)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        resolve_question(
            child, "no", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.CLOSED
        assert child.status == QuestionStatus.RESOLVED

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.CLOSED

    def test_case_24_parent_unresolved_to_closed_child_unresolved_to_open(
        self,
        user1: User,  # noqa
        post_parent_closed: Post,
        post_child_open: Post,
    ):
        """
        24. Parent Unresolved to Closed, Child Unresolved to Open -> Branches Closed
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_closed, post_child_open
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            parent, "yes", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(parent)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        resolve_question(
            child, "no", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(child)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.CLOSED
        assert child.status == QuestionStatus.OPEN

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.CLOSED

    def test_case_25_parent_unresolved_to_closed_child_unresolved_to_closed(
        self,
        user1: User,  # noqa
        post_parent_closed: Post,
        post_child_closed: Post,
    ):
        """
        25. Parent Unresolved to Closed, Child Unresolved to Closed -> Branches Closed
        """
        # setup
        post_conditional = self.create_post_conditional(
            user1, post_parent_closed, post_child_closed
        )
        parent = post_conditional.conditional.condition
        child = post_conditional.conditional.condition_child
        question_yes = post_conditional.conditional.question_yes
        question_no = post_conditional.conditional.question_no

        # action
        resolve_question(
            parent, "yes", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(parent)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        resolve_question(
            child, "no", actual_resolve_time=make_aware(datetime(2024, 1, 1))
        )
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()
        unresolve_question(child)
        for obj in [post_conditional, parent, child, question_yes, question_no]:
            obj.refresh_from_db()

        # parent question / child question status
        assert parent.status == QuestionStatus.CLOSED
        assert child.status == QuestionStatus.CLOSED

        # conditional post status
        assert not post_conditional.resolved
        assert post_conditional.actual_close_time == make_aware(datetime(2024, 1, 1))

        # conditional branch questions status
        assert question_yes.status == QuestionStatus.CLOSED
        assert question_no.status == QuestionStatus.CLOSED


@pytest.mark.parametrize(
    "old_option,new_option,expect_success",
    [
        ("Option B", "Option D", True),
        ("Option X", "Option Y", False),  # old_option does not exist
        ("Option A", "Option A", False),  # new_option already exists
    ],
)
def test_multiple_choice_rename_option(
    question_multiple_choice, old_option, new_option, expect_success
):
    question = question_multiple_choice
    question.options = ["Option A", "Option B", "Option C"]
    question.save()

    if not expect_success:
        with pytest.raises(ValueError):
            multiple_choice_rename_option(question, old_option, new_option)
        return
    updated_question = multiple_choice_rename_option(question, old_option, new_option)

    assert old_option not in updated_question.options
    assert new_option in updated_question.options
    assert len(updated_question.options) == 3


@pytest.mark.parametrize(
    "initial_options,options_to_delete,forecasts,expected_forecasts,expect_success",
    [
        (["a", "b", "other"], ["b"], [], [], True),  # simplest path
        (["a", "b", "other"], ["c"], [], [], False),  # try to remove absent item
        (["a", "b", "other"], ["a", "b"], [], [], True),  # remove two items
        (
            ["a", "b", "other"],
            ["b"],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                )
            ],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                ),
                Forecast(
                    start_time=dt(2025, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.0, 0.8],
                    source=Forecast.SourceChoices.AUTOMATIC,
                ),
            ],
            True,
        ),  # happy path
        (
            ["a", "b", "c", "other"],
            ["b", "c"],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.1, 0.4],
                )
            ],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                    probability_yes_per_category=[0.2, 0.3, 0.1, 0.4],
                ),
                Forecast(
                    start_time=dt(2025, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.0, 0.0, 0.8],
                    source=Forecast.SourceChoices.AUTOMATIC,
                ),
            ],
            True,
        ),  # happy path removing 2
        (
            ["a", "b", "other"],
            ["b"],
            [
                Forecast(
                    start_time=dt(2025, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.8],
                )
            ],
            [
                Forecast(
                    start_time=dt(2025, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.8],
                ),
            ],
            True,
        ),  # forecast is at / after timestep
        (
            ["a", "b", "other"],
            [],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                )
            ],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                )
            ],
            True,
        ),  # no effect
        (
            ["a", "b", "other"],
            ["b"],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.8],
                )
            ],
            [],
            False,
        ),  # initial forecast is invalid
    ],
)
def test_multiple_choice_delete_options(
    question_multiple_choice: Question,
    user1: User,
    initial_options: list[str],
    options_to_delete: list[str],
    forecasts: list[Forecast],
    expected_forecasts: list[Forecast],
    expect_success: bool,
):
    question = question_multiple_choice
    question.options = initial_options
    question.options_history = [(0.0, initial_options)]
    question.save()

    timestep = dt(2025, 1, 1)
    for forecast in forecasts:
        forecast.author = user1
        forecast.question = question
        forecast.save()

    if not expect_success:
        with pytest.raises(ValueError):
            multiple_choice_delete_options(
                question, options_to_delete, timestep=timestep
            )
        return

    multiple_choice_delete_options(question, options_to_delete, timestep=timestep)

    question.refresh_from_db()
    expected_options = [opt for opt in initial_options if opt not in options_to_delete]
    assert question.options == expected_options
    ts, options = question.options_history[-1]
    assert ts == (timestep.timestamp() if options_to_delete else 0.0)
    assert options == expected_options

    forecasts = question.user_forecasts.order_by("start_time")
    assert len(forecasts) == len(expected_forecasts)
    for f, e in zip(forecasts, expected_forecasts):
        assert f.start_time == e.start_time
        assert f.end_time == e.end_time
        assert f.probability_yes_per_category == e.probability_yes_per_category
        assert f.source == e.source


@pytest.mark.parametrize(
    "initial_options,options_to_add,grace_period_end,forecasts,expected_forecasts,"
    "expect_success",
    [
        (["a", "b", "other"], ["c"], dt(2025, 1, 1), [], [], True),  # simplest path
        (["a", "b", "other"], ["b"], dt(2025, 1, 1), [], [], False),  # copied add
        (["a", "b", "other"], ["c", "d"], dt(2025, 1, 1), [], [], True),  # double add
        # grace period before last options history
        (["a", "b", "other"], ["c"], dt(1900, 1, 1), [], [], False),
        (
            ["a", "b", "other"],
            ["c"],
            dt(2025, 1, 1),
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                )
            ],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                    probability_yes_per_category=[0.2, 0.3, 0.0, 0.5],
                )
            ],
            True,
        ),  # happy path
        (
            ["a", "b", "other"],
            ["c", "d"],
            dt(2025, 1, 1),
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                )
            ],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=dt(2025, 1, 1),
                    probability_yes_per_category=[0.2, 0.3, 0.0, 0.0, 0.5],
                )
            ],
            True,
        ),  # happy path adding two options
        (
            ["a", "b", "other"],
            ["c"],
            dt(2025, 1, 1),
            [
                Forecast(
                    start_time=dt(2025, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                )
            ],
            [
                Forecast(
                    start_time=dt(2025, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.0, 0.5],
                )
            ],
            True,
        ),  # forecast starts at /after grace_period_end
        (
            ["a", "b", "other"],
            [],
            dt(2025, 1, 1),
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                )
            ],
            [
                Forecast(
                    start_time=dt(2024, 1, 1),
                    end_time=None,
                    probability_yes_per_category=[0.2, 0.3, 0.5],
                )
            ],
            True,
        ),  # no effect
    ],
)
def test_multiple_choice_add_options(
    question_multiple_choice: Question,
    user1: User,
    initial_options: list[str],
    options_to_add: list[str],
    grace_period_end: datetime,
    forecasts: list[Forecast],
    expected_forecasts: list[Forecast],
    expect_success: bool,
):
    question = question_multiple_choice
    question.options = initial_options
    question.options_history = [(0.0, initial_options)]
    question.save()

    for forecast in forecasts:
        forecast.author = user1
        forecast.question = question
        forecast.save()

    if not expect_success:
        with pytest.raises(ValueError):
            multiple_choice_add_options(
                question, options_to_add, grace_period_end, timestep=dt(2024, 7, 1)
            )
        return

    multiple_choice_add_options(
        question, options_to_add, grace_period_end, timestep=dt(2024, 7, 1)
    )

    question.refresh_from_db()
    expected_options = initial_options[:-1] + options_to_add + initial_options[-1:]
    assert question.options == expected_options
    ts, options = question.options_history[-1]
    assert ts == (grace_period_end.timestamp() if options_to_add else 0)
    assert options == expected_options

    forecasts = question.user_forecasts.order_by("start_time")
    assert len(forecasts) == len(expected_forecasts)
    for f, e in zip(forecasts, expected_forecasts):
        assert f.start_time == e.start_time
        assert f.end_time == e.end_time
        assert f.probability_yes_per_category == e.probability_yes_per_category
        assert f.source == e.source
