import json
import time

from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import translation

from questions.models import Question, GroupOfQuestions, Conditional
from users.models import User
from utils.aws import get_boto_client
from ..models import Post, Notebook


def drop_keys(obj: dict, drop: list):
    """Recursively remove keys from nested dicts (in-place)."""

    if isinstance(obj, dict):
        for key in list(obj.keys()):
            if key in drop:
                del obj[key]
            else:
                drop_keys(obj[key], drop)

    return obj


class PostVersionService:
    @classmethod
    def get_post_version_snapshot(cls, post: Post, updated_by: User = None) -> dict:
        """
        Generates a dictionary snapshot of the post's current state.
        """

        # Ensure we are using the original language for extraction
        with translation.override(settings.ORIGINAL_LANGUAGE_CODE):
            snapshot = cls._extract_fields(
                post,
                [
                    "id",
                    "title",
                    "short_title",
                    "content_original_lang",
                    "author_id",
                    "default_project_id",
                    "open_time",
                    "scheduled_close_time",
                    "scheduled_resolve_time",
                    "edited_at",
                ],
            )

            snapshot["updated_by_user_id"] = updated_by.id if updated_by else None

            if post.question_id:
                snapshot["question"] = cls._get_question_snapshot(post.question)
            elif post.group_of_questions_id:
                snapshot["group_of_questions"] = cls._get_group_snapshot(
                    post.group_of_questions
                )
            elif post.conditional_id:
                snapshot["conditional"] = cls._get_conditional_snapshot(
                    post.conditional
                )
            elif post.notebook_id:
                snapshot["notebook"] = cls._get_notebook_snapshot(post.notebook)

            return snapshot

    @classmethod
    def _get_question_snapshot(cls, question: Question) -> dict:
        common_fields = [
            "id",
            "type",
            "created_at",
            "edited_at",
            "open_time",
            "scheduled_close_time",
            "scheduled_resolve_time",
            "actual_resolve_time",
            "resolution_set_time",
            "actual_close_time",
            "cp_reveal_time",
            "spot_scoring_time",
            "resolution",
            "include_bots_in_aggregates",
            "question_weight",
            "default_score_type",
            "default_aggregation_method",
            "title",
            "description",
            "resolution_criteria",
            "fine_print",
            "label",
            "range_min",
            "range_max",
            "zero_point",
            "open_upper_bound",
            "open_lower_bound",
            "inbound_outcome_count",
            "unit",
            "options",
            "group_variable",
            "group_rank",
        ]
        data = cls._extract_fields(question, common_fields)

        return data

    @classmethod
    def _get_group_snapshot(cls, group: GroupOfQuestions) -> dict:
        data = cls._extract_fields(
            group,
            [
                "id",
                "graph_type",
                "subquestions_order",
                "group_variable",
                "description",
                "resolution_criteria",
                "fine_print",
                "edited_at",
            ],
        )

        data["questions"] = [
            cls._get_question_snapshot(q) for q in group.questions.all().order_by("id")
        ]
        return data

    @classmethod
    def _get_conditional_snapshot(cls, conditional: Conditional) -> dict:
        data = cls._extract_fields(
            conditional, ["id", "condition_id", "condition_child_id", "edited_at"]
        )
        data["question_yes"] = cls._get_question_snapshot(conditional.question_yes)
        data["question_no"] = cls._get_question_snapshot(conditional.question_no)

        return data

    @classmethod
    def _get_notebook_snapshot(cls, notebook: Notebook) -> dict:
        data = cls._extract_fields(notebook, ["id", "markdown", "feed_tile_summary"])
        data["image_url"] = str(notebook.image_url) if notebook.image_url else None

        return data

    @classmethod
    def _extract_fields(cls, obj, fields: list[str]) -> dict:
        """
        Helper to extract a list of fields from an object into a dictionary.
        """
        return {field: getattr(obj, field) for field in fields if hasattr(obj, field)}

    @classmethod
    def check_is_enabled(cls):
        return bool(settings.AWS_STORAGE_BUCKET_POST_VERSION_HISTORY)

    @classmethod
    def upload_snapshot_to_s3(cls, post: Post, snapshot: dict):
        """
        Uploads the snapshot to S3 as a JSON file.
        Path: post_versions/{post_id}/{timestamp}.json
        """

        s3 = get_boto_client("s3")

        key = f"post_versions/{post.id}/{round(time.time() * 1000)}.json"

        s3.put_object(
            Bucket=settings.AWS_STORAGE_BUCKET_POST_VERSION_HISTORY,
            Key=key,
            Body=json.dumps(snapshot, cls=DjangoJSONEncoder),
            ContentType="application/json",
        )

    @classmethod
    def get_latest_snapshot_from_s3(cls, post: Post) -> dict | None:
        s3 = get_boto_client("s3")
        prefix = f"post_versions/{post.id}/"

        response = s3.list_objects_v2(
            Bucket=settings.AWS_STORAGE_BUCKET_POST_VERSION_HISTORY,
            Prefix=prefix,
        )
        contents = response.get("Contents", [])
        if not contents:
            return None

        # Sort by Key (which contains timestamp) descending
        latest_obj = sorted(contents, key=lambda x: x["Key"], reverse=True)[0]

        obj = s3.get_object(
            Bucket=settings.AWS_STORAGE_BUCKET_POST_VERSION_HISTORY,
            Key=latest_obj["Key"],
        )
        return json.loads(obj["Body"].read().decode("utf-8"))

    @classmethod
    def hash_obj(cls, obj: dict) -> str:
        obj = obj.copy()
        drop = ["edited_at", "updated_by_user_id"]

        return json.dumps(drop_keys(obj, drop), sort_keys=True, cls=DjangoJSONEncoder)

    @classmethod
    def _snapshots_are_equal(cls, s1: dict, s2: dict) -> bool:
        """
        Compares two snapshots, ignoring metadata fields that always change.
        """
        # Create copies to avoid modifying originals

        return cls.hash_obj(s1) == cls.hash_obj(s2)

    @classmethod
    def generate_and_upload(cls, post: Post, updated_by: User = None):
        if not cls.check_is_enabled():
            return

        snapshot = cls.get_post_version_snapshot(post, updated_by)
        latest_snapshot = cls.get_latest_snapshot_from_s3(post)

        if latest_snapshot and cls._snapshots_are_equal(snapshot, latest_snapshot):
            return

        cls.upload_snapshot_to_s3(post, snapshot)
