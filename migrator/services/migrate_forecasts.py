from migrator.utils import paginated_query, one2one_query
from questions.models import Forecast, Question
import json
from dateutil.parser import parse as date_parse

from users.models import User


def create_forecast(prediction: dict) -> Forecast:
    question = Question.objects.filter(id=prediction["question_id"]).first()
    if question is None or prediction["user_id"] is None:
        return None

    spv = prediction["stored_prediction_values"]
    continuous_prediction_values = None
    probability_yes = None
    probability_yes_per_category = None
    if question.type == "binary":
        probability_yes = spv[1]
    elif question.type == "numeric" or question.type == "date":
        continuous_prediction_values = spv
    elif question.type == "multiple_choice":
        probability_yes_per_category = spv

    new_forecast = Forecast(
        id=prediction["id"],
        start_time=prediction["start_time"],
        end_time=prediction["end_time"],
        continuous_prediction_values=continuous_prediction_values,
        probability_yes=probability_yes,
        probability_yes_per_category=probability_yes_per_category,
        distribution_components=prediction["distribution_components"],
        author=User.objects.get(id=prediction["user_id"]),
        question=question,
    )

    return new_forecast


def migrate_forecasts():
    forecasts = []
    for old_prediction in paginated_query(
        "SELECT p.*, ps.user_id, ps.question_id, ps.aggregation_method FROM metac_question_prediction p JOIN metac_question_predictionsequence ps ON p.prediction_sequence_id = ps.id AND aggregation_method = 'none' limit 150000"
    ):
        forecast = create_forecast(old_prediction)
        if forecast is not None:
            forecasts.append(forecast)
    Forecast.objects.bulk_create(forecasts)
