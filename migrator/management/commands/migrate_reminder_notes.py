from collections import defaultdict

from django.core.management.base import BaseCommand
from django.db.models import Count, Value, F, Q, OuterRef, Subquery, IntegerField
from django.db.models.functions import Coalesce
from sql_util.aggregates import SubqueryAggregate

from comments.models import Comment
from migrator.utils import paginated_query
from posts.models import Post, PostUserSnapshot
from questions.models import Question


class Command(BaseCommand):
    help = "Migrate reminder notes to private comments"

    @classmethod
    def _generate_body(cls, old_reminder):
        types_map = {
            "REMINDER_ON_DATE": "date",
            "REMINDER_AFTER_TIME": "time elapsed",
            "REMINDER_ON_OPEN": "question opens",
            "REMINDER_ON_LIFETIME": "question lifetime percentage",
            "REMINDER_ON_RESOLUTION": "question resolution",
            "REMINDER_ON_COMMENTS": "new comments",
            "REMINDER_ON_CP": "community prediction changes",
        }

        remind_on_date = old_reminder["remind_on_date"]
        remind_on_date = (
            f" {remind_on_date.strftime('%b %d, %Y, %I:%M %p')}"
            if remind_on_date
            else ""
        )

        return f"Note imported from {types_map[old_reminder['reminder']]} reminder{remind_on_date}\n\n> {old_reminder['note']}"

    def handle(self, *args, **options):
        stats = defaultdict(int)
        comments_to_create = []
        post_ids = Post.objects.values_list("id", flat=True)

        for idx, old_reminder in enumerate(
            paginated_query("SELECT * FROM metac_question_reminder WHERE note != '' and site_id=1")
        ):
            if not idx % 1000:
                print(f"Processed {idx}")

            post_id = old_reminder["question_id"]

            # Exclude non-existing posts
            if post_id not in post_ids:
                question = Question.objects.filter(pk=post_id).first()

                if not question:
                    stats["missing_questions"] += 1
                    continue

                post = question.get_post()

                post_id = post.pk
                stats["non_existing_posts"] += 1

            # Create private comment
            comments_to_create.append(
                Comment(
                    is_private=True,
                    author_id=old_reminder["user_id"],
                    on_post_id=post_id,
                    created_at=old_reminder["created_time"],
                    text=self._generate_body(old_reminder),
                )
            )

        print("STATS: ", stats)
        print(f"Updating {len(comments_to_create)}")
        Comment.objects.bulk_create(comments_to_create)
        print(f"Updating post comment counters")

        # Update Post.comment_count
        Post.objects.annotate(
            comment_count_value=Coalesce(
                SubqueryAggregate(
                    "comments", filter=Q(is_private=False), aggregate=Count
                ),
                Value(0),
            )
        ).update(comment_count=F("comment_count_value"))

        print(f"Updating user snapshot comment counters")
        snapshots = PostUserSnapshot.objects.all()
        comments_subquery = (
            Comment.objects.filter(
                on_post_id=OuterRef("post_id"),
                created_at__lte=OuterRef("viewed_at"),
                is_private=False,
            )
            .values("on_post_id")
            .annotate(count=Count("id"))
            .values("count")
        )

        snapshots.update(
            comments_count=Coalesce(
                Subquery(comments_subquery, output_field=IntegerField()), Value(0)
            )
        )

        print("Migrated")
