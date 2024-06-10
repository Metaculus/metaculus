from django.db import models
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from projects.models import Project
from projects.serializers import (
    serialize_projects,
    validate_categories,
    QuestionProjectWriteSerializer,
    validate_tournaments,
)
from .models import Question


class QuestionSerializer(serializers.ModelSerializer):
    projects = serializers.SerializerMethodField()
    status = serializers.CharField()
    author_username = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = "__all__"

    def get_projects(self, obj: Question):
        return serialize_projects(obj.projects.all())

    def get_author_username(self, obj: Question):
        return obj.author.username


class QuestionWriteSerializer(serializers.ModelSerializer):
    projects = QuestionProjectWriteSerializer(required=False)

    class Meta:
        model = Question
        fields = (
            "title",
            "description",
            "type",
            "possibilities",
            "resolution",
            "projects",
        )


class QuestionFilterSerializer(serializers.Serializer):
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
