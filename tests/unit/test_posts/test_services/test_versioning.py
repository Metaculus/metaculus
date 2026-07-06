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
        # Mock list_objects_v2 to return empty so it proceeds to upload
        mock_s3.list_objects_v2.return_value = {}

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

    @override_settings(AWS_STORAGE_BUCKET_POST_VERSION_HISTORY="test-bucket")
    @patch("posts.services.versioning.get_boto_client")
    def test_generate_and_upload_deduplication(self, mock_get_client):
        mock_s3 = MagicMock()
        mock_get_client.return_value = mock_s3

        question = create_question(question_type=Question.QuestionType.BINARY)
        post = factory_post(question=question)

        # 1. First upload (no existing snapshot)
        # Mock list_objects_v2 to return empty
        mock_s3.list_objects_v2.return_value = {}

        PostVersionService.generate_and_upload(post)
        assert mock_s3.put_object.call_count == 1

        # 2. Second upload (same content)
        # Mock list_objects_v2 to return the uploaded file
        # And get_object to return the content of the first snapshot

        # Capture the uploaded content from the first call
        call_args = mock_s3.put_object.call_args[1]
        uploaded_body = call_args["Body"]  # This is a JSON string

        mock_s3.list_objects_v2.return_value = {"Contents": [{"Key": call_args["Key"]}]}
        mock_s3.get_object.return_value = {
            "Body": MagicMock(read=lambda: uploaded_body.encode("utf-8"))
        }

        # Reset put_object mock to verify it's NOT called
        mock_s3.put_object.reset_mock()

        PostVersionService.generate_and_upload(post)
        assert mock_s3.put_object.call_count == 0

        # 3. Third upload (changed content)
        # Change title
        post.title = "New Title"
        post.save()

        PostVersionService.generate_and_upload(post)
        assert mock_s3.put_object.call_count == 1
