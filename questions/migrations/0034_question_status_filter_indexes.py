from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Add indexes to optimize question-level status filtering in feed queries.

    These partial indexes support the Exists() subqueries used in get_posts_feed().
    """

    dependencies = [
        ("questions", "0033_question_post_fk"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="question",
            index=models.Index(
                fields=["post"],
                name="idx_question_post_unresolved",
                condition=models.Q(resolution__isnull=True),
            ),
        ),
        migrations.AddIndex(
            model_name="question",
            index=models.Index(
                fields=["post"],
                name="idx_question_post_resolved",
                condition=models.Q(resolution__isnull=False),
            ),
        ),
        migrations.AddIndex(
            model_name="question",
            index=models.Index(
                fields=["post", "scheduled_close_time"],
                name="idx_question_post_close_time",
                condition=models.Q(resolution__isnull=True),
            ),
        ),
        migrations.AddIndex(
            model_name="question",
            index=models.Index(
                fields=["post", "scheduled_resolve_time"],
                name="idx_question_post_resolve_time",
                condition=models.Q(resolution__isnull=True),
            ),
        ),
    ]
