from django.db.models import Q
from django.contrib.postgres.fields import JSONField
from questions.models import Question

def transfer_questions(apps, schema_editor):
    # Connect to the 'metaculus_v3' database
    db_alias = 'metaculus_v3'

    # Fetch the old questions data using a raw SQL query
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                id, title, description, user_id, created_time, last_activity_time,
                possibilities, resolution, resolve_time
            FROM metac_question_question;
        """)
        old_questions_data = cursor.fetchall()

    # Process the old questions data and insert into the new Question model
    for question_data in old_questions_data:
        question_id, title, description, author_id, created_at, updated_at, possibilities, resolution, resolved_at = question_data

        # Determine the question type based on the possibilities field
        if isinstance(possibilities, list) and len(possibilities) == 2 and all(p in [0, 1] for p in possibilities):
            question_type = 'binary'
            binary_question = bool(resolution)
            min_value = max_value = multiple_choice_options = None
        elif isinstance(possibilities, list) and len(possibilities) == 2:
            question_type = 'numeric'
            binary_question = None
            min_value, max_value = possibilities
            multiple_choice_options = None
        elif isinstance(possibilities, list) and len(possibilities) > 2:
            question_type = 'multiple_choice'
            binary_question = min_value = max_value = None
            multiple_choice_options = possibilities
        else:
            # Handle other question types if needed
            continue

        # Create a new question instance and save it
        new_question = Question(
            title=title,
            description=description,
            author_id=author_id,
            created_at=created_at,
            updated_at=updated_at,
            type=question_type,
            binary_question=binary_question,
            min=min_value,
            max=max_value,
            multiple_choice_options=multiple_choice_options,
            resolution=resolution,
            resolved_at=resolved_at,
        )
        new_question.save()

transfer_questions()