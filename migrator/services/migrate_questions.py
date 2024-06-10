import json

from dateutil.parser import parse as date_parse

from migrator.utils import paginated_query
from posts.models import Post
from questions.models import Question


def create_question(question: dict) -> Question:
    possibilities = json.loads(question["possibilities"])
    max = None
    min = None
    open_upper_bound = None
    open_lower_bound = None
    options = None
    # TODO @Luke do the transformation to get zero_point point from deriv_ratio
    zero_point = None
    if None in question["option_labels"] or not question["option_labels"]:
        question["option_labels"] = None
    if possibilities.get("type", None) == "binary":
        question_type = "binary"
    elif possibilities.get("type", None) == "continuous":
        if possibilities.get("format", None) == "num":
            question_type = "numeric"
            if isinstance(possibilities["scale"]["max"], list):
                max = possibilities["scale"]["max"][0]
            else:
                max = possibilities["scale"]["max"]
            if isinstance(possibilities["scale"]["min"], list):
                min = possibilities["scale"]["min"][0]
            else:
                min = possibilities["scale"]["min"]
        else:
            question_type = "date"
            max = date_parse(possibilities["scale"]["max"]).timestamp()
            min = date_parse(possibilities["scale"]["min"]).timestamp()
        open_upper_bound = possibilities.get("low", None) == "tail"
        open_lower_bound = possibilities.get("high", None) == "tail"
    elif question["option_labels"] is not None:
        question_type = "multiple_choice"
        options = question["option_labels"]
    else:
        return None
    new_question = Question(
        id=question["id"],
        title=question["title"],
        max=max,
        min=min,
        open_upper_bound=open_upper_bound,
        open_lower_bound=open_lower_bound,
        options=options,
        description=question["description"],
        created_at=question["created_time"],
        edited_at=question["edited_time"],
        closed_at=question["close_time"],
        resolved_at=question["resolve_time"],
        type=question_type,
        possibilities=possibilities,
        resolution=question["resolution"],
        zero_point=zero_point,
    )

    return new_question


def create_post(question: dict) -> Post:
    return Post(
        # Keeping the same ID as the old question
        id=question["id"],
        title=question["title"],
        author_id=question["author_id"],
        approved_by_id=question["approved_by_id"],
        published_at=question["publish_time"],
        created_at=question["created_time"],
        edited_at=question["edited_time"],
        approved_at=question["approved_time"],
        question_id=question["id"],
    )


def migrate_questions():
    questions = []
    posts = []

    for old_question in paginated_query(
            """SELECT
                q.*,
                ARRAY_AGG(o.label) AS option_labels
            FROM
                metac_question_question q
            LEFT JOIN
                metac_question_option o ON q.id = o.question_id
            GROUP BY
        q.id;"""
    ):
        # TODO: skipping groups/conditional for now
        #   So it should be implemented in the future
        if old_question["type"] == "conditional_group" or old_question["group_id"]:
            continue

        question = create_question(old_question)
        if question is not None:
            questions.append(question)
            posts.append(create_post(old_question))
    Question.objects.bulk_create(questions)
    Post.objects.bulk_create(posts)
