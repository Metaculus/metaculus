from django.db import models
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from projects.models import Project
from projects.serializers import serialize_projects
from .models import Question


class QuestionSerializer(serializers.ModelSerializer):
    projects = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = "__all__"

    def get_projects(self, obj: Question):
        return serialize_projects(obj.projects.all())


class QuestionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = (
            "title",
            "description",
            "type",
            "possibilities",
            "resolution",
        )


class QuestionFilterSerializer(serializers.Serializer):
    class Order(models.TextChoices):
        MOST_FORECASTERS = "most_forecasters", "Most Forecasters"
        CLOSED_AT = "closed_at", "Closed At"
        RESOLVED_AT = "resolved_at", "Resolved At"
        CREATED_AT = "created_at", "Created At"

    topic = serializers.CharField(required=False)
    tags = serializers.ListField(child=serializers.CharField(), required=False)
    categories = serializers.ListField(child=serializers.CharField(), required=False)
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
        categories = (
            Project.objects.filter_category().filter_active().filter(slug__in=values)
        )
        slugs = {obj.slug for obj in categories}

        for value in values:
            if value not in slugs:
                raise ValidationError(f"Category {value} does not exist")

        return categories
