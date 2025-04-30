from questions.models import Question, Conditional, GroupOfQuestions, Forecast
from .common import (
    QuestionSerializer,
    MyForecastSerializer,
    ConditionalSerializer,
    GroupOfQuestionsSerializer,
)
from ..utils import calculate_question_lifespan_from_date


def _serialize_question(
    question: Question, user_forecast: Forecast, question_movement: float | None
):
    return {
        **QuestionSerializer(question).data,
        "my_forecast": (
            {
                "latest": MyForecastSerializer(user_forecast).data,
                # Movement since last forecast
                "movement": question_movement,
                # Lifetime since last forecast
                "lifetime_elapsed": (
                    calculate_question_lifespan_from_date(
                        question, user_forecast.start_time
                    )
                ),
            }
            if user_forecast
            else None
        ),
    }


def _serialize_conditional(
    conditional: Conditional,
    user_question_forecasts_map: dict[Question, Forecast] | None = None,
    question_movement_map: dict[Question, float] | None = None,
):
    # Serialization of basic data
    serialized_data = ConditionalSerializer(conditional).data

    # Generic questions
    serialized_data["condition"] = QuestionSerializer(conditional.condition).data
    serialized_data["condition_child"] = QuestionSerializer(
        conditional.condition_child,
    ).data

    # Autogen questions
    serialized_data["question_yes"] = _serialize_question(
        conditional.question_yes,
        user_forecast=user_question_forecasts_map.get(conditional.question_yes),
        question_movement=question_movement_map.get(conditional.question_yes),
    )
    serialized_data["question_no"] = _serialize_question(
        conditional.question_no,
        user_forecast=user_question_forecasts_map.get(conditional.question_no),
        question_movement=question_movement_map.get(conditional.question_no),
    )

    return serialized_data


def _serialize_group(
    group: GroupOfQuestions,
    user_question_forecasts_map: dict[Question, Forecast] | None = None,
    question_movement_map: dict[Question, float] | None = None,
):
    return {
        **GroupOfQuestionsSerializer(group).data,
        "questions": [
            _serialize_question(
                question,
                user_forecast=user_question_forecasts_map.get(question),
                question_movement=question_movement_map.get(question),
            )
            for question in group.questions.all()
        ],
    }


def serialize_forecasting_flow_content(
    question: Question = None,
    conditional: Conditional = None,
    group_of_questions: GroupOfQuestions = None,
    user_question_forecasts_map: dict[Question, Forecast] | None = None,
    question_movement_map: dict[Question, float] | None = None,
) -> dict:
    serialized_data = {}

    if question:
        serialized_data["question"] = _serialize_question(
            question,
            user_forecast=user_question_forecasts_map.get(question),
            question_movement=question_movement_map.get(question),
        )

    if conditional:
        serialized_data["conditional"] = _serialize_conditional(
            conditional,
            user_question_forecasts_map=user_question_forecasts_map,
            question_movement_map=question_movement_map,
        )

    if group_of_questions:
        serialized_data["group_of_questions"] = _serialize_group(
            group_of_questions,
            user_question_forecasts_map=user_question_forecasts_map,
            question_movement_map=question_movement_map,
        )

    return serialized_data
