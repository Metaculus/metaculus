import numpy as np

from migrator.utils import paginated_query
from questions.models import Forecast, Question
from users.models import User


def create_forecast(
    prediction: dict, questions_dict: dict, users_dict: dict
) -> Forecast:
    question = questions_dict.get(prediction["question_id"], None)
    if question is None or prediction["user_id"] is None:
        return None

    spv = prediction["stored_prediction_values"]
    continuous_cdf = None
    probability_yes = None
    probability_yes_per_category = None
    if question.type == Question.QuestionType.BINARY:
        probability_yes = spv[1]
    elif question.type in (Question.QuestionType.NUMERIC, Question.QuestionType.DATE):
        continuous_pdf = spv
        vals = np.roll(continuous_pdf, 1)
        cdf = np.cumsum(vals)[..., :-1]
        continuous_cdf = cdf.tolist()
    elif question.type == Question.QuestionType.MULTIPLE_CHOICE:
        probability_yes_per_category = spv

    new_forecast = Forecast(
        id=prediction["id"],
        start_time=prediction["start_time"],
        end_time=prediction["end_time"],
        continuous_cdf=continuous_cdf,
        probability_yes=probability_yes,
        probability_yes_per_category=probability_yes_per_category,
        distribution_components=prediction["distribution_components"],
        author=users_dict[prediction["user_id"]],
        question=question,
        slider_values=None,
    )

    return new_forecast


def migrate_forecasts():
    forecasts = []
    questions = Question.objects.all()
    questions_dict = {x.id: x for x in questions}
    users = User.objects.all()
    users_dict = {x.id: x for x in users}

    # Add `limit 300000` to get a sizeable amount but have the migration be faster
    for i, old_prediction in enumerate(
        # flake
        paginated_query(
            "SELECT p.*, ps.user_id, ps.question_id, ps.aggregation_method FROM metac_question_prediction p JOIN metac_question_predictionsequence ps ON p.prediction_sequence_id = ps.id AND aggregation_method = 'none' "
        )
    ):  # limit 300000
        if (i + 1) % 150000 == 0:
            print(
                f"Went through {(i + 1)} predictions and generate {len(forecasts) + 1} forecasts!"
            )
        forecast = create_forecast(old_prediction, questions_dict, users_dict)
        if forecast is not None:
            forecasts.append(forecast)
    print("Bulk inserting forecasts")
    batches = [forecasts[i : i + 50000] for i in range(0, len(forecasts), 50000)]
    for batch in batches:
        Forecast.objects.bulk_create(batch)
