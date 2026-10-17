import io
import zipfile

from rest_framework import status
from rest_framework.reverse import reverse

from posts.models import Post
from projects.models import Project
from questions.models import Question
from questions.types import AggregationMethod
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_questions.factories import create_question
from tests.unit.utils import datetime_aware
from users.models import User
from utils.serializers import DataGetRequestSerializer


class TestDataGetRequestSerializerAggregationMethods:
    def _validated(self, data: dict) -> dict:
        serializer = DataGetRequestSerializer(data=data, context={"user": None})
        assert serializer.is_valid(), serializer.errors
        return serializer.validated_data

    def test_all_drops_cohort_methods_without_joined_before_date(self):
        methods = self._validated({"aggregation_methods": "all"})["aggregation_methods"]

        assert "joined_before_date" not in methods
        assert "recency_weighted" in methods

    def test_all_keeps_cohort_methods_with_joined_before_date(self):
        methods = self._validated(
            {
                "aggregation_methods": "all",
                "joined_before_date": datetime_aware(2024, 1, 1).isoformat(),
            }
        )["aggregation_methods"]

        assert "joined_before_date" in methods
        assert "recency_weighted" in methods

    def test_all_drops_single_aggregation_for_non_staff(self):
        methods = self._validated({"aggregation_methods": "all"})["aggregation_methods"]

        assert AggregationMethod.SINGLE_AGGREGATION not in methods

    def test_all_keeps_single_aggregation_for_staff(self, user_admin: User):
        user_admin.is_staff = True
        serializer = DataGetRequestSerializer(
            data={"aggregation_methods": "all"}, context={"user": user_admin}
        )
        assert serializer.is_valid(), serializer.errors

        methods = serializer.validated_data["aggregation_methods"]

        assert AggregationMethod.SINGLE_AGGREGATION in methods

    def test_non_staff_single_aggregation_alone_leaves_no_methods(self):
        # Filtering the staff-only method empties the list, which the
        # "methods must be set" rule then rejects
        serializer = DataGetRequestSerializer(
            data={
                "aggregation_methods": AggregationMethod.SINGLE_AGGREGATION,
                "include_bots": True,
            },
            context={"user": None},
        )

        assert not serializer.is_valid()
        assert "aggregation_methods must also be set" in str(serializer.errors)

    def test_named_cohort_method_without_joined_before_date_is_invalid(self):
        serializer = DataGetRequestSerializer(
            data={"aggregation_methods": "joined_before_date"}, context={"user": None}
        )

        assert not serializer.is_valid()
        assert "joined_before_date is required" in str(serializer.errors)


class TestAggregationExplorer:
    url = reverse("aggregation_explorer")

    def _post_for(self, question: Question):
        post = factory_post(question=question)
        question.open_time = datetime_aware(2024, 1, 1)
        question.save()
        return post

    def test_joined_before_date_without_date_returns_400(
        self, user1_client, question_binary: Question
    ):
        post = self._post_for(question_binary)

        response = user1_client.get(
            self.url,
            {"post_id": post.id, "aggregation_methods": "joined_before_date"},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_joined_before_date_with_blank_date_returns_400(
        self, user1_client, question_binary: Question
    ):
        # The front end always sends the param, blank when no date was picked
        post = self._post_for(question_binary)

        response = user1_client.get(
            self.url,
            {
                "post_id": post.id,
                "aggregation_methods": "joined_before_date",
                "joined_before_date": "",
            },
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_all_methods_without_joined_before_date_is_accepted(
        self, user1_client, question_binary: Question
    ):
        post = self._post_for(question_binary)

        response = user1_client.get(
            self.url, {"post_id": post.id, "aggregation_methods": "all"}
        )

        assert response.status_code == status.HTTP_200_OK

    def test_joined_before_date_with_date_is_accepted(
        self, user1_client, question_binary: Question
    ):
        post = self._post_for(question_binary)

        response = user1_client.get(
            self.url,
            {
                "post_id": post.id,
                "aggregation_methods": "joined_before_date",
                "joined_before_date": datetime_aware(2024, 1, 1).isoformat(),
            },
        )

        assert response.status_code == status.HTTP_200_OK


class TestDownloadData:
    def test_joined_before_date_without_date_returns_400(
        self, user1_client, question_binary: Question
    ):
        post = factory_post(question=question_binary)
        question_binary.open_time = datetime_aware(2024, 1, 1)
        question_binary.save()

        response = user1_client.get(
            reverse("posts-download-data", args=[post.id]),
            {"aggregation_methods": "joined_before_date"},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


def exported_question_ids(response) -> list[int]:
    archive = zipfile.ZipFile(io.BytesIO(response.content))
    rows = archive.read("question_data.csv").decode().splitlines()[1:]
    return [int(row.split(",")[0]) for row in rows if row.strip()]


class TestDownloadDataPermissions:
    """
    The ids naming an export (question_id, post_id, project_id) need not resolve
    to the same objects, so each one has to be authorized on its own.
    """

    url = reverse("download_data")

    def _question(self, title: str) -> Question:
        return create_question(
            question_type=Question.QuestionType.BINARY,
            title=title,
            scheduled_close_time=datetime_aware(2025, 6, 1),
        )

    def _private_project(self) -> Project:
        return factory_project(
            default_permission=None, type=Project.ProjectTypes.TOURNAMENT
        )

    def test_question_id_is_checked_alone(self, anon_client):
        question = self._question("private")
        factory_post(question=question, default_project=self._private_project())

        response = anon_client.get(self.url, {"question_id": question.id})

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_question_id_is_checked_alongside_a_viewable_post_id(self, anon_client):
        # A viewable post_id must not authorize a question_id naming another post
        private_question = self._question("private")
        factory_post(question=private_question, default_project=self._private_project())
        public_post = factory_post(question=self._question("public"))

        response = anon_client.get(
            self.url, {"post_id": public_post.id, "question_id": private_question.id}
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_sub_question_is_checked_alongside_a_viewable_post_id(self, anon_client):
        private_question = self._question("private")
        factory_post(question=private_question, default_project=self._private_project())
        public_post = factory_post(question=self._question("public"))

        response = anon_client.get(
            self.url,
            {"post_id": public_post.id, "sub_question": private_question.id},
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_post_ids_are_each_checked(self, anon_client):
        public_post = factory_post(question=self._question("public"))
        private_post = factory_post(
            question=self._question("private"),
            default_project=self._private_project(),
        )

        response = anon_client.get(
            self.url, {"post_ids": [public_post.id, private_post.id]}
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_project_export_skips_posts_the_user_cannot_view(self, anon_client):
        project = factory_project(type=Project.ProjectTypes.TOURNAMENT)
        public_question = self._question("public")
        factory_post(question=public_question, default_project=project)
        draft_question = self._question("draft")
        factory_post(
            question=draft_question,
            default_project=project,
            curation_status=Post.CurationStatus.DRAFT,
        )

        response = anon_client.get(self.url, {"project_id": project.id})

        assert response.status_code == status.HTTP_200_OK
        assert exported_question_ids(response) == [public_question.id]

    def test_project_export_of_only_hidden_posts_returns_404(self, anon_client):
        project = factory_project(type=Project.ProjectTypes.TOURNAMENT)
        factory_post(
            question=self._question("draft"),
            default_project=project,
            curation_status=Post.CurationStatus.DRAFT,
        )

        response = anon_client.get(self.url, {"project_id": project.id})

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_viewable_post_id_still_exports(self, anon_client):
        question = self._question("public")
        post = factory_post(question=question)

        response = anon_client.get(self.url, {"post_id": post.id})

        assert response.status_code == status.HTTP_200_OK
        assert exported_question_ids(response) == [question.id]

    def test_viewable_question_id_still_exports(self, anon_client):
        question = self._question("public")
        factory_post(question=question)

        response = anon_client.get(self.url, {"question_id": question.id})

        assert response.status_code == status.HTTP_200_OK
        assert exported_question_ids(response) == [question.id]
