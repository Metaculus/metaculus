import json
from datetime import datetime

from dateutil.parser import parse as date_parse

from utils.the_math.formulas import internal_location_to_actual_location
from migrator.utils import paginated_query
from posts.models import Post
from questions.models import Question


def internal_location_to_string_location(
    question: Question, internal_location: float
) -> str:
    if question.type == "binary":
        return "yes" if internal_location == 1.0 else "no"
    if question.type == "multiple_choice":
        return question.options[int(internal_location)]
    # continuous
    if internal_location == 2:
        return "below_lower_bound"
    if internal_location == 3:
        return "above_upper_bound"
    actual_location = internal_location_to_actual_location(question, internal_location)
    if question.type == "date":
        return datetime.fromtimestamp(actual_location).isoformat()
    return str(actual_location)


def create_question(question: dict) -> Question:
    possibilities = json.loads(question["possibilities"])
    max = None
    min = None
    open_upper_bound = None
    open_lower_bound = None
    options = None
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
        deriv_ratio = possibilities["scale"].get("deriv_ratio", 1)
        if deriv_ratio != 1:
            zero_point = (deriv_ratio * min - max) / (deriv_ratio - 1)
        open_upper_bound = possibilities.get("low", None) == "tail"
        open_lower_bound = possibilities.get("high", None) == "tail"
    elif question["option_labels"] is not None:
        question_type = "multiple_choice"
        options = question["option_labels"]
    else:
        return None

    initial_status = question["mod_status"]
    if initial_status == "ACTIVE":
        if question["resolution"] is None:
            status = Question.Status.ACTIVE
        elif question["resolution"] == -2:
            status = Question.Status.ANNULLED
        elif question["resolution"] == -1:
            status = Question.Status.AMBIGUOUS
        elif question["resolution"] >= 0:
            status = Question.Status.RESOLVED
        else:
            raise ValueError("Invalid resolution")
    elif initial_status == "PENDING":
        status = Question.Status.IN_REVIEW
    elif initial_status == "REJECTED":
        status = Question.Status.DELETED
    elif initial_status == "DRAFT":
        status = Question.Status.DRAFT
    else:
        status = Question.Status.DELETED

    new_question = Question(
        id=question["id"],
        title=question["title"],
        status=status,
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
        zero_point=zero_point,
    )

    resolution: str | None = None
    resolution_float = question["resolution"]
    if (resolution_float is not None) and (resolution_float >= 0):
        if question_type == "binary":
            assert resolution_float in [0.0, 1.0]
            resolution = "yes" if resolution_float == 1 else "no"
        if question_type == "multiple_choice":
            resolution = options[int(resolution_float)]
        else:
            resolution = internal_location_to_string_location(
                new_question, resolution_float
            )
    new_question.resolution = resolution

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
