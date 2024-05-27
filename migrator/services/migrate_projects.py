import json

from django.db import IntegrityError

from migrator.utils import paginated_query
from projects.models import Project
from questions.models import Question


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

    project = Project(
        type=Project.ProjectTypes.TOURNAMENT,
        name=project_obj["name"],
        slug=project_obj["slug"],
        subtitle=project_obj["subtitle"],
        description=project_obj["description"],
        header_image=project_obj["header_image"],
        header_logo=project_obj["header_logo"],
        is_public=project_obj["public"],
        prize_pool=project_obj["prize_pool"],
        close_date=project_obj["tournament_close_date"],
        start_date=project_obj["tournament_start_date"],
        sign_up_fields=sign_up_fields,
        meta_description=project_obj["meta_description"],
        created_at=project_obj["created_at"],
        edited_at=project_obj["edited_at"],
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


def migrate_projects():
    # Extracting all question IDs to filter out those we didn't migrate
    question_ids = Question.objects.values_list("id", flat=True)
    q_p_m2m_cls = Question.projects.through

    # Migrating only Tournament projects for now
    for project_obj in paginated_query(
        "SELECT * FROM metac_project_project WHERE type='TO'"
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
            if m2m["question_id"] not in question_ids:
                continue

            m2m_objects.append(
                q_p_m2m_cls(
                    question_id=m2m["question_id"],
                    project_id=project.id,
                )
            )

        # Ignore nonexistent questions
        q_p_m2m_cls.objects.bulk_create(m2m_objects, ignore_conflicts=True)

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
            if m2m["question_id"] not in question_ids:
                continue

            m2m_objects.append(
                q_p_m2m_cls(
                    question_id=m2m["question_id"],
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
            if m2m["question_id"] not in question_ids:
                continue

            m2m_objects.append(
                q_p_m2m_cls(
                    question_id=m2m["question_id"],
                    project_id=project.id,
                )
            )

        # Ignore nonexistent questions
        q_p_m2m_cls.objects.bulk_create(m2m_objects, ignore_conflicts=True)

    # Migrate Topics
    for topic_obj in paginated_query("SELECT * FROM metac_question_questiontopic"):
        project = create_topic(topic_obj)
        project.save()

        #
        # Migrate question relations
        #
        m2m_objects = []
        for m2m in paginated_query(
            "SELECT * FROM metac_question_questiontopic_questions WHERE questiontopic_id=%s",
            [topic_obj["id"]],
        ):
            # Exclude questions we didn't migrate
            if m2m["question_id"] not in question_ids:
                continue

            # TODO: here we don't have a lot of direct Topic<>Question relations, so we need to investigate
            #   probably it originally has more complex relations through categories eg. Topic->Categories->Questions

            m2m_objects.append(
                q_p_m2m_cls(
                    question_id=m2m["question_id"],
                    project_id=project.id,
                )
            )

        # Ignore nonexistent questions
        q_p_m2m_cls.objects.bulk_create(m2m_objects, ignore_conflicts=True)
