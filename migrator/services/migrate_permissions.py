from collections import defaultdict

from migrator.utils import paginated_query
from posts.models import Post
from projects.models import Project, ProjectUserPermission
from projects.permissions import ObjectPermission

# TODO: add post default project
# TODO: add smooth deprecation of QuestionProjectPermission
# TODO: deprecate data from other organizations
# TODO: check tags/categories permissions and ensure private posts with public tags do not exist!!!
# TODO: UserProjectPermission: diff Project permission VS Question permission and ensure they are all about the same level +-
# TODO: adjust Post.default_project permissions
# TODO: coauthors: for private questions we are doing 1 proj per post!!!


# TEST CASES:
# http://localhost:8000/questions/23016/hr-professionals-ai-literacy-levels/
#   Should not be visible
#

OLD_PROJECT_TYPES = [
    Project.ProjectTypes.TOURNAMENT,
    Project.ProjectTypes.QUESTION_SERIES,
    Project.ProjectTypes.PERSONAL_PROJECT,
]


def convert_question_permissions(code: int):
    # TODO: ignore permissions if post creator

    return {
        524287: ObjectPermission.ADMIN,
        294941: ObjectPermission.FORECASTER,
        # private_project_perms, probably an admin
        65535: ObjectPermission.ADMIN,
        # moderator_perms
        316860: ObjectPermission.CURATOR,
        # 360477
        # <Original Permissions:PREDICT|COMMENT_READ|COMMENT_POST|COMMENT_EDIT|VIEW_COMMUNITY_PRED|VIEW_METACULUS_PRED|VIEW_METACULUS_PRED_AFTER_CLOSE: 360477>
        360477: ObjectPermission.FORECASTER,
        # 491549
        # <Original Permissions:PREDICT|COMMENT_READ|COMMENT_POST|COMMENT_EDIT|VIEW_COMMUNITY_PRED|VIEW_METACULUS_PRED|VIEW_COMMUNITY_PRED_AFTER_CLOSE|VIEW_METACULUS_PRED_AFTER_CLOSE: 491549>
        491549: ObjectPermission.FORECASTER,
        # 491933
        # <Original Permissions:PREDICT|COMMENT_READ|COMMENT_POST|COMMENT_EDIT|EDIT_PENDING_CONTENT|EDIT_UPCOMING_CONTENT|VIEW_COMMUNITY_PRED|VIEW_METACULUS_PRED|VIEW_COMMUNITY_PRED_AFTER_CLOSE|VIEW_METACULUS_PRED_AFTER_CLOSE: 491933>
        491933: ObjectPermission.FORECASTER,
        # <Original Permissions:PREDICT|COMMENT_READ|COMMENT_POST|VIEW_COMMUNITY_PRED|VIEW_METACULUS_PRED|VIEW_COMMUNITY_PRED_AFTER_CLOSE|VIEW_METACULUS_PRED_AFTER_CLOSE: 491533>
        491533: ObjectPermission.FORECASTER,
        # Should be probably MOD, but will see
        # <Original Permissions:PREDICT|RESOLVE|COMMENT_READ|COMMENT_POST|COMMENT_EDIT|COMMENT_MOD|EDIT_PENDING_CONTENT|EDIT_UPCOMING_CONTENT|EDIT_CATEGORIES|CHANGE_PENDING_STATUS|CROSSPOST|VIEW_COMMUNITY_PRED|VIEW_METACULUS_PRED_AFTER_CLOSE: 316863>
        316863: ObjectPermission.CURATOR,
        # <Original Permissions:COMMENT_READ|COMMENT_POST|COMMENT_EDIT|COMMENT_MOD|EDIT_PENDING_CONTENT|EDIT_UPCOMING_CONTENT|EDIT_CATEGORIES|CHANGE_PENDING_STATUS|VIEW_COMMUNITY_PRED|VIEW_METACULUS_PRED|VIEW_METACULUS_PRED_AFTER_CLOSE: 366012>
        366012: ObjectPermission.CURATOR,
        # <Original Permissions:COMMENT_READ|COMMENT_POST|COMMENT_EDIT|COMMENT_MOD|EDIT_PENDING_CONTENT|EDIT_UPCOMING_CONTENT|EDIT_CATEGORIES|CHANGE_PENDING_STATUS|CROSSPOST|VIEW_COMMUNITY_PRED|VIEW_METACULUS_PRED|VIEW_METACULUS_PRED_AFTER_CLOSE: 382396>
        382396: ObjectPermission.CURATOR,
        # viewer_perms
        294940: ObjectPermission.VIEWER,
        # author_perms
        297180: ObjectPermission.CREATOR,
        # <Original Permissions:COMMENT_READ|COMMENT_POST|COMMENT_EDIT|VIEW_COMMUNITY_PRED|VIEW_METACULUS_PRED_AFTER_CLOSE|VIEW_AUTHORS_ANONYMIZED: 1343516>
        1343516: ObjectPermission.FORECASTER,
    }.get(code)


def convert_project_permissions(code):
    return {
        # none. But this does not hide anything, project is still visible for the user
        0: ObjectPermission.VIEWER,
        # SUGGEST_NEW_QUESTION
        2: ObjectPermission.VIEWER,
        # full_perms
        31: ObjectPermission.ADMIN,
        # private_project_perms
        15: ObjectPermission.ADMIN,
        # <ProjectPermissions.SUGGEST_NEW_QUESTION|ADD_CROSSPOSTED_QUESTION: 6>
        6: ObjectPermission.VIEWER,
    }.get(code)


def migrate_permissions():
    # Extracting ids of entities that was the only Project types in the old Metac
    project_ids = Project.objects.filter(type__in=OLD_PROJECT_TYPES).values_list(
        "id", flat=True
    )
    user_project_perms = []
    project_question_permissions_map = defaultdict(list)

    for obj in paginated_query(
        "SELECT * FROM metac_project_questionprojectpermissions"
    ):
        project_question_permissions_map[obj["project_id"]].append(obj)

    total_missed_projects = 0

    # Migrating User<>Project ad-hoc permissions
    for user_project_perm_obj in paginated_query(
        """
        SELECT 
           upp.*, p.default_question_permissions, p.default_project_permissions, p.public
        FROM metac_project_userprojectpermissions upp
        JOIN metac_project_project p 
        ON upp.project_id = p.id
    """
    ):
        # New app merges Project & Categories & Tags etc.
        # Tournaments & QS & PP were migrated to Project model with the same Ids as the old ones.
        # All further instances in Project table (e.g. tags) are created with next id autoinc sequence
        # So we need to ensure we don't link permissions to newly generated entities
        # that are not related to the old Project table
        if user_project_perm_obj["project_id"] not in project_ids:
            total_missed_projects += 1

            continue

        # TODO: add smooth deprecation of QuestionProjectPermission
        default_question_permissions = user_project_perm_obj[
            "default_question_permissions"
        ]

        # Get override permission and ensure it includes default one
        question_permission_code = user_project_perm_obj["question_permissions"]

        if pq_permissions := project_question_permissions_map[
            user_project_perm_obj["project_id"]
        ]:
            all_permission = {obj["permissions"] for obj in pq_permissions}

            # Performing odd permissions check
            # Taken from the original project
            # To ensure we can't override permissions declared in ProjectQuestion.permissions
            for permission in all_permission:
                bitcheck = permission & (
                    question_permission_code | default_question_permissions
                )

                if bitcheck != question_permission_code and bitcheck != (
                    question_permission_code | default_question_permissions
                ):
                    # private_project_perms probably should not be altered
                    # TODO: don't make authors as admins, there should be AUTHOR permission, otherwise -> COAUTHOR
                    if question_permission_code == 65535:
                        continue

                    if len(all_permission) == 1:
                        continue

                    # TODO: handle other cases

                    break

        question_permission = convert_question_permissions(question_permission_code)

        if not question_permission:
            continue

        user_project_perms.append(
            ProjectUserPermission(
                user_id=user_project_perm_obj["user_id"],
                project_id=user_project_perm_obj["project_id"],
                permission=question_permission,
            )
        )

    ProjectUserPermission.objects.bulk_create(
        user_project_perms, batch_size=50_000, ignore_conflicts=True
    )
    print(f"Missed projects: {total_missed_projects}")

    # Assign default_project to the Posts
    # Based on the most Public Project they have
    total_posts_without_projects = 0
    posts_to_update = []

    for post in Post.objects.prefetch_related("projects").iterator(chunk_size=10_000):
        sorted_projects = sorted(
            [
                project
                for project in post.projects.all()
                if project.type in OLD_PROJECT_TYPES
            ],
            key=lambda x: ObjectPermission.get_numeric_representation().get(
                x.default_permission
            )
            or 0,
        )

        if sorted_projects:
            # Taking the most "Open" project as the default one
            post.default_project = sorted_projects[-1]
            posts_to_update.append(post)
        else:
            total_posts_without_projects += 1

    Post.objects.bulk_update(
        posts_to_update, batch_size=50_000, fields=["default_project"]
    )

    print(f"Posts without Projects: {total_posts_without_projects}")
    print(f"Migrated default_project for {len(posts_to_update)} posts")
