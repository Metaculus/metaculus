import csv
import io
import zipfile

import pytest
from django.db import connection
from django.utils import timezone
from django.test.utils import CaptureQueriesContext

from questions.models import AggregateForecast, Forecast, Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_questions.factories import create_question, factory_forecast
from utils.csv_utils import generate_data


def test_generate_data_loads_only_exported_rows(question_binary, user1, user2):
    factory_post(author=user2, question=question_binary)
    factory_forecast(author=user1, question=question_binary, probability_yes=0.6)
    factory_forecast(author=user1, question=question_binary, probability_yes=0.7)

    with CaptureQueriesContext(connection) as ctx:
        data = generate_data(
            questions=Question.objects.filter(pk__in=[question_binary.pk]),
            user_forecasts=Forecast.objects.filter(question=question_binary),
        )

    sqls = [q["sql"] for q in ctx.captured_queries]
    assert all(" WHERE " in sql for sql in sqls if 'FROM "users_user"' in sql)
    assert not [sql for sql in sqls if 'WHERE "questions_question"."id" = ' in sql]
    with zipfile.ZipFile(io.BytesIO(data)) as zip_file:
        assert "user1" in zip_file.read("forecast_data.csv").decode()


def test_range_resolution_probability_and_pdf(user1, user2):
    # uniform over 3 inbound buckets; the range covers two buckets' worth
    question = create_question(
        question_type=Question.QuestionType.NUMERIC,
        inbound_outcome_count=3,
        range_min=0,
        range_max=3,
        open_lower_bound=False,
        open_upper_bound=False,
        resolution="1.5",
        resolution_lower_bound="0.5",
        resolution_upper_bound="2.5",
    )
    factory_post(author=user2, question=question)
    factory_forecast(
        author=user1, question=question, continuous_cdf=[0, 1 / 3, 2 / 3, 1]
    )
    AggregateForecast.objects.create(
        question=question,
        method="geometric_mean",
        start_time=question.open_time or timezone.now(),
        # get_aggregation_history stores the geometric mean PMF itself
        forecast_values=[0, 1 / 3, 1 / 3, 1 / 3, 0],
        forecaster_count=1,
    )

    data = generate_data(
        questions=Question.objects.filter(pk=question.pk),
        user_forecasts=Forecast.objects.filter(question=question),
        aggregate_forecasts=AggregateForecast.objects.filter(question=question),
    )

    with zipfile.ZipFile(io.BytesIO(data)) as zip_file:
        rows = list(
            csv.DictReader(io.StringIO(zip_file.read("forecast_data.csv").decode()))
        )
    assert len(rows) == 2
    for row in rows:
        assert float(row["Probability of Resolution"]) == pytest.approx(2 / 3)
        # the density at the resolution value, not the interval mass
        assert float(row["PDF at Resolution"]) == pytest.approx(1)
