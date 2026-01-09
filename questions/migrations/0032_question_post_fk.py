import django.db.models.deletion
from django.db import migrations, models


def populate_question_post(apps, schema_editor):
    """
    Populate Question.post_id based on the existing relationship paths:
    1. Single question: Post.question_id -> Question
    2. Group: Post.group_of_questions_id -> Group -> Question.group_id
    3. Conditional: Post.conditional_id -> Conditional -> question_yes/no
    """
    cursor = schema_editor.connection.cursor()

    # 1. Single question posts
    cursor.execute(
        """
        UPDATE questions_question q
        SET post_id = p.id
        FROM posts_post p
        WHERE p.question_id = q.id
          AND q.post_id IS NULL
        """
    )

    # 2. Group questions
    cursor.execute(
        """
        UPDATE questions_question q
        SET post_id = p.id
        FROM posts_post p
        WHERE p.group_of_questions_id = q.group_id
          AND q.post_id IS NULL
        """
    )

    # 3. Conditional yes questions
    cursor.execute(
        """
        UPDATE questions_question q
        SET post_id = p.id
        FROM posts_post p
                 JOIN questions_conditional c ON p.conditional_id = c.id
        WHERE c.question_yes_id = q.id
          AND q.post_id IS NULL
        """
    )

    # 4. Conditional no questions
    cursor.execute(
        """
        UPDATE questions_question q
        SET post_id = p.id
        FROM posts_post p
                 JOIN questions_conditional c ON p.conditional_id = c.id
        WHERE c.question_no_id = q.id
          AND q.post_id IS NULL
        """
    )


def reverse_populate(apps, schema_editor):
    cursor = schema_editor.connection.cursor()
    cursor.execute("UPDATE questions_question SET post_id = NULL")


class Migration(migrations.Migration):
    dependencies = [
        ("posts", "0027_alter_postusersnapshot_private_note_updated_at"),
        ("questions", "0031_forecast_questions_f_author__d4ea27_idx"),
    ]

    operations = [
        migrations.AddField(
            model_name="question",
            name="post",
            field=models.ForeignKey(
                blank=True,
                editable=False,
                help_text="The post this question belongs to. Set automatically.",
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="questions",
                to="posts.post",
            ),
        ),
        migrations.RunPython(populate_question_post, reverse_populate),
        migrations.AddIndex(
            model_name="question",
            index=models.Index(fields=["post"], name="questions_q_post_id_idx"),
        ),
    ]
