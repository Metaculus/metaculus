from django.db import IntegrityError

from migrator.utils import paginated_query
from projects.models import Project


def create_project(project_obj: dict) -> Project:
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
        sign_up_fields=project_obj["sign_up_fields"],
        meta_description=project_obj["meta_description"],
        created_at=project_obj["created_at"],
        edited_at=project_obj["edited_at"],
    )

    return project


def create_category(cat_obj: dict) -> Project:
    def change_slug(slug: str):
        chunks = slug.split("/")

        if not len(chunks):
            return ""
        if len(chunks) == 1:
            return chunks[0]

        return "/".join(chunks[1:])

    project = Project(
        type=Project.ProjectTypes.CATEGORY,
        name=cat_obj["short_name"],
        # Category slugs are weird
        slug=change_slug(cat_obj["id"]),
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
    # Migrating only Tournament projects for now
    for project_obj in paginated_query(
        "SELECT * FROM metac_project_project WHERE type='TO'"
    ):
        project = create_project(project_obj)
        project.save()

    # Migrate Categories
    for cat_obj in paginated_query("SELECT * FROM metac_question_category"):
        project = create_category(cat_obj)

        try:
            project.save()
        except IntegrityError:
            # Skip this record, should be merged
            print(f"Skipped Category object migration {cat_obj}")

    # Migrate Tags
    for tag_obj in paginated_query("SELECT * FROM metac_question_tag"):
        project = create_tag(tag_obj)
        project.save()

    # Migrate Topics
    for topic_obj in paginated_query("SELECT * FROM metac_question_questiontopic"):
        project = create_topic(topic_obj)
        project.save()
