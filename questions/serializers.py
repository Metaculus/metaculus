from rest_framework import serializers

from .models import Question


class QuestionSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = "__all__"
    
    def get_status(self, obj):
        return obj.status


class QuestionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = (
            "description",
            "type",
            "possibilities",
            "resolution",
        )
