import io
import zipfile

from django.db import connection
from django.test.utils import CaptureQueriesContext

from questions.models import Forecast, Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_questions.factories import factory_forecast
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
