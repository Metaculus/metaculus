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
                f"Processed {int(processed / total * 100)}% ({processed}/{total}) "
                f"Dur:{round(time.time() - tm)}s "
                f"Est:{round((time.time() - tm) / processed * (total - processed))}s",
                end="\r",
            )
        print(
            f"Processed {int(processed / total * 100)}% ({processed}/{total}) "
            f"Dur:{round(time.time() - tm)}s "
            f"Est:{round((time.time() - tm) / processed * (total - processed))}s"
        )
