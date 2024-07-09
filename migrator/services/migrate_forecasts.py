import numpy as np
from django.db import connection
from django.db.models import Count, F
from django.db.models.functions import Coalesce
from sql_util.aggregates import SubqueryAggregate

from migrator.services.migrate_questions import migrate_post_snapshots_forecasts
from migrator.utils import paginated_query
from posts.models import Post
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
                SubqueryAggregate("question__forecast", aggregate=Count),
                # Question groups
                SubqueryAggregate(
                    "group_of_questions__questions__forecast",
                    aggregate=Count,
                ),
                # Conditional questions
                Coalesce(
                    SubqueryAggregate(
                        "conditional__question_yes__forecast",
                        aggregate=Count,
                    ),
                    0,
                )
                + Coalesce(
                    SubqueryAggregate(
                        "conditional__question_no__forecast",
                        aggregate=Count,
                    ),
                    0,
                ),
            )
        )
    )

    qs.update(forecasts_count=F("forecasts_count_annotated"))

    print("Finished migrating Post.forecasts_count")
