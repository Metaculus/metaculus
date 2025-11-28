from unittest.mock import patch, MagicMock

from django.test import override_settings

from posts.services.versioning import PostVersionService
from questions.models import Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.factories import create_question


class TestPostVersionService:
    def test_get_post_version_snapshot_question(self):
        question = create_question(
            question_type=Question.QuestionType.BINARY, title_original="Test Question"
        )
        post = factory_post(question=question, title_original="Test Post")

        snapshot = PostVersionService.get_post_version_snapshot(post)

        assert snapshot["id"] == post.id
        assert snapshot["title"] == "Test Post"
        assert snapshot["question"]["id"] == question.id
        assert snapshot["question"]["title"] == "Test Question"
        assert snapshot["question"]["type"] == "binary"

    @override_settings(AWS_STORAGE_BUCKET_POST_VERSION_HISTORY="test-bucket")
    @patch("posts.services.versioning.get_boto_client")
    def test_generate_and_upload_enabled(self, mock_get_client):
        mock_s3 = MagicMock()
        mock_get_client.return_value = mock_s3

        question = create_question(question_type=Question.QuestionType.BINARY)
        post = factory_post(question=question)

        PostVersionService.generate_and_upload(post)

        assert mock_s3.put_object.called
        call_args = mock_s3.put_object.call_args[1]
        assert call_args["Bucket"] == "test-bucket"
        assert f"post_versions/{post.id}/" in call_args["Key"]

    @override_settings(AWS_STORAGE_BUCKET_POST_VERSION_HISTORY=None)
    @patch("posts.services.versioning.get_boto_client")
    def test_generate_and_upload_disabled(self, mock_get_client):
        question = create_question(question_type=Question.QuestionType.BINARY)
        post = factory_post(question=question)

        PostVersionService.generate_and_upload(post)

        assert not mock_get_client.called
