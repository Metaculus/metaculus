from rest_framework import serializers

from users.models import User
from .models import Question, Conditional, GroupOfQuestions
from .services import build_question_forecasts, build_question_resolution


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
    """
    Contains basic info about conditional questions
    """

    class Meta:
        model = Conditional
        fields = ("id",)


class GroupOfQuestionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupOfQuestions
        fields = ("id",)


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
        serialized_data["forecasts"] = build_question_forecasts(question, current_user)

    serialized_data["resolution"] = build_question_resolution(question)

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
