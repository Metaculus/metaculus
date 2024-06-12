from django.db import models
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from projects.models import Project
from projects.serializers import (
    validate_categories,
    validate_tournaments,
    serialize_projects,
    PostProjectWriteSerializer,
)
from questions.serializers import QuestionSerializer, QuestionWriteSerializer
from .models import Post


class PostSerializer(serializers.ModelSerializer):
    question = QuestionSerializer()
    projects = serializers.SerializerMethodField()
    author_username = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = (
            "id",
            "title",
            "author_username",
            "projects",
            "question",
            "created_at",
            "published_at",
            "edited_at",
        )

    def get_projects(self, obj: Post):
        return serialize_projects(obj.projects.all())

    def get_author_username(self, obj: Post):
        return obj.author.username


class PostWriteSerializer(serializers.ModelSerializer):
    projects = PostProjectWriteSerializer(required=False)
    question = QuestionWriteSerializer(required=True)

    class Meta:
        model = Post
        fields = ("title", "projects", "question")


class PostFilterSerializer(serializers.Serializer):
    class Order(models.TextChoices):
        MOST_FORECASTERS = "most_forecasters"
        CLOSED_AT = "closed_at"
        RESOLVED_AT = "resolved_at"
        CREATED_AT = "created_at"

    topic = serializers.CharField(required=False)
    tags = serializers.ListField(child=serializers.CharField(), required=False)
    categories = serializers.ListField(child=serializers.CharField(), required=False)
    tournaments = serializers.ListField(child=serializers.CharField(), required=False)
    forecast_type = serializers.ListField(child=serializers.CharField(), required=False)
    status = serializers.ListField(child=serializers.CharField(), required=False)
    answered_by_me = serializers.BooleanField(required=False, allow_null=True)
    order = serializers.ChoiceField(
        choices=Order.choices, required=False, allow_null=True
    )

    search = serializers.CharField(required=False, allow_null=True)

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
