from typing import Union

from django.db import models
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from comments.models import Comment
from projects.models import Project
from projects.permissions import ObjectPermission
from projects.serializers import (
    validate_categories,
    validate_tournaments,
    serialize_projects,
    PostProjectWriteSerializer,
)
from questions.serializers import (
    QuestionWriteSerializer,
    serialize_question,
    serialize_conditional,
    serialize_group,
    ConditionalWriteSerializer,
    GroupOfQuestionsWriteSerializer,
)
from users.models import User
from .models import Notebook, Post


class NotebookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notebook
        fields = "__all__"


class PostSerializer(serializers.ModelSerializer):
    projects = serializers.SerializerMethodField()
    author_username = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = (
            "id",
            "title",
            "author_id",
            "author_username",
            "projects",
            "created_at",
            "published_at",
            "edited_at",
            "curation_status",
            "comment_count" "resolved_at",
            "closed_at",
        )

    def get_projects(self, obj: Post):
        return serialize_projects(obj.projects.all())

    def get_author_username(self, obj: Post):
        return obj.author.username

    def get_comment_count(self, obj: Post):
        return Comment.objects.filter(on_post=obj).count()


class NotebookWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notebook
        fields = "markdown"


class PostWriteSerializer(serializers.ModelSerializer):
    projects = PostProjectWriteSerializer(required=False)
    question = QuestionWriteSerializer(required=False)
    conditional = ConditionalWriteSerializer(required=False)
    group_of_questions = GroupOfQuestionsWriteSerializer(required=False)
    notebook = NotebookWriteSerializer(required=False)

    class Meta:
        model = Post
        fields = (
            "title",
            "projects",
            "question",
            "conditional",
            "group_of_questions",
            "notebook",
        )


class PostFilterSerializer(serializers.Serializer):
    class Order(models.TextChoices):
        MOST_FORECASTERS = "most_forecasters"
        CLOSED_AT = "closed_at"
        RESOLVED_AT = "resolved_at"
        CREATED_AT = "created_at"

    class Access(models.TextChoices):
        PRIVATE = "private"
        PUBLIC = "public"

    ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    access = serializers.ChoiceField(required=False, choices=Access.choices)
    topic = serializers.CharField(required=False)
    tags = serializers.ListField(child=serializers.CharField(), required=False)
    categories = serializers.ListField(child=serializers.CharField(), required=False)
    tournaments = serializers.ListField(child=serializers.CharField(), required=False)
    forecast_type = serializers.ListField(child=serializers.CharField(), required=False)
    statuses = serializers.ListField(child=serializers.CharField(), required=False)
    answered_by_me = serializers.BooleanField(required=False, allow_null=True)
    permission = serializers.ChoiceField(
        required=False,
        choices=ObjectPermission.choices + [ObjectPermission.CREATOR],
    )
    order = serializers.ChoiceField(
        choices=Order.choices, required=False, allow_null=True
    )
    notebook_type = serializers.ChoiceField(
        choices=Notebook.NotebookType.choices, required=False, allow_null=True
    )
    news_type = serializers.CharField(required=False)
    public_figure = serializers.CharField(required=False)

    search = serializers.CharField(required=False, allow_null=True)

    def validate_public_figure(self, value: int):
        try:
            return Project.objects.filter(pk=value)
        except Project.DoesNotExist:
            raise ValidationError("Slug does not exist")

    def validate_news_type(self, value: str):
        try:
            return Project.objects.get(
                name__iexact=value, type=Project.ProjectTypes.NEWS_CATEGORY
            )
        except Project.DoesNotExist:
            raise ValidationError("Slug does not exist")

    def validate_topic(self, value: str):
        try:
            return Project.objects.filter_topic().filter_active().get(slug=value)
        except Project.DoesNotExist:
            raise ValidationError("Slug does not exist")

    def validate_tags(self, values: list[str]):
        tags = Project.objects.filter_tags().filter_active().filter(slug__in=values)
        slugs = {obj.slug for obj in tags}

        for value in values:
            if value not in slugs:
                raise ValidationError(f"Tag {value} does not exist")

        return tags

    def validate_categories(self, values: list[str]):
        return validate_categories(lookup_field="slug", lookup_values=values)

    def validate_tournaments(self, values: list[str]):
        return validate_tournaments(lookup_field="slug", lookup_values=values)


def serialize_post(
    post: Post,
    with_forecasts: bool = False,
    current_user: User = None,
) -> dict:
    serialized_data = PostSerializer(post).data

    if post.question:
        serialized_data["question"] = serialize_question(
            post.question, with_forecasts=with_forecasts, current_user=current_user
        )

    if post.conditional:
        serialized_data["conditional"] = serialize_conditional(
            post.conditional, with_forecasts=with_forecasts, current_user=current_user
        )

    if post.group_of_questions:
        serialized_data["group_of_questions"] = serialize_group(
            post.group_of_questions,
            with_forecasts=with_forecasts,
            current_user=current_user,
        )

    if post.notebook:
        serialized_data["notebook"] = NotebookSerializer(post.notebook).data

    # Permissions
    serialized_data["user_permission"] = post.user_permission

    # Annotate user's vote
    serialized_data["vote"] = {
        "score": post.vote_score,
        "user_vote": post.user_vote,
    }
    # Forecasters
    serialized_data["nr_forecasters"] = post.nr_forecasters

    return serialized_data


def serialize_post_many(
    data: Union[Post.objects, list[Post]],
    with_forecasts: bool = False,
    current_user: User = None,
) -> list[dict]:
    qs = Post.objects.filter(pk__in=[p.pk for p in data])

    qs = (
        qs.annotate_forecasts_count()
        .annotate_user_permission(user=current_user)
        .annotate_vote_score()
        .annotate_nr_forecasters()
        .prefetch_projects()
        .prefetch_questions()
    )
    if current_user and not current_user.is_anonymous:
        qs = qs.annotate_user_vote(current_user)

    if with_forecasts:
        qs = qs.prefetch_forecasts()

    return [
        serialize_post(post, with_forecasts=with_forecasts, current_user=current_user)
        for post in qs.all()
    ]
