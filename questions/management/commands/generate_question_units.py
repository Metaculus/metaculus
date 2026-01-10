import json
import logging

from dateutil.parser import parse as date_parse
from django.core.management.base import BaseCommand, CommandParser
from django.utils.timezone import make_aware

from posts.models import Post
from questions.models import Question, Conditional
from utils.openai import get_openai_client

logger = logging.getLogger(__name__)


def generate_prompt():
    return """Generate concise and context-appropriate units for numeric questions based on their title, resolution criteria, and option.

Given a JSON list of question objects, create unit values that are concise and appropriate for display next to the Prediction value on the site and on prediction chart axis labels. Return results as a JSON object with each key as the QuestionID and the value as the derived unit. Consider any "option" parameter provided.

- Analyze the title, resolution criteria, and option of each question to determine an appropriate unit.
- Ensure the unit is concise, relevant to the context, and suitable for display on the site and in prediction charts.
- If a unit cannot be determined, return `null` for that question.

# Steps

1. Parse the input JSON list of question objects.
2. For each question, examine the title, resolution criteria, and option to identify any keywords or phrases that suggest a unit.
3. Reason through the context provided by the title, resolution criteria, and option to determine the most appropriate unit.
4. Regularly use standard unit abbreviations (e.g., "kg" for kilograms, "$" for dollars) unless the description indicates a specific alternative.
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
{"id": 150, "title": "What is the weight of the package?", "resolution_criteria": "Enter the weight in kilograms or pounds."},
{"id": 151, "title": "How much will the item cost?", "resolution_criteria": "Enter the cost in dollars."},
{"id": 160, "title": "What is the age of the building?", "resolution_criteria": "Enter the age with no units specified."},
{"id": 200, "title": "What will be the GDP for those countries?", "resolution_criteria": "...", "option": "US"}
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

- Ensure the units are appropriate and common for the given context, utilizing contextual clues from the question's title, resolution criteria, and option.
- Where ambiguity exists, prioritize clarity and simplicity when selecting a unit.
- Consider common fallbacks if a direct indicator is missing, but avoid assumptions that are not supported by the provided text.
- Please note: generated unit will be visible on the question page on our site and on prediction chart axis labels next to the Prediction value, so it should be concise and appropriate for the given situation."""


def generate_question_data(question):
    if question.group_id:
        return {
            "id": question.id,
            "title": question.get_post().title,
            "resolution_criteria": question.group.resolution_criteria,
            "option": question.label,
        }

    return {
        "id": question.id,
        "title": question.title,
        "resolution_criteria": question.resolution_criteria,
    }


def generate_units(questions: list[Question]):
    question_map = {q.id: q for q in questions}
    question_contents = [generate_question_data(q) for q in questions]

    client = get_openai_client()

    response = client.chat.completions.create(
        model="gpt-4.5-preview",
        messages=[
            {"role": "system", "content": generate_prompt()},
            {"role": "user", "content": json.dumps(question_contents, indent=2)},
        ],
        response_format={"type": "json_object"},
    )

    units_map = json.loads(response.choices[0].message.content)

    return {
        question_map[int(question_id)]: unit for question_id, unit in units_map.items()
    }


class Command(BaseCommand):
    chunk_size = 10
    help = "Generate question units for all questions"

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "min_created_date",
            help="Generate units for questions created after this date",
        )

    @classmethod
    def sync_conditional_units(cls, questions: list[Question]):
        conditionals = Conditional.objects.filter(
            condition_child__in=questions
        ).select_related("condition_child", "question_yes", "question_no")

        to_update = []

        for conditional in conditionals:
            for c_question in (conditional.question_yes, conditional.question_no):
                if not c_question.unit:
                    c_question.unit = conditional.condition_child.unit
                    to_update.append(c_question)

        Question.objects.bulk_update(to_update, fields=["unit"], batch_size=100)

    def handle(self, *args, **options):
        min_created_date = make_aware(date_parse(options["min_created_date"]))

        qs = (
            Question.objects.filter(
                type=Question.QuestionType.NUMERIC,
                unit="",
                conditional_yes__isnull=True,
                conditional_no__isnull=True,
                post__curation_status__in=[
                    Post.CurationStatus.APPROVED,
                    Post.CurationStatus.PENDING,
                ],
                created_at__gt=min_created_date,
            )
            .select_related("group")
            .order_by("-id")
        )
        total_questions = qs.count()

        idx = 0

        while idx <= total_questions:
            chunk = qs.all()[idx : idx + self.chunk_size]
            idx += self.chunk_size

            if not len(chunk):
                continue

            units_mapped = generate_units(chunk)

            for question, unit in units_mapped.items():
                question.unit = unit or ""

            Question.objects.bulk_update(list(units_mapped.keys()), fields=["unit"])
            self.sync_conditional_units(list(units_mapped.keys()))

            print(f"Processed {idx}/{total_questions} questions")
