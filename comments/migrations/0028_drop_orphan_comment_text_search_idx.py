from django.db import migrations


class Migration(migrations.Migration):
    """
    Drops `comment_text_search_idx`, an expression GIN index over
    `to_tsvector('english', text_original)` created by an early draft of
    `0024_add_denormalized_fields`. The final migration replaced it with
    `comment_text_search_vector_idx` on the stored vector, which is the one
    search queries use, so no model or migration state knows about it.

    `IF EXISTS` because only databases that ran the draft have it.
    `CONCURRENTLY` so that the drop does not block writes to comments.
    """

    atomic = False

    dependencies = [
        ("comments", "0027_comment_is_text_archived"),
    ]

    operations = [
        migrations.RunSQL(
            sql="DROP INDEX CONCURRENTLY IF EXISTS comment_text_search_idx;",
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
