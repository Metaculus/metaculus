from migrator.utils import paginated_query, one2one_query
from questions.models import Question
import json
from dateutil.parser import parse as date_parse

from users.models import User


def create_user(question: dict) -> Question:
    possibilities = json.loads(question["possibilities"])
    # print(f'\n----\n{possibilities}\n----\n')
    if possibilities.get("type", None) == "binary":
        question_type = "binary"
    elif possibilities.get("type", None) == "continuous":
        if possibilities.get("format", None) == "num":
            question_type = "numeric"
        else:
            question_type = "date"
    elif isinstance(possibilities, list) and len(possibilities) > 2:
        question_type = "multiple_choice"
        return None
    else:
        return None
    question = Question(
        id=question["id"],
        title=question["title"],
        description=question["description"],
        author=User.objects.get(id=question["author_id"]),
        created_at=question["created_time"],
        updated_at=question["edited_time"],
        published_at=question["publish_time"],
        approved_at=question["approved_time"],
        closed_at=question["close_time"],
        resolved_at=question["resolve_time"],
        approved_by=(
            None
            if not question["approved_by_id"]
            else User.objects.get(id=question["approved_by_id"])
        ),
        type=question_type,
        possibilities=possibilities,
        resolution=question["resolution"],
    )

    return question


def migrate_questions():
    for question in paginated_query("SELECT * FROM metac_question_question"):
        question = create_user(question)
        if question is not None:
            question.save()
