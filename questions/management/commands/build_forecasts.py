import logging
import time

from django.core.management.base import BaseCommand

from questions.models import Question
from questions.tasks import run_build_question_forecasts

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Builds forecasts for all questions"

    def handle(self, *args, **options):
        qs = Question.objects.all().order_by("id").prefetch_related("user_forecasts")
        c = qs.count()
        i = 0
        tm = time.time()

        print(f"Building CP. Found {c} questions with forecasts to process.")

        for question in qs.iterator(chunk_size=100):

            try:
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
