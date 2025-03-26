import itertools
import json

from django.db import IntegrityError
from migrator.utils import paginated_query, reset_sequence
from posts.models import Post
from projects.models import Project
from projects.permissions import ObjectPermission
from scoring.models import Leaderboard


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
        "PP": Project.ProjectTypes.PERSONAL_PROJECT,
    }.get(project_obj["type"])

    # https://www.notion.so/metaculus/Private-Projects-that-aren-t-tournaments-or-question-series-should-become-private-question-series-02cb0bedd6a54650869879b6323d96ff
    # Converting other types to QUESTION_SERIES
    project_type = project_type or Project.ProjectTypes.QUESTION_SERIES

    leaderboard_score_type = None
    if project_type in [
        Project.ProjectTypes.TOURNAMENT,
        Project.ProjectTypes.QUESTION_SERIES,
    ]:
        if project_obj["score_type"] == "PEER_SCORE":
            leaderboard_score_type = Leaderboard.ScoreTypes.PEER_TOURNAMENT
        elif project_obj["score_type"] == "LEGACY":
            leaderboard_score_type = Leaderboard.ScoreTypes.RELATIVE_LEGACY_TOURNAMENT
        elif project_obj["score_type"] == "SPOT_PEER_SCORE":
            leaderboard_score_type = Leaderboard.ScoreTypes.SPOT_PEER_TOURNAMENT

    config = json.loads(project_obj["config"])
    project = Project(
        # We keep original IDS for old projects
        id=project_obj["id"],
        type=project_type,
        name=project_obj["name"],
        slug=project_obj["slug"],
        include_bots_in_leaderboard=config.get("is_fab_project", False),
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
            ObjectPermission.FORECASTER
            if (project_obj["public"] and project_obj["id"] != 3349)
            else None
        ),
        add_posts_to_main_feed=project_obj["in_main_feed_by_default"],
    )

    if project_obj["id"] == 3349:
        # the FAB project (id == 3349), was probably the only project using the default_question_permissions
        # to make the project visible to everyone, but predictable only by the users added to the project
        project.default_permission = ObjectPermission.VIEWER

    project.save()
    if leaderboard_score_type:
        existing_leaderboard = Leaderboard.objects.filter(
            project=project, score_type=leaderboard_score_type
        ).first()
        if existing_leaderboard:
            project.primary_leaderboard = existing_leaderboard
        else:
            project.primary_leaderboard = Leaderboard.objects.create(
                project=project,
                score_type=leaderboard_score_type,
                start_time=project.start_date,
                finalize_time=project.close_date,
            )
        # awkward double save since Leaderboard creation requires project.id
        # And project.primary_leaderboard requires Leaderboard.id
        project.save()
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
        print(
            f"related_categories:{related_category_ids} "
            f"related_tags:{related_tag_ids} "
            f"related_projects:{related_project_ids} "
            f"inline_questions:{topic_obj["question_ids"]}",
            end="\r",
        )

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


def migrate_projects(site_ids: list[int] = None):
    site_ids = site_ids or []

    # Extracting all post IDs to filter out those we didn't migrate
    # Please note: post ids are the same as question ids!
    post_ids = Post.objects.values_list("id", flat=True)
    q_p_m2m_cls = Post.projects.through

    for project_obj in paginated_query(
        "SELECT * FROM metac_project_project " "WHERE site_id in %s",
        [tuple(site_ids)],
    ):
        project = create_project(project_obj)

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
        category_site_id = int(cat_obj["id"].split("/")[0])

        # Skip categories from other sites
        if category_site_id not in site_ids:
            continue

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


def cleanup_unused_projects():
    """
    Drop projects without relations
    """

    Project.objects.filter(default_posts__isnull=True, posts__isnull=True).delete()
