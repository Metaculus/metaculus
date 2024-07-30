import logging
import time

from django.core.management.base import BaseCommand

from questions.models import Question
from questions.tasks import run_build_question_forecasts

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Builds forecasts for all questions"

    def handle(self, *args, **options):
        qs = Question.objects.all().prefetch_related("forecast_set")
        total = qs.count()
        processed = 0
        tm = time.time()

        print(f"Building CP. Found {total} questions with forecasts to process.")

        for question in qs.iterator(chunk_size=100):

            try:
                run_build_question_forecasts(question.id)
            except Exception:
                logger.exception(
                    "Failed to generate forecast for question %s", question.id
                )

            processed += 1
            print(
                f"Processed {int(processed / total * 100)}% ({processed}/{total})"
                f" questions. Duration: {round(time.time() - tm)}s",
                end="\r",
            )
        print(
            f"Processed {int(processed / total * 100)}% ({processed}/{total})"
            f" questions. Duration: {round(time.time() - tm)}s",
        )
