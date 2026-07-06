from datetime import datetime

import freezegun
import pytest  # noqa
from django.utils.timezone import make_aware

from posts.models import Post
from posts.services.common import create_post, approve_post
from questions.constants import QuestionStatus, UnsuccessfulResolutionType
from questions.jobs import job_close_question
from questions.models import Question
from questions.services.lifecycle import resolve_question, unresolve_question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_question
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
