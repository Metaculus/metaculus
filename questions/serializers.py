from rest_framework import serializers

from .models import Question


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = "__all__"


class QuestionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = (
            "description",
            "type",
            "possibilities",
            "resolution",
        )
