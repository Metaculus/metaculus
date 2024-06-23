import itertools
import json

from django.db import IntegrityError

from migrator.utils import paginated_query, reset_sequence
from posts.models import Post
from projects.models import Project
from projects.permissions import ObjectPermission


def normalize_slug(slug: str):
    chunks = slug.split("/")

    if not len(chunks):
        return ""
    if len(chunks) == 1:
        return chunks[0]

    return "/".join(chunks[1:])


def create_project(project_obj: dict) -> Project:
    sign_up_fields = project_obj["sign_up_fields"]
    sign_up_fields = json.loads(sign_up_fields) if sign_up_fields else []

    project_type = {
        "TO": Project.ProjectTypes.TOURNAMENT,
        "QS": Project.ProjectTypes.QUESTION_SERIES,
        "MP": Project.ProjectTypes.SITE_MAIN,
    }.get(project_obj["type"])

    leaderboard_type = None
    if project_type in ["TO", "QS"]:
        if project_obj["score_type"] == "PEER_SCORE":
            leaderboard_type = Project.LeaderboardTypes.PEER
        elif project_obj["score_type"] == "LEGACY":
            leaderboard_type = Project.LeaderboardTypes.RELATIVE_LEGACY
        elif project_obj["score_type"] == "SPOT_PEER_SCORE":
            leaderboard_type = Project.LeaderboardTypes.SPOT_PEER

    project = Project(
        # We keep original IDS for old projects
        id=project_obj["id"],
        type=project_type,
        leaderboard_type=leaderboard_type,
        name=project_obj["name"],
        slug=project_obj["slug"],
        subtitle=project_obj["subtitle"],
        description=project_obj["description"],
        header_image=project_obj["header_image"],
        header_logo=project_obj["header_logo"],
        prize_pool=project_obj["prize_pool"],
        close_date=project_obj["tournament_close_date"],
        start_date=project_obj["tournament_start_date"],
        sign_up_fields=sign_up_fields,
        meta_description=project_obj["meta_description"],
        created_at=project_obj["created_at"],
        edited_at=project_obj["edited_at"],
        # Old project.default_question_permissions was not working
        # And project visibility was determined by `is_public` attr
        default_permission=(
            ObjectPermission.FORECASTER if project_obj["public"] else None
        ),
    )

    return project


def create_category(cat_obj: dict) -> Project:
    project = Project(
        type=Project.ProjectTypes.CATEGORY,
        name=cat_obj["short_name"],
        # Category slugs are weird
        slug=normalize_slug(cat_obj["id"]),
        description=cat_obj["long_name"],
        created_at=cat_obj["created_at"],
        edited_at=cat_obj["edited_at"],
    )

    return project


def create_tag(tag_obj: dict) -> Project:
    project = Project(
        type=Project.ProjectTypes.TAG,
        name=tag_obj["name"],
        slug=tag_obj["slug"],
        is_active=tag_obj["enabled"],
        created_at=tag_obj["created_at"],
        edited_at=tag_obj["created_at"],
    )

    return project


def create_topic(topic_obj: dict) -> Project:
    project = Project(
        type=Project.ProjectTypes.TOPIC,
        name=topic_obj["name"],
        slug=topic_obj["slug"],
        emoji=topic_obj["emoji"],
        is_active=topic_obj["stage"] == 2,
        order=topic_obj["rank"],
        section=topic_obj["section"],
    )

    return project


def migrate_topics(question_ids: list[int], q_p_m2m_cls):
    # Migrate Topics
    for topic_obj in paginated_query("SELECT * FROM metac_question_questiontopic"):
        project = create_topic(topic_obj)
        project.save()

        #
        # Migrate question relations
        #

        # Initially, questions were related to the topic through Topic->Category->Question Relation
        # Merging and deprecating such a thing
        related_category_ids = tuple(
            paginated_query(
                "SELECT * FROM metac_question_questiontopic_categories WHERE questiontopic_id=%s",
                [topic_obj["id"]],
                only_columns=["category_id"],
                flat=True,
            )
        )
        related_tag_ids = list(
            paginated_query(
                "SELECT * FROM metac_question_questiontopic_tags WHERE questiontopic_id=%s",
                [topic_obj["id"]],
                only_columns=["tag_id"],
                flat=True,
            )
        )
        related_project_ids = list(
            paginated_query(
                "SELECT * FROM metac_question_questiontopic_projects WHERE questiontopic_id=%s",
                [topic_obj["id"]],
                only_columns=["project_id"],
                flat=True,
            )
        )

        print("related_category_ids", related_category_ids)
        print("related_tag_ids", related_tag_ids)
        print("related_project_ids", related_project_ids)

        #
        # Aggregating all M2M tables which were related to the questions
        #
        m2m_queries = [
            # Topic<>Question
            paginated_query(
                "SELECT * FROM metac_question_questiontopic_questions WHERE questiontopic_id=%s",
                [topic_obj["id"]],
            ),
        ]

        if related_category_ids:
            m2m_queries.append(
                # Topic<>Category<>Question
                paginated_query(
                    "SELECT * FROM metac_question_question_categories WHERE category_id in %s",
                    [related_category_ids],
                )
            )
        if related_tag_ids:
            m2m_queries.append(
                # Topic<>Tag<>Question
                paginated_query(
                    "SELECT * FROM metac_question_questiontaglink WHERE tag_id in %s",
                    [tuple([str(x) for x in related_tag_ids])],
                )
            )
        if related_project_ids:
            m2m_queries.append(
                # Topic<>Project<>Question
                paginated_query(
                    "SELECT * FROM metac_project_questionprojectpermissions WHERE project_id in %s",
                    [tuple([str(x) for x in related_project_ids])],
                )
            )

        # Some topics contain inline question ids in topic.question_ids column
        m2m_queries.append([{"question_id": x} for x in topic_obj["question_ids"]])
        print("inline_question_ids", topic_obj["question_ids"])

        m2m_objects = []
        for m2m in itertools.chain(*m2m_queries):
            # Exclude questions we didn't migrate
            if m2m["question_id"] not in question_ids:
                continue

            m2m_objects.append(
                q_p_m2m_cls(
                    post_id=m2m["question_id"],
                    project_id=project.id,
                )
            )

        # Ignore nonexistent questions
        q_p_m2m_cls.objects.bulk_create(m2m_objects, ignore_conflicts=True)


def migrate_projects():
    # Extracting all post IDs to filter out those we didn't migrate
    # Please note: post ids are the same as question ids!
    post_ids = Post.objects.values_list("id", flat=True)
    q_p_m2m_cls = Post.projects.through

    # Migrating only Tournament projects for now
    for project_obj in paginated_query(
        "SELECT * FROM metac_project_project WHERE type in ('TO', 'QS') OR (type = 'MP' and site_id = 1)"
    ):
        project = create_project(project_obj)
        project.save()

        #
        # Migrate question relations
        #
        m2m_objects = []
        for m2m in paginated_query(
            "SELECT * FROM metac_project_questionprojectpermissions WHERE project_id=%s",
            [project_obj["id"]],
        ):
            # Exclude questions we didn't migrate
            if m2m["question_id"] not in post_ids:
                continue

            m2m_objects.append(
                q_p_m2m_cls(
                    post_id=m2m["question_id"],
                    project_id=project.id,
                )
            )

        # Ignore nonexistent questions
        q_p_m2m_cls.objects.bulk_create(m2m_objects, ignore_conflicts=True)

    # Normalize id sequences
    reset_sequence()

    # Migrate Categories
    for cat_obj in paginated_query("SELECT * FROM metac_question_category"):
        project = create_category(cat_obj)

        try:
            project.save()
        except IntegrityError:
            # Skip this record, should be merged
            print(f"Skipped Category object migration {cat_obj}")

            # Find existing instance of this duplicate, so we could merge these instances into one
            project = Project.objects.get(slug=project.slug, type=project.type)

        #
        # Migrate question relations
        #
        m2m_objects = []
        for m2m in paginated_query(
            "SELECT * FROM metac_question_question_categories WHERE category_id=%s",
            [cat_obj["id"]],
        ):
            # Exclude questions we didn't migrate
            if m2m["question_id"] not in post_ids:
                continue

            m2m_objects.append(
                q_p_m2m_cls(
                    post_id=m2m["question_id"],
                    project_id=project.id,
                )
            )

        # Ignore nonexistent questions
        q_p_m2m_cls.objects.bulk_create(m2m_objects, ignore_conflicts=True)

    # Migrate Tags
    for tag_obj in paginated_query("SELECT * FROM metac_question_tag"):
        project = create_tag(tag_obj)
        project.save()

        #
        # Migrate question relations
        #
        m2m_objects = []
        for m2m in paginated_query(
            "SELECT * FROM metac_question_questiontaglink WHERE tag_id=%s",
            [tag_obj["id"]],
        ):
            # Exclude "disabled" tag relations
            if not m2m["enabled"]:
                continue

            # Exclude questions we didn't migrate
            if m2m["question_id"] not in post_ids:
                continue

            m2m_objects.append(
                q_p_m2m_cls(
                    post_id=m2m["question_id"],
                    project_id=project.id,
                )
            )

        # Ignore nonexistent questions
        q_p_m2m_cls.objects.bulk_create(m2m_objects, ignore_conflicts=True)

    migrate_topics(post_ids, q_p_m2m_cls)
