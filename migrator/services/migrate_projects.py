from migrator.utils import paginated_query, one2one_query
from projects.models import Project
from users.models import User


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
    )

    return project


def migrate_projects():
    # Migrating only Tournament projects for now
    for project_obj in paginated_query("SELECT * FROM metac_project_project WHERE type='TO'"):
        project = create_project(project_obj)
        project.save()
