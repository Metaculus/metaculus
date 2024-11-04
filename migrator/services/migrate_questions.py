import json
from collections import defaultdict
from datetime import timedelta

from dateutil.parser import parse as date_parse
from django.db.models.functions import Coalesce
from django.utils import timezone

from migrator.utils import paginated_query, cleanup_markdown
from posts.models import Notebook, Post, PostUserSnapshot
from projects.models import Project
from projects.permissions import ObjectPermission
from questions.constants import ResolutionType
from questions.models import Question, Conditional, GroupOfQuestions, Forecast
from utils.the_math.formulas import unscaled_location_to_string_location


def has_resolution(resolution):
    return resolution is not None and resolution != ""


def create_question(question: dict, **kwargs) -> Question:
    possibilities = json.loads(question["possibilities"])
    range_max = None
    range_min = None
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
                range_max = possibilities["scale"]["max"][0]
            else:
                range_max = possibilities["scale"]["max"]
            if isinstance(possibilities["scale"]["min"], list):
                range_min = possibilities["scale"]["min"][0]
            else:
                range_min = possibilities["scale"]["min"]
        else:
            question_type = "date"
            range_max = date_parse(possibilities["scale"]["max"]).timestamp()
            range_min = date_parse(possibilities["scale"]["min"]).timestamp()
        deriv_ratio = possibilities["scale"].get("deriv_ratio", 1)
        if deriv_ratio != 1:
            zero_point = (deriv_ratio * range_min - range_max) / (deriv_ratio - 1)
        open_lower_bound = possibilities.get("low", None) == "tail"
        open_upper_bound = possibilities.get("high", None) == "tail"
    elif question["option_labels"] is not None:
        question_type = "multiple_choice"
        options = question["option_labels"]
    else:
        return None

    new_question = Question(
        id=question["id"],
        title=question["title"],
        include_bots_in_aggregates=question["include_bots_in_aggregations"],
        range_max=range_max,
        range_min=range_min,
        open_upper_bound=open_upper_bound,
        open_lower_bound=open_lower_bound,
        options=options,
        description=cleanup_markdown(question["description"]),
        resolution_criteria=cleanup_markdown(question["resolution_criteria"]),
        fine_print=cleanup_markdown(question["fine_print"]),
        created_at=question["created_time"],
        edited_at=question["edited_time"],
        open_time=question["publish_time"],
        cp_reveal_time=question["cp_reveal_time"],
        scheduled_close_time=(
            question["close_time"]
            if question["close_time"]
            else timezone.now() + timedelta(days=10000)
        ),
        scheduled_resolve_time=(
            max(question["resolve_time"], question["close_time"])
            if (question["resolve_time"] and question["close_time"])
            else timezone.now() + timedelta(days=10000)
        ),
        actual_resolve_time=(
            question["resolve_time"] if question["resolution"] is not None else None
        ),
        resolution_set_time=(
            question["resolve_time"] if question["resolution"] is not None else None
        ),
        actual_close_time=(
            question["effected_close_time"]
            if question["effected_close_time"]
            and question["effected_close_time"] < timezone.now()
            else None
        ),
        type=question_type,
        possibilities=possibilities,
        zero_point=zero_point,
        **kwargs,
    )

    resolution: str | None = None
    resolution_float = question["resolution"]
    if resolution_float == -1:
        resolution = ResolutionType.AMBIGUOUS
    elif resolution_float == -2:
        resolution = ResolutionType.ANNULLED
    elif (resolution_float is not None) and (resolution_float >= 0):
        if new_question.type in ["numeric", "date"]:
            # out of bound values need to be rescaled
            if resolution_float == 2:
                resolution_float = -1
            elif resolution_float == 3:
                resolution_float = 2
        resolution = unscaled_location_to_string_location(
            resolution_float, new_question
        )
    new_question.resolution = resolution

    return new_question


def create_post(question: dict, **kwargs) -> Post:
    curation_status = Post.CurationStatus.DRAFT

    if (
        question["mod_status"] == "ACTIVE"
        and question["publish_time"] <= timezone.now()
    ):
        curation_status = Post.CurationStatus.APPROVED
    if question["mod_status"] == "PENDING":
        curation_status = Post.CurationStatus.PENDING
    if question["mod_status"] == "REJECTED":
        curation_status = Post.CurationStatus.REJECTED
    if question["mod_status"] == "DELETED":
        curation_status = Post.CurationStatus.DELETED

    curation_status_dates = list(
        filter(bool, [question["publish_time"], question["approved_time"]])
    )

    return Post(
        # Keeping the same ID as the old question
        id=question["id"],
        title=question["title"],
        url_title=question["title_short"],
        author_id=question["author_id"],
        curated_last_by_id=question["approved_by_id"],
        curation_status=curation_status,
        curation_status_updated_at=(
            max(curation_status_dates) if curation_status_dates else None
        ),
        published_at=question["publish_time"],
        created_at=question["created_time"],
        edited_at=question["edited_time"],
        actual_close_time=(
            question["effected_close_time"]
            if question["effected_close_time"]
            and question["effected_close_time"] < timezone.now()
            else None
        ),
        **kwargs,
    )


def migrate_questions(site_ids: list[int] = None):
    print("Migrating simple questions...")
    migrate_questions__simple(site_ids=site_ids)
    print("Migrating composite questions...")
    migrate_questions__composite(site_ids=site_ids)


def add_coauthors_for_post(post: Post):
    for obj in paginated_query(
        """
        WITH shared_projects AS (
            SELECT project_id
            FROM metac_project_questionprojectpermissions
            WHERE question_id = %s
            AND project_id IN (
                SELECT id
                FROM metac_project_project
                WHERE type = 'PP'
            )
        )
        SELECT upp.user_id AS id, u.username
        FROM metac_project_userprojectpermissions upp
        JOIN metac_account_user u ON upp.user_id = u.id
        WHERE upp.project_id IN (SELECT project_id FROM shared_projects)
        AND upp.user_id != (SELECT author_id
                            FROM metac_question_question
                            WHERE id = %s);
            """,
        [post.id, post.id],
    ):
        user_id = obj["id"]
        post.coauthors.add(user_id)


def migrate_questions__simple(site_ids: list[int] = None):
    questions = []
    posts = []
    site_ids = site_ids or []

    start = timezone.now()
    for i, old_question in enumerate(
        paginated_query(
            """
        SELECT q.*, ARRAY_AGG(o.label ORDER BY o.id) AS option_labels
            FROM metac_question_question q
            JOIN (SELECT q.*
                FROM metac_question_question q
                        JOIN
                    metac_project_questionprojectpermissions pqp ON q.id = pqp.question_id
                        JOIN
                    metac_project_project pp ON pqp.project_id = pp.id
                WHERE pp.site_id IN %s
                AND q.type NOT IN ('conditional_group', 'group', 'notebook', 'discussion', 'claim')
                AND q.group_id IS NULL
                GROUP BY q.id) q0 on q0.id = q.id
                    LEFT JOIN
                metac_question_option o ON q.id = o.question_id
            GROUP BY q.id;""",
            [tuple(site_ids)],
        ),
        1,
    ):
        print(
            f"\033[Kmigrating questions/posts: {i}. "
            f"dur:{str(timezone.now() - start).split('.')[0]} ",
            end="\r",
        )
        question = create_question(old_question)
        if question is not None:
            questions.append(question)
            posts.append(create_post(old_question, question_id=old_question["id"]))
    print(
        f"\033[Kmigrating questions/posts: {i}. "
        f"dur:{str(timezone.now() - start).split('.')[0]} "
        "bulk creating...",
        end="\r",
    )
    Question.objects.bulk_create(questions)
    Post.objects.bulk_create(posts)

    for post in posts:
        add_coauthors_for_post(post)

    print(
        f"\033[Kmigrating questions/posts: {i}. "
        f"dur:{str(timezone.now() - start).split('.')[0]} "
        "bulk creating... DONE",
    )


#
# Migrating question which have parents
#


def migrate_questions__composite(site_ids: list[int] = None):
    old_groups = {}
    site_ids = site_ids or []

    start = timezone.now()
    for i, old_question in enumerate(
        paginated_query(
            """SELECT q.*,
                       qc.parent_id                 as condition_id,
                       qc.unconditional_question_id as condition_child_id,
                       qc.resolution                as qc_resolution
                FROM (SELECT q.*, ARRAY_AGG(o.label ORDER BY o.id) AS option_labels
                      FROM metac_question_question q
                               JOIN (SELECT q.*
                                     FROM metac_question_question q
                                              LEFT JOIN
                                          metac_project_questionprojectpermissions pqp ON q.id = pqp.question_id
                                              LEFT JOIN
                                          metac_project_project pp ON pqp.project_id = pp.id
                                     WHERE (q.type in ('conditional_group', 'group', 'notebook', 'discussion', 'claim') and
                                            pp.site_id IN %s)
                                        OR q.group_id is not null
                                     GROUP BY q.id) q0 on q0.id = q.id
                               LEFT JOIN
                           metac_question_option o ON q.id = o.question_id
                      GROUP BY q.id) q
                         LEFT JOIN
                     metac_question_conditional qc ON qc.child_id = q.id
                -- Ensure parents go first
                ORDER BY group_id DESC;""",
            [tuple(site_ids)],
            itersize=10000,
        ),
        1,
    ):
        print(
            f"\033[Kprocessing questions/posts: {i}. "
            f"dur:{str(timezone.now() - start).split('.')[0]} ",
            end="\r",
        )
        group_id = old_question["group_id"]

        # If root
        if not group_id:
            old_groups[old_question["id"]] = {**old_question, "children": []}
        else:
            # Since we filter out parent questions which does not belong to the given site_ids
            # Some child questions might not have a parent, so we need to exclude such questions
            if group_id in old_groups:
                old_groups[group_id]["children"].append(old_question)
    print(
        f"\033[Kprocessing questions/posts: {i}. "
        f"dur:{str(timezone.now() - start).split('.')[0]} ",
    )

    print("Migrating notebooks")
    migrate_questions__notebook(list(old_groups.values()))

    print("Migrating groups")
    migrate_questions__groups(list(old_groups.values()))

    print("Migrating conditional pairs")
    migrate_questions__conditional(list(old_groups.values()))

    print("Migrating post snapshots")
    migrate_post_user_snapshots()

    print("Set relevant values")

    # Set relevant values:
    all_posts = Post.objects.all()
    for p in all_posts:
        p.update_pseudo_materialized_fields()

        # Handle open_time_triggered field
        # To ensure we won't send Open notifications for old posts
        if (
            p.published_at
            and p.published_at <= timezone.now()
            and p.curation_status == Post.CurationStatus.APPROVED
            and (not p.actual_close_time or p.actual_close_time >= timezone.now())
        ):
            p.open_time_triggered = True

        p.save()


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
            groups.append(
                GroupOfQuestions(
                    id=root_question["id"],
                    description=cleanup_markdown(root_question["description"]),
                    group_variable=root_question["group_label"],
                    resolution_criteria=cleanup_markdown(root_question["resolution_criteria"]),
                    fine_print=cleanup_markdown(root_question["fine_print"]),
                    graph_type=(
                        GroupOfQuestions.GroupOfQuestionsGraphType.FAN_GRAPH
                        if root_question["show_as_fan_graph"]
                        else GroupOfQuestions.GroupOfQuestionsGraphType.MULTIPLE_CHOICE_GRAPH
                    ),
                )
            )

            for child in root_question["children"]:
                questions.append(create_question(child, group_id=root_question["id"]))

            # Create post from the root question, but don't create a root question
            posts.append(
                create_post(root_question, group_of_questions_id=root_question["id"])
            )

    GroupOfQuestions.objects.bulk_create(groups)
    Question.objects.bulk_create(questions)
    Post.objects.bulk_create(posts)


def remove_newlines(match):
    return match.group(0).replace("\n", " ")


def remove_spaces(match):
    return match.group(0).replace(" ", "")


def migrate_questions__notebook(root_questions: list[dict]):
    """
    Migrates Conditional Questions
    """

    """
    For news we classify them with 3 special "new_thing" tags that we'll create to track these projects
    @Hlib can you figure this out please?
    Programs is project 2421
    Research is 2423
    Platform is 2424
    """

    related_notebook_projects = list(
        paginated_query(
            """
        SELECT qpp.question_id as question_id, p.id as id, p.name as name, p.type as type,
        p.slug, p.subtitle, p.description, p.header_image, p.header_logo, p.meta_description
                                                     ,p.created_at, p.edited_at, p.meta_description
        FROM metac_project_project p
        JOIN metac_project_questionprojectpermissions qpp ON p.id = qpp.project_id
        WHERE (p.type = 'PF' OR p.type = 'JO')
    """
        )
    )

    for root_question in root_questions:
        if root_question["type"] in ["notebook", "discussion", "claim"]:
            sub_related_notebook_projects = [
                x
                for x in related_notebook_projects
                if x["question_id"] == root_question["id"]
            ]

            projects = []
            for project_obj in sub_related_notebook_projects:
                project = Project.objects.filter(id=project_obj["id"]).first()
                if not project:
                    project = Project(
                        # We keep original IDS for old projects
                        id=project_obj["id"],
                        type=(
                            Project.ProjectTypes.PUBLIC_FIGURE
                            if project_obj["type"] == "PF"
                            else Project.ProjectTypes.NEWS_CATEGORY
                        ),
                        name=project_obj["name"],
                        slug=project_obj["slug"],
                        subtitle=project_obj["subtitle"],
                        description=project_obj["description"],
                        header_image=project_obj["header_image"],
                        header_logo=project_obj["header_logo"],
                        prize_pool=None,
                        close_date=None,
                        start_date=None,
                        sign_up_fields=[],
                        meta_description=project_obj["meta_description"],
                        created_at=(
                            project_obj["created_at"]
                            if project_obj["created_at"]
                            else timezone.now()
                        ),
                        edited_at=project_obj["edited_at"],
                        default_permission=ObjectPermission.VIEWER,
                    )
                    project.save()
                projects.append(project)

            if root_question["type"] == "notebook":
                notebook_type = Notebook.NotebookType.NEWS
            elif root_question["type"] == "discussion":
                notebook_type = Notebook.NotebookType.DISCUSSION
            elif root_question["type"] == "claim":
                notebook_type = Notebook.NotebookType.PUBLIC_FIGURE
            else:
                raise Exception("Unknown notebook type")

            markdown = cleanup_markdown(root_question["description"])

            image_url = root_question["image_url"] or ""

            if image_url:
                image_url = image_url.replace(
                    "https://metaculus-media.s3.amazonaws.com/", ""
                )

            notebook = Notebook(
                id=root_question["id"],
                markdown=markdown,
                type=notebook_type,
                image_url=image_url,
                created_at=root_question["created_time"],
                edited_at=root_question["edited_time"],
            )
            # Create post from the root question, but don't create a root question
            post = create_post(root_question, notebook_id=root_question["id"])

            notebook.save()
            post.save()
            post.projects.set(projects)
            post.save()


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

            try:
                old_question_yes = next(
                    q for q in root_question["children"] if q["qc_resolution"] == 1
                )
            except Exception:
                old_question_yes = None

            try:
                old_question_no = next(
                    q for q in root_question["children"] if q["qc_resolution"] == 0
                )
            except Exception:
                old_question_no = None

            condition_id = get_children_relation_id_by_attr("condition_id")
            condition_child_id = get_children_relation_id_by_attr("condition_child_id")

            if (
                not condition_id
                or not condition_child_id
                or not old_question_yes
                or not old_question_no
            ):
                print(
                    f"\n\nError migrating conditionl: {root_question['id']} Could not find all related questions for the conditional pair. old_question_yes: {old_question_yes}, old_question_no: {old_question_no}, condition_id: {condition_id}, condition_child_id: {condition_child_id}"
                )
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


def migrate_post_user_snapshots():
    post_ids = Post.objects.values_list("id", flat=True)
    snapshots = []

    start = timezone.now()
    for i, snapshot_obj in enumerate(
        paginated_query("SELECT * FROM metac_question_questionsnapshot"), 1
    ):
        print(
            f"\033[Kmigrating post user snapshots: {i}. "
            f"dur:{str(timezone.now() - start).split('.')[0]} ",
            end="\r",
        )
        if snapshot_obj["question_id"] not in post_ids:
            continue

        snapshots.append(
            PostUserSnapshot(
                user_id=snapshot_obj["user_id"],
                post_id=snapshot_obj["question_id"],
                comments_count=snapshot_obj["comments_count"],
                viewed_at=snapshot_obj["time"],
            )
        )

        if len(snapshots) >= 5_000:
            print(
                f"\033[Kmigrating post user snapshots: {i}. "
                f"dur:{str(timezone.now() - start).split('.')[0]} ",
                "Bulk creating...",
                end="\r",
            )
            PostUserSnapshot.objects.bulk_create(snapshots)
            snapshots = []

    print(
        f"\033[Kmigrating post user snapshots: {i}. "
        f"dur:{str(timezone.now() - start).split('.')[0]} ",
        "Bulk creating...",
        end="\r",
    )
    PostUserSnapshot.objects.bulk_create(snapshots)
    print(
        f"\033[Kmigrating post user snapshots: {i}. "
        f"dur:{str(timezone.now() - start).split('.')[0]} ",
        "Bulk creating... DONE",
    )


def migrate_post_snapshots_forecasts():
    # Subquery to get the latest forecast for each user per post
    qs = (
        Forecast.objects.annotate(
            assumed_post_id=Coalesce(
                "question__post__id",
                "question__group__post__id",
                "question__conditional_yes__post__id",
                "question__conditional_no__post__id",
            )
        )
        .order_by("assumed_post_id", "author_id", "-start_time")
        .distinct("assumed_post_id", "author_id")
        .values_list("assumed_post_id", "author_id", "start_time")
    )

    mapping = defaultdict(dict)

    for post_id, author_id, start_time in qs:
        mapping[post_id][author_id] = start_time

    # Updating in bulk
    bulk_update = []
    processed = 0

    for snapshot in PostUserSnapshot.objects.all().iterator(chunk_size=1_000):
        start_time = mapping[snapshot.post_id].get(snapshot.user_id)

        if not start_time:
            continue

        snapshot.last_forecast_date = start_time
        bulk_update.append(snapshot)

        processed += 1

        if len(bulk_update) >= 1000:
            PostUserSnapshot.objects.bulk_update(
                bulk_update, fields=["last_forecast_date"]
            )
            bulk_update = []

        if not (processed % 25_000):
            print(f"Updated PostUserSnapshot.last_forecast_date: {processed}", end="\r")

    PostUserSnapshot.objects.bulk_update(bulk_update, fields=["last_forecast_date"])
