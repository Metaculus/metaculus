import numpy as np
import json
from datetime import datetime, timezone as dt_timezone

from django.db import connection
from django.utils import timezone
from django.db.models import Count, F, Q
from django.db.models.functions import Coalesce
from sql_util.aggregates import SubqueryAggregate

from migrator.services.migrate_questions import migrate_post_snapshots_forecasts
from migrator.utils import paginated_query
from posts.models import Post
from questions.models import AggregateForecast, Forecast, Question
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
        slider_values = None
    elif question.type in (Question.QuestionType.NUMERIC, Question.QuestionType.DATE):
        continuous_pdf = spv
        vals = np.roll(continuous_pdf, 1)
        cdf = np.cumsum(vals)[..., :-1]
        continuous_cdf = cdf.tolist()
        distribution_components = [
            json.loads(c) for c in prediction["distribution_components"]
        ]
        weights = []
        forecast = []
        for component in distribution_components:
            weights.append(component["weight"])
            skew = component["skew"]
            scale = component["scale"]
            location = component["location"]
            center = (location + 0.15) / 1.3
            scaling = np.tanh(np.sqrt(scale)) / 2
            left = center + (skew - 1) * scaling
            right = center + (skew + 1) * scaling
            forecast.append(
                {
                    "left": left,
                    "center": center,
                    "right": right,
                }
            )

        slider_values = {"weights": weights, "forecast": forecast}

    elif question.type == Question.QuestionType.MULTIPLE_CHOICE:
        probability_yes_per_category = spv
        slider_values = None

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
        slider_values=slider_values,
    )

    return new_forecast


def migrate_forecasts(qty: int | None = None):
    forecasts = []
    questions = Question.objects.all()
    questions_dict = {x.id: x for x in questions}
    users = User.objects.all()
    users_dict = {x.id: x for x in users}

    query_string = (
        "SELECT p.*, ps.user_id, ps.question_id, ps.aggregation_method "
        "FROM metac_question_prediction p "
        "JOIN metac_question_predictionsequence ps "
        "ON p.prediction_sequence_id = ps.id "
        "AND aggregation_method = 'none'"
    )
    if qty:
        # Add `limit 300000` to get a sizeable amount but have the migration be faster
        query_string += f" limit {qty}"

    forecasts = []
    for i, old_prediction in enumerate(
        # flake
        paginated_query(query_string)
    ):
        forecast = create_forecast(old_prediction, questions_dict, users_dict)
        if forecast is not None:
            forecasts.append(forecast)
        if len(forecasts) >= 200_000:
            print("Migrating forecast", i + 1, "Bulk inserting forecasts...", end="\r")
            Forecast.objects.bulk_create(forecasts, batch_size=5_000)
            forecasts = []
    print("Migrating forecast", i + 1, "Bulk inserting forecasts...")
    Forecast.objects.bulk_create(forecasts, batch_size=5_000)

    print("Migrating last user<>post forecast snapshots")

    migrate_post_snapshots_forecasts()
    migrate_forecast_post_relation()
    migrate_post_forecasts_count()


def migrate_forecast_post_relation():
    print("Migrating Forecast.post_id. Usually takes up to 2-3 minutes!")

    with connection.cursor() as cursor:
        cursor.execute(
            """
            -- Optimized update query
            WITH post_ids AS (
                SELECT
                    q.id AS question_id,
                    COALESCE(p.id, NULL) AS post_id
                FROM
                    questions_question q
                LEFT JOIN
                    questions_groupofquestions g ON q.group_id = g.id
                LEFT JOIN
                    questions_conditional c ON c.question_yes_id = q.id OR c.question_no_id = q.id
                LEFT JOIN
                    posts_post p ON p.question_id = q.id OR p.group_of_questions_id = g.id OR p.conditional_id = c.id
            )
            UPDATE
                questions_forecast f
            SET
                post_id = post_ids.post_id
            FROM
                post_ids
            WHERE
                f.question_id = post_ids.question_id;
        """
        )

    print("Finished migrating Forecast.post_id")


def migrate_post_forecasts_count():
    print("Migrating Post.forecasts_count")

    qs = Post.objects.annotate(
        forecasts_count_annotated=(
            # Note: Order is important
            Coalesce(
                SubqueryAggregate("question__user_forecasts", aggregate=Count),
                # Question groups
                SubqueryAggregate(
                    "group_of_questions__questions__user_forecasts",
                    aggregate=Count,
                ),
                # Conditional questions
                Coalesce(
                    SubqueryAggregate(
                        "conditional__question_yes__user_forecasts",
                        aggregate=Count,
                    ),
                    0,
                )
                + Coalesce(
                    SubqueryAggregate(
                        "conditional__question_no__user_forecasts",
                        aggregate=Count,
                    ),
                    0,
                ),
            )
        )
    )

    qs.update(forecasts_count=F("forecasts_count_annotated"))

    print("Finished migrating Post.forecasts_count")


def migrate_metaculus_predictions():
    questions = Question.objects.all()
    questions_dict = {x.id: x for x in questions}

    # continuous questions
    query_string = (
        "SELECT h.metaculus_prediction, h.question_id, "
        "h.metaculus_prediction_complete_aprox "
        "FROM metac_question_questionpredictionhistory h"
    )
    mp_histories = [
        mp for mp in paginated_query(query_string) if mp["metaculus_prediction"] != "[]"
    ]
    c = len(mp_histories)
    start = timezone.now()
    for i, mp_data in enumerate(mp_histories, 1):
        print(
            f"Migrating continuous metaculus prediction {i}/{c} "
            f"dur:{str(timezone.now() - start).split('.')[0]} "
            f"remaining:{str((timezone.now() - start) / i * (c - i)).split(".")[0]}",
            end="\r",
        )
        question_id = mp_data["question_id"]
        question = questions_dict.get(question_id, None)
        if not question or question.type not in [
            Question.QuestionType.NUMERIC,
            Question.QuestionType.DATE,
            Question.QuestionType.DISCRETE,
        ]:
            continue
        user_forecasts = question.user_forecasts.all()
        open_lower = question.open_lower_bound
        open_upper = question.open_upper_bound
        mp = json.loads(mp_data["metaculus_prediction"])
        if len(mp) == 0:
            continue
        forecasts: list[AggregateForecast] = []
        for entry in mp:
            start_time = datetime.fromtimestamp(entry["t"], tz=dt_timezone.utc)
            vals = np.array(entry["y"])
            vals = (vals[:-1] + vals[1:]) / 2
            unscaled_cdf = np.cumsum(vals)
            internal_cdf = unscaled_cdf / (unscaled_cdf[-1] or 1)
            cdf = np.array(
                [
                    entry["low"],
                    *(internal_cdf * (entry["high"] - entry["low"]) + entry["low"]),
                    entry["high"],
                ]
            )
            # offset cdf
            line = np.linspace(0, 0.01, len(cdf))
            if open_lower and open_upper:
                forecast_values = 0.001 + 0.988 * cdf + line
            elif open_lower:
                forecast_values = 0.001 + 0.989 * cdf + line
            elif open_upper:
                forecast_values = 0.989 * cdf + line
            else:
                forecast_values = 0.99 * cdf + line
            forecaster_count = user_forecasts.filter(
                Q(end_time__gte=start_time) | Q(end_time__isnull=True),
                start_time__lte=start_time,
            ).count()

            new_forecast = AggregateForecast(
                question_id=question_id,
                method="metaculus_prediction",
                start_time=start_time,
                forecast_values=forecast_values.tolist(),
                forecaster_count=forecaster_count,
                interval_lower_bounds=[np.clip(entry["q1"], 0, 1)],
                centers=[np.clip(entry["q2"], 0, 1)],
                interval_upper_bounds=[np.clip(entry["q3"], 0, 1)],
            )
            if forecasts:
                forecasts[-1].end_time = new_forecast.start_time
            forecasts.append(new_forecast)

        AggregateForecast.objects.filter(
            question=question, method="metaculus_prediction"
        ).delete()
        AggregateForecast.objects.bulk_create(forecasts)
    print(
        f"\033[KMigrating continuous metaculus prediction {i}/{c} "
        f"dur:{str(timezone.now() - start).split('.')[0]} "
    )

    # binary questions
    query_string = (
        "SELECT q.metaculus_prediction, q.id, "
        "q.possibilities "
        "FROM metac_question_question q "
        "WHERE q.possibilities->>'type' = 'binary'"
    )
    question_histories = [
        q for q in paginated_query(query_string) if q["metaculus_prediction"] != "[]"
    ]
    c = len(question_histories)
    start = timezone.now()
    for i, q_data in enumerate(question_histories, 1):
        print(
            f"Migrating binary metaculus prediction {i}/{c} "
            f"dur:{str(timezone.now() - start).split('.')[0]} "
            f"remaining:{str((timezone.now() - start) / i * (c - i)).split(".")[0]}",
            end="\r",
        )
        question_id = q_data["id"]
        question = questions_dict.get(question_id, None)
        if not question or question.type != "binary":
            continue
        user_forecasts = question.user_forecasts.all()
        mp = json.loads(q_data["metaculus_prediction"])
        if len(mp) == 0:
            continue
        forecasts: list[AggregateForecast] = []
        for entry in mp["history"]:
            start_time = datetime.fromtimestamp(entry["t"], tz=dt_timezone.utc)
            forecaster_count = user_forecasts.filter(
                Q(end_time__gte=start_time) | Q(end_time__isnull=True),
                start_time__lte=start_time,
            ).count()
            forecast_values = [1 - entry["x"], entry["x"]]

            new_forecast = AggregateForecast(
                question_id=question_id,
                method="metaculus_prediction",
                start_time=start_time,
                forecast_values=forecast_values,
                forecaster_count=forecaster_count,
            )
            if forecasts:
                forecasts[-1].end_time = new_forecast.start_time
            forecasts.append(new_forecast)

        AggregateForecast.objects.filter(
            question=question, method="metaculus_prediction"
        ).delete()
        AggregateForecast.objects.bulk_create(forecasts)
    print(
        f"\033[KMigrating binary metaculus prediction {i}/{c} "
        f"dur:{str(timezone.now() - start).split('.')[0]} "
    )
