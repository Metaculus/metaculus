import time

from django.core.management.base import BaseCommand

from questions.models import Question
from questions.services import build_question_forecasts


class Command(BaseCommand):
    help = "Composes Question forecasts"

    def handle(self, *args, **options):
        qs = (
            Question.objects.annotate_forecasts_count()
            .prefetch_related("forecast_set")
            .filter(forecasts_count__gt=100)
        )
        total = qs.count()
        processed = 0
        tm = time.time()

        print(f"Found {total} questions with > forecasts")

        for question in qs.iterator(chunk_size=100):
            build_question_forecasts(question)

            processed += 1
            if not processed % 100:
                print(
                    f"Processed {round(processed / total * 100)}% ({processed}/{total}) questions. "
                    f"Overall duration: {round(time.time() - tm, 2)}s"
                )
