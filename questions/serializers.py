from django.db import models
from rest_framework import serializers

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

    topic = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.filter_topic().filter_active(), required=False
    )
    tags = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Project.objects.filter_tags().filter_active(),
        required=False,
    )
    categories = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Project.objects.filter_category().filter_active(),
        required=False,
    )
    answered_by_me = serializers.BooleanField(required=False, allow_null=True)
    order = serializers.ChoiceField(choices=Order.choices, required=False, allow_null=True)

    search = serializers.CharField(required=False, allow_null=True)
