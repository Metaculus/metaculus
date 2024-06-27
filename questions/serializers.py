from django.db import models
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from users.models import User
from .models import Question, Conditional, GroupOfQuestions
from .services import build_question_forecasts, build_question_forecasts_for_user


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = "__all__"


class QuestionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = (
            "title",
            "description",
            "type",
            "possibilities",
            "resolution",
            "max",
            "min",
            "zero_point",
            "open_upper_bound",
            "open_lower_bound",
            "options",
            "resolved_at",
        )


class ConditionalSerializer(serializers.ModelSerializer):
    """
    Contains basic info about conditional questions
    """

    class Meta:
        model = Conditional
        fields = ("id",)


class ConditionalWriteSerializer(serializers.ModelSerializer):
    condition_id = serializers.IntegerField()
    condition_child_id = serializers.IntegerField()

    class Meta:
        model = Conditional
        fields = ("condition_id", "condition_child_id")

    def validate_condition_id(self, value):
        question = Question.objects.filter(pk=value).first()

        if not question:
            raise ValidationError("Condition does not exist")

        if question.type != Question.QuestionType.BINARY:
            raise ValidationError("Condition can only be binary question")

        return value

    def validate_condition_child_id(self, value):
        question = Question.objects.filter(pk=value).first()

        if not question:
            raise ValidationError("Condition Child does not exist")

        return value


class GroupOfQuestionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupOfQuestions
        fields = ("id",)


class GroupOfQuestionsWriteSerializer(serializers.ModelSerializer):
    questions = QuestionWriteSerializer(many=True, required=True, partial=True)

    class Meta:
        model = GroupOfQuestions
        fields = ("questions",)


def serialize_question(
    question: Question,
    with_forecasts: bool = False,
    current_user: User = None,
):
    """
    Serializes question object
    """

    serialized_data = QuestionSerializer(question).data

    if with_forecasts:
        serialized_data["forecasts"] = build_question_forecasts(question)

        if current_user and not current_user.is_anonymous:
            serialized_data["my_forecasts"] = build_question_forecasts_for_user(
                question, current_user
            )

    serialized_data["resolution"] = question.resolution

    return serialized_data


def serialize_conditional(
    conditional: Conditional, with_forecasts: bool = False, current_user: User = None
):
    # Serialization of basic data
    serialized_data = ConditionalSerializer(conditional).data

    # Generic questions
    serialized_data["condition"] = serialize_question(
        conditional.condition, with_forecasts=False
    )
    serialized_data["condition_child"] = serialize_question(
        conditional.condition_child, with_forecasts=False
    )

    # Autogen questions
    serialized_data["question_yes"] = serialize_question(
        conditional.question_yes,
        with_forecasts=with_forecasts,
        current_user=current_user,
    )
    serialized_data["question_no"] = serialize_question(
        conditional.question_no,
        with_forecasts=with_forecasts,
        current_user=current_user,
    )

    return serialized_data


def serialize_group(
    group: GroupOfQuestions, with_forecasts: bool = False, current_user: User = None
):
    # Serialization of basic data
    serialized_data = GroupOfQuestionsSerializer(group).data
    serialized_data["questions"] = []

    for question in group.questions.all():
        serialized_data["questions"].append(
            serialize_question(
                question, with_forecasts=with_forecasts, current_user=current_user
            )
        )

    return serialized_data
