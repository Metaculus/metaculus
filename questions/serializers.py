from rest_framework import serializers

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
