from collections import defaultdict

from django.core.management.base import BaseCommand

from comments.models import Comment
from migrator.utils import paginated_query
from questions.models import Forecast


class Command(BaseCommand):
    help = "Migrate comment forecasts"

    def handle(self, *args, **options):
        stats = defaultdict(int)
        comments_to_update = []

        for idx, old_comment in enumerate(
            paginated_query(
                "SELECT * FROM metac_question_comment WHERE latest_prediction is not null"
            )
        ):
            if not idx % 1000:
                print(f"Processed {idx}")

            new_comment = Comment.objects.filter(id=old_comment["id"]).first()

            if not new_comment:
                stats["missing_comment"] += 1
                continue

            related_forecast = Forecast.objects.filter(
                question_id=old_comment["question_id"],
                author_id=new_comment.author_id,
                start_time__lte=old_comment["created_time"],
            ).order_by("-start_time").first()

            if not related_forecast:
                stats["missing_forecasts"] += 1
                continue

            new_comment.included_forecast = related_forecast
            comments_to_update.append(new_comment)

        print("STATS: ", stats)
        print(f"Updating {len(comments_to_update)}")
        Comment.objects.bulk_update(comments_to_update, fields=["included_forecast"])
        print(f"Updated")
