"""
# Migrations notes

TODO: take into account Project.public boolean flag

## default_project_permissions table
default_project_permissions:
    - has only 2 permission types used:
        - 0 (Null)
        - 2 (RESOLVE)
default_question_permissions:
    - has 3 permission types used:
        - 0 (None)
        - 294940 (VIEWER_PERMS)
        - 294941 (PREDICTOR_PERMS)

# metac_project_questionprojectpermissions:
    - Has 200+ projects, where every project has at least 2 different ad-hoc permissions for questions
        - Almost all diff is 295132 (coauthor_perms) VS 297180 (author_perms)
        - Top permissions for such cases:
            - 524287 (full_perms)
            - 297692 (something custom, more likely viewer_perms)
            - 297180 (author_perms)
            - 295132 (coauthor_perms)
            - 294941 (predictor_perms)
            -

"""

from collections import defaultdict

from migrator.utils import paginated_query
from posts.models import Post
from projects.models import Project
from projects.permissions import ObjectPermission
from utils.dtypes import flatten


def migrate_personal_projects():
    """
    Relations
        metac_project_project - Stores personal projects
        metac_project_userprojectpermissions -- Stores User<>Project permissions
        metac_project_questionprojectpermissions -- Stores Question<>Project permissions.
            This table describes which questions relate to which projects

    Questions:
        - What is `Project.public` and how does it correlate to question permissions?
        - Some PersonalProjects have 294941 (Predictor) permissions. How this could be?
            (Probably should be Public and not treated as PersonalProject)

    TODO:
        - Get owners of the private questions
        -
    """

    # Seems like old metac was creating a new Personal Project for each Private Question
    post_ids = Post.objects.values_list("id", flat=True)
    question_author_mapping = {
        x["id"]: x["author_id"]
        for x in paginated_query(
            "SELECT id, author_id FROM metac_question_question", itersize=50_000
        )
    }
    questions_map = {}
    questions_involved = set()
    question_projects_map = defaultdict(list)
    project_user_mapping = defaultdict(list)

    for perm_obj in paginated_query(
        "SELECT * FROM metac_project_userprojectpermissions"
    ):
        project_user_mapping[perm_obj["project_id"]].append(perm_obj)

    for project_obj in paginated_query(
        "SELECT p.id, p.default_question_permissions, qpp.question_id, qpp.permissions FROM metac_project_project p "
        "JOIN metac_project_questionprojectpermissions qpp "
        "ON qpp.project_id = p.id "
        # TODO: since we're migrating default_project_permissions=0 only,
        #   We might have a case when Question with Private And Public organization becomes totally unavailable
        #   But it's tmp
        "WHERE type = 'PP' AND default_project_permissions = 0"
    ):
        project_id = project_obj["id"]
        question_id = project_obj["question_id"]
        author_id = question_author_mapping[question_id]
        questions_involved.add(question_id)

        question_projects_map[question_id].append(
            {
                "project_id": project_id,
                "question_id": question_id,
                "question_author_id": author_id,
                # TODO: figure out what permissions is
                "permissions": project_obj["permissions"],
                "default_question_permissions": project_obj[
                    "default_question_permissions"
                ],
            }
        )

    # user_id -> Project()
    user_private_projects = {}
    bulk_project_to_posts = []
    bulk_project_to_user = []
    questions_404 = 0

    # Extract Project<>User permissions
    for question_id in questions_involved:
        if question_id not in post_ids:
            questions_404 += 1
            continue

        author_id = question_author_mapping[question_id]
        involved_projects = question_projects_map.get(question_id, [])
        involved_users = flatten(
            [
                project_user_mapping.get(prj["project_id"], [])
                for prj in involved_projects
            ]
        )

        # TODO: check if no projects attached! -> then private

        questions_map[question_id] = {
            "question_id": question_id,
            "author_id": question_author_mapping[question_id],
            "involved_projects": involved_projects,
            "involved_users": involved_users,
        }

        # TODO:
        pp = {p["default_question_permissions"] for p in involved_projects}

        if 0 in pp and len(pp) > 1:
            print(
                f"Something is very wrong: question {question_id} belongs to the Projects which have both None "
                f"and Full permissions"
            )

        if author_id not in user_private_projects:
            user_private_projects[author_id] = Project(
                name="Personal List",
                type=Project.ProjectTypes.PERSONAL_LIST,
                created_by_id=author_id,
                default_permission=None,
            )
        private_project = user_private_projects[author_id]

        bulk_project_to_posts.append(
            Project.posts.through(project=private_project, post_id=question_id)
        )

        # Add users to the author's personal project.
        # This allows them to potentially view all the author's private questions,
        # even if they previously did not have access, but it's fine
        #  17/06. UPD: After discussion with @george we decided not migrate permissions of the Private questions
        #         but allow users manually re-invite former members to their global private project
        #
        # for user_obj in involved_users:
        #     if user_obj["user_id"] != author_id:
        #         bulk_project_to_user.append(
        #             Project.override_permissions.through(
        #                 user_id=user_obj["user_id"],
        #                 project=private_project,
        #                 # Ignoring original permissions and setting to Forecaster for now
        #                 permission=ObjectPermission.FORECASTER,
        #             )
        #         )

    # Bulk creation
    Project.objects.bulk_create(list(user_private_projects.values()))
    Project.posts.through.objects.bulk_create(bulk_project_to_posts)
    Project.override_permissions.through.objects.bulk_create(
        bulk_project_to_user, ignore_conflicts=True
    )

    if questions_404:
        print(f"Couldn't find {questions_404}/{len(questions_involved)} questions")

    print(f"Migrated {len(questions_involved) - questions_404} questions")


def migrate_permissions():
    print("Migrating private questions")
    migrate_personal_projects()
