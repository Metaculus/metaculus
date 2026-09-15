from datetime import datetime

from django.utils import timezone
from rest_framework import status
from rest_framework.reverse import reverse

from projects.models import Project
from projects.services.common import get_site_main_project
from questions.models import Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import create_question
from users.models import User

CREATE_URL = reverse("post-create")


def _source_question(
    author: User,
    project: Project,
    *,
    title: str,
    question_type=Question.QuestionType.BINARY,
    **kwargs,
) -> Question:
    question = create_question(
        title_original=title,
        description_original=f"{title} description",
        resolution_criteria_original=f"{title} resolution criteria",
        fine_print_original=f"{title} fine print",
        question_type=question_type,
        open_time=timezone.make_aware(datetime(2024, 3, 1)),
        scheduled_close_time=timezone.make_aware(datetime(2024, 5, 1)),
        scheduled_resolve_time=timezone.make_aware(datetime(2024, 5, 2)),
        **kwargs,
    )
    factory_post(
        author=author,
        question=question,
        default_project=project,
        short_title_original=f"{title} short",
    )
    return question


def _private_project() -> Project:
    return factory_project(
        default_permission=None, type=Project.ProjectTypes.TOURNAMENT
    )


def _create_conditional(client, condition: Question, child: Question):
    return client.post(
        CREATE_URL,
        {
            "default_project": get_site_main_project().pk,
            "projects": {},
            "conditional": {
                "condition_id": condition.id,
                "condition_child_id": child.id,
            },
        },
        format="json",
    )


class TestConditionalCreatePermissions:
    def test_private_condition_is_rejected(self, user1, user2, user1_client):
        condition = _source_question(user2, _private_project(), title="private")
        child = _source_question(
            user2,
            get_site_main_project(),
            title="public",
            question_type=Question.QuestionType.NUMERIC,
            range_min=0,
            range_max=100,
            inbound_outcome_count=100,
            open_lower_bound=False,
            open_upper_bound=False,
        )

        response = _create_conditional(user1_client, condition, child)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Question ID does not exist" in str(response.data)

    def test_private_condition_child_is_rejected(self, user1, user2, user1_client):
        condition = _source_question(user2, get_site_main_project(), title="public")
        child = _source_question(user2, _private_project(), title="private")

        response = _create_conditional(user1_client, condition, child)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Question ID does not exist" in str(response.data)

    def test_private_source_error_does_not_confirm_existence(
        self, user1, user2, user1_client
    ):
        # A hidden source and a nonexistent id must be indistinguishable
        private = _source_question(user2, _private_project(), title="private")
        public = _source_question(user2, get_site_main_project(), title="public")

        hidden = _create_conditional(user1_client, public, private)
        missing = _create_conditional(user1_client, public, Question(id=10**9))

        assert hidden.status_code == missing.status_code
        assert str(hidden.data) == str(missing.data)

    def test_source_without_a_post_is_rejected(self, user1, user1_client):
        # Question.post is still nullable, and such a question has no post to
        # authorize against
        condition = _source_question(user1, get_site_main_project(), title="cond")
        child = _source_question(user1, get_site_main_project(), title="child")
        Question.objects.filter(id=child.id).update(post=None)

        response = _create_conditional(user1_client, condition, child)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Question ID does not exist" in str(response.data)

    def test_viewable_sources_are_accepted(self, user1, user1_client):
        condition = _source_question(user1, get_site_main_project(), title="cond")
        child = _source_question(
            user1,
            get_site_main_project(),
            title="child",
            question_type=Question.QuestionType.NUMERIC,
            range_min=0,
            range_max=100,
            inbound_outcome_count=100,
            open_lower_bound=False,
            open_upper_bound=False,
        )

        response = _create_conditional(user1_client, condition, child)

        assert response.status_code == status.HTTP_201_CREATED

    def test_own_private_sources_are_accepted(self, user1, user1_client):
        # The project creator retains admin permission on their own project
        project = factory_project(
            default_permission=None,
            type=Project.ProjectTypes.TOURNAMENT,
            created_by=user1,
        )
        condition = _source_question(user1, project, title="cond")
        child = _source_question(user1, project, title="child")

        response = _create_conditional(user1_client, condition, child)

        assert response.status_code == status.HTTP_201_CREATED

    def test_private_source_is_rejected_on_update(self, user1, user2, user1_client):
        condition = _source_question(user1, get_site_main_project(), title="cond")
        child = _source_question(user1, get_site_main_project(), title="child")
        created = _create_conditional(user1_client, condition, child)
        assert created.status_code == status.HTTP_201_CREATED

        private_child = _source_question(user2, _private_project(), title="private")

        response = user1_client.put(
            reverse("post-update", kwargs={"pk": created.data["id"]}),
            {
                "conditional": {
                    "condition_id": condition.id,
                    "condition_child_id": private_child.id,
                }
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Question ID does not exist" in str(response.data)
