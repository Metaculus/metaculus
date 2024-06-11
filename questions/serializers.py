from rest_framework import serializers

from .models import Question, Conditional, GroupOfQuestions


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


class ConditionalSerializer(serializers.ModelSerializer):
    condition = QuestionSerializer()
    condition_child = QuestionSerializer()
    question_yes = QuestionSerializer()
    question_no = QuestionSerializer()

    class Meta:
        model = Conditional
        fields = (
            "condition",
            "condition_child",
            "question_yes",
            "question_no",
        )


class GroupOfQuestionsSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)

    class Meta:
        model = GroupOfQuestions
        fields = ("questions",)
