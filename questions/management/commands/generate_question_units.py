import json
import logging
import time

from django.core.management.base import BaseCommand

from posts.models import Post
from questions.models import Question
from utils.openai import get_openai_client

logger = logging.getLogger(__name__)


# TODO: take into account Conditional Questions! (exclude from initial QuerySet and programmatically backfill!)


def generate_prompt():
    return """Generate units for numeric questions based on their title, description, and option parameter.
Given a JSON list of question objects, create concise unit values and return as a JSON object 
where each key is the QuestionID and each value is the derived unit. Consider any "option" parameter provided.

- Analyze the title, description, and option of each question to determine an appropriate unit.
- Ensure the unit is concise and relevant to the context.
- If a unit cannot be determined, return `null` for that question.

# Steps

1. Parse the input JSON list of question objects.
2. For each question, examine the title, description, and option 
   to identify any keywords or phrases that suggest a unit.
3. Reason through the context provided by the title, description, and option to determine the most appropriate unit.
4. Regularly use standard unit abbreviations (e.g., "kg" for kilograms, "$" for dollars) 
   unless the description indicates a specific alternative.
5. Construct a JSON object with each question's ID as the key and the derived unit as the value.
6. For unclear or unitless questions, set the value to `null`.

# Output Format

The result should be returned as a JSON object with the format:
```json
{
"QuestionID1": "Unit1",
"QuestionID2": "Unit2",
...
}
```

# Examples

**Input:**
```json
[
{"id": 150, "title": "What is the weight of the package?", "description": "Enter the weight in kilograms or pounds."},
{"id": 151, "title": "How much will the item cost?", "description": "Enter the cost in dollars."},
{"id": 160, "title": "What is the age of the building?", "description": "Enter the age with no units specified."},
{"id": 200, "title": "What will be the GDP for those countries?", "description": "...", "option": "US"}
]
```

**Output:**
```json
{
"150": "kg",
"151": "$",
"160": null,
"200": "$"
}
```

# Notes

- Ensure the units are appropriate and common for the given context, utilizing contextual clues 
  from the question's title, description, and option.
- Where ambiguity exists, prioritize clarity and simplicity when selecting a unit.
- Consider common fallbacks if a direct indicator is missing, but avoid assumptions 
  that are not supported by the provided text."""


def generate_question_data(question):
    if question.group_id:
        return {
            "id": question.id,
            "title": question.get_post().title,
            "description": question.group.description,
            "option": question.label,
        }

    return {
        "id": question.id,
        "title": question.title,
        "description": question.description,
    }


def generate_units(questions: list[Question]):
    question_contents = [generate_question_data(q) for q in questions]

    if not question_contents:
        return {}

    client = get_openai_client()

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": generate_prompt()},
            {"role": "user", "content": json.dumps(question_contents, indent=2)},
        ],
        response_format={"type": "json_object"},
    )

    units_map = json.loads(response.choices[0].message.content)

    print(units_map)

    return {int(question_id): unit for question_id, unit in units_map.items()}


class Command(BaseCommand):
    chunk_size = 10
    help = "Generate question units for all questions"

    def handle(self, *args, **options):
        # TODO: exclude draft, deleted
        # TODO: exclude conditionals
        qs = Question.objects.filter(
            type=Question.QuestionType.NUMERIC,
            unit="",
            conditional_yes__isnull=True,
            conditional_no__isnull=True,
            related_posts__post__curation_status__in=[Post.CurationStatus.APPROVED, Post.CurationStatus.PENDING]
        ).select_related("group")
        total_questions = qs.count()

        tm = time.time()
        idx = 0

        units_mapping = {}

        while idx <= total_questions:
            chunk = qs.all()[idx : idx + self.chunk_size]
            idx += self.chunk_size

            units = generate_units(chunk)

            for question_id, unit in units.items():
                if question_id in units_mapping:
                    raise ValueError("Duplicate question id: {}".format(question_id))

            units_mapping.update(units)

            print(f"Processed {idx}/{total_questions} questions")

        # TODO:
        with open("output.json", "w") as f:
            json.dump(units_mapping, f, indent=2)
