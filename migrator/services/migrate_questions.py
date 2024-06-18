import json
from datetime import datetime

from dateutil.parser import parse as date_parse
import django

from utils.the_math.formulas import scale_location
from migrator.utils import paginated_query
from posts.models import Post
from questions.models import Question, Conditional, GroupOfQuestions


def unscaled_location_to_string_location(
    question: Question, unscaled_location: float
) -> str:
    if question.type == "binary":
        return "yes" if unscaled_location == 1.0 else "no"
    if question.type == "multiple_choice":
        return question.options[int(unscaled_location)]
    # continuous
    if unscaled_location == 2:
        return "below_lower_bound"
    if unscaled_location == 3:
        return "above_upper_bound"
    actual_location = scale_location(question, unscaled_location)
    if question.type == "date":
        return datetime.fromtimestamp(actual_location).isoformat()
    return str(actual_location)


def create_question(question: dict, **kwargs) -> Question:
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

    new_question = Question(
        id=question["id"],
        title=question["title"],
        max=max,
        min=min,
        open_upper_bound=open_upper_bound,
        open_lower_bound=open_lower_bound,
        options=options,
        closed_at=question["close_time"],
        description=question["description"],
        created_at=question["created_time"],
        edited_at=question["edited_time"],
        resolved_at=question["resolve_time"],
        type=question_type,
        possibilities=possibilities,
        zero_point=zero_point,
        **kwargs,
    )

    resolution: str | None = None
    resolution_float = question["resolution"]
    if (resolution_float is not None) and (resolution_float >= 0):
        resolution = unscaled_location_to_string_location(
            new_question, resolution_float
        )
    new_question.resolution = resolution

    return new_question


def create_post(question: dict, **kwargs) -> Post:
    curation_status = Post.CurationStatus.DRAFT
    if question["approved_by_id"] or (
        question["approved_time"]
        and question["approved_time"] < django.utils.timezone.now()
    ) or (question["publish_time"] and question["publish_time"] < django.utils.timezone.now()):
        curation_status = Post.CurationStatus.PUBLISHED
    if question["close_time"] < django.utils.timezone.now() and (
        (
            question["approved_time"]
            and question["approved_time"] < django.utils.timezone.now()
        )
        or question["approved_by_id"]
    ):
        curation_status = Post.CurationStatus.CLOSED
    if question["mod_status"] == "PENDING":
        curation_status = Post.CurationStatus.PENDING
    if question["mod_status"] == "REJECTED":
        curation_status = Post.CurationStatus.REJECTED
    if question["mod_status"] == "DELETED":
        curation_status = Post.CurationStatus.DELETED

    return Post(
        # Keeping the same ID as the old question
        id=question["id"],
        title=question["title"],
        author_id=question["author_id"],
        approved_by_id=question["approved_by_id"],
        closed_at=question["close_time"],
        curation_status=curation_status,
        published_at=question["publish_time"],
        created_at=question["created_time"],
        edited_at=question["edited_time"],
        approved_at=question["approved_time"],
        **kwargs,
    )


def migrate_questions():
    migrate_questions__simple()
    migrate_questions__composite()


def migrate_questions__simple():
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
            WHERE type not in ('conditional_group', 'group') and group_id is null
            GROUP BY
        q.id;"""
    ):
        question = create_question(old_question)
        if question is not None:
            questions.append(question)
            posts.append(create_post(old_question, question_id=old_question["id"]))
    Question.objects.bulk_create(questions)
    Post.objects.bulk_create(posts)


#
# Migrating question which have parents
#


def migrate_questions__composite():
    old_groups = {}

    for old_question in paginated_query(
        """SELECT 
                        q.*, 
                        qc.parent_id as condition_id, 
                        qc.unconditional_question_id as condition_child_id, 
                        qc.resolution as qc_resolution FROM (
                                SELECT
                                    q.*,
                                    ARRAY_AGG(o.label) AS option_labels
                                FROM
                                    metac_question_question q
                                LEFT JOIN
                                    metac_question_option o ON q.id = o.question_id
                                WHERE  type in ('conditional_group', 'group') or group_id is not null
                                
                                GROUP BY q.id
                            ) q
                    LEFT JOIN 
                        metac_question_conditional qc ON qc.child_id = q.id
                    -- Ensure parents go first
                    ORDER BY group_id DESC;
                                                            """,
        itersize=10000,
    ):
        group_id = old_question["group_id"]

        # If root
        if not group_id:
            old_groups[old_question["id"]] = {**old_question, "children": []}
        else:
            old_groups[group_id]["children"].append(old_question)

    print("Migrating groups")
    migrate_questions__groups(list(old_groups.values()))

    print("Migrating conditional pairs")
    migrate_questions__conditional(list(old_groups.values()))


def migrate_questions__groups(root_questions: list[dict]):
    """
    Migrates Conditional Questions
    """

    questions = []
    groups = []
    posts = []

    for root_question in root_questions:
        if root_question["type"] == "group":
            # Conditionals without children
            if not root_question["children"]:
                continue

            # Please note: to simplify the process, our GroupOfQuestions will have the same id
            groups.append(GroupOfQuestions(id=root_question["id"]))

            for child in root_question["children"]:
                questions.append(create_question(child, group_id=root_question["id"]))

            # Create post from the root question, but don't create a root question
            posts.append(
                create_post(root_question, group_of_questions_id=root_question["id"])
            )

    GroupOfQuestions.objects.bulk_create(groups)
    Question.objects.bulk_create(questions)
    Post.objects.bulk_create(posts)


def migrate_questions__conditional(root_questions: list[dict]):
    """
    Migrates Conditional Questions
    """

    questions = []
    conditionals = []
    posts = []
    existing_question_ids = Question.objects.values_list("id", flat=True)

    for root_question in root_questions:
        if root_question["type"] == "conditional_group":
            # Conditionals without children
            if not root_question["children"]:
                continue

            def get_children_relation_id_by_attr(id_attr: str):
                attrs = [c[id_attr] for c in root_question["children"]]

                assert len(set(attrs)) == 1

                _id = attrs[0]

                # Check related questions already exist in our db
                if _id not in existing_question_ids:
                    print(
                        f"Related question to the conditional pair with the attr {id_attr} does not exist. Q_ID: {_id}"
                    )

                    return

                return _id

            old_question_yes = next(
                q for q in root_question["children"] if q["qc_resolution"] == 1
            )
            old_question_no = next(
                q for q in root_question["children"] if q["qc_resolution"] == 0
            )

            condition_id = get_children_relation_id_by_attr("condition_id")
            condition_child_id = get_children_relation_id_by_attr("condition_child_id")

            if not condition_id or not condition_child_id:
                continue

            # Please note: to simplify the process, our Conditional Question will have the same id
            # as our old Root Conditional Question!
            conditionals.append(
                Conditional(
                    id=root_question["id"],
                    condition_id=condition_id,
                    condition_child_id=condition_child_id,
                    question_yes_id=old_question_yes["id"],
                    question_no_id=old_question_no["id"],
                )
            )

            questions.append(create_question(old_question_yes))
            questions.append(create_question(old_question_no))

            # Create post from the root question, but don't create a root question
            posts.append(create_post(root_question, conditional_id=root_question["id"]))

    Question.objects.bulk_create(questions)
    Conditional.objects.bulk_create(conditionals)
    Post.objects.bulk_create(posts)
