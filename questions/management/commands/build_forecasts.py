import logging
import time

from django.core.management.base import BaseCommand

from questions.models import Question
from questions.services.forecasts import build_question_forecasts
from questions.tasks import run_build_question_forecasts
from questions.types import AggregationMethod

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Builds forecasts for all questions"

    def add_arguments(self, parser):
        parser.add_argument(
            "--method",
            choices=AggregationMethod.values,
            help="Build only this aggregation method instead of the default one",
        )
        parser.add_argument(
            "--open",
            action="store_true",
            help="Only questions that haven't closed yet",
        )

    def handle(self, *args, **options):
        method = options["method"]
        qs = Question.objects.all().order_by("id").prefetch_related("user_forecasts")
        if options["open"]:
            qs = qs.filter(actual_close_time__isnull=True)
        c = qs.count()
        i = 0
        tm = time.time()

        print(f"Building CP. Found {c} questions with forecasts to process.")

        for question in qs.iterator(chunk_size=100):
            try:
                if method:
                    build_question_forecasts(question, method)
                else:
                    run_build_question_forecasts(question.id)
            except Exception:
                logger.exception(
                    "Failed to generate forecast for question %s", question.id
                )

            i += 1
            print(
                f"Processed {int(i / c * 100)}% ({i}/{c}) "
                f"dur:{round(time.time() - tm)}s "
                f"remaining:{round((time.time() - tm) / i * (c - i))}s",
                end="\r",
            )
        print(
            f"Processed {int(i / c * 100)}% ({i}/{c}) "
            f"dur:{round(time.time() - tm)}s "
            f"remaining:{round((time.time() - tm) / i * (c - i))}s"
        )
