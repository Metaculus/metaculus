from datetime import datetime

import pytest  # noqa
from freezegun import freeze_time
from django.utils import timezone
from django.utils.timezone import make_aware


from posts.models import Post
from questions.models import Question
from projects.models import Project, ProjectUserPermission
from projects.permissions import ObjectPermission
from projects.services.common import get_site_main_project
from tests.unit.test_comments.factories import factory_comment
from tests.unit.test_posts.factories import factory_post, factory_post_snapshot
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import factory_forecast, create_conditional, create_question
from tests.unit.test_questions.conftest import *  # noqa
from tests.unit.test_users.factories import factory_user


class TestPostQuerySetAnnotatePredictionsCount:
    def test_question(self, question_binary, user1):
        post = factory_post(author=user1, question=question_binary)

        factory_forecast(question=question_binary, author=user1)
        factory_forecast(question=question_binary, author=user1)

        assert Post.objects.filter(pk=post.id).first().forecasts_count == 2

    def test_conditional_questions(self, conditional_1, user1):
        post = factory_post(author=user1, conditional=conditional_1)

        factory_forecast(question=conditional_1.question_yes, author=user1)
        factory_forecast(question=conditional_1.question_no, author=user1)
        factory_forecast(question=conditional_1.question_no, author=user1)

        assert Post.objects.filter(pk=post.id).first().forecasts_count == 3

    def test_mixed(self, conditional_1, question_binary, user1):
        """
        This test ensures we have correct annotation distinct configuration
        https://docs.djangoproject.com/en/5.0/topics/db/aggregation/#combining-multiple-aggregations
        """

        post1 = factory_post(author=user1, conditional=conditional_1)
        post2 = factory_post(author=user1, question=question_binary)

        factory_forecast(question=conditional_1.question_yes, author=user1)
        factory_forecast(question=conditional_1.question_no, author=user1)
        factory_forecast(question=conditional_1.question_no, author=user1)

        factory_forecast(question=question_binary, author=user1)
        factory_forecast(question=question_binary, author=user1)

        qs = Post.objects.all()

        assert next(x for x in qs if x.id == post1.id).forecasts_count == 3
        assert next(x for x in qs if x.id == post2.id).forecasts_count == 2


class TestPostPermissions:
    def test_annotate_user_permission(self, question_binary, user1, user2):
        factory_post(
            author=user2,
            question=question_binary,
            default_project=factory_project(
                default_permission=ObjectPermission.VIEWER,
                override_permissions={user1.id: ObjectPermission.CURATOR},
            ),
            projects=[
                factory_project(default_permission=ObjectPermission.VIEWER),
            ],
        )

        data = Post.objects.annotate_user_permission(user=user1).first()
        assert data.user_permission == ObjectPermission.CURATOR

    def test_annotate_user_permission__creator(self, question_binary, user1, user2):
        factory_post(
            author=user1,
            question=question_binary,
            default_project=factory_project(
                default_permission=ObjectPermission.VIEWER, created_by=user2
            ),
            projects=[
                factory_project(default_permission=ObjectPermission.VIEWER),
                factory_project(default_permission=ObjectPermission.CURATOR),
            ],
        )

        data = Post.objects.annotate_user_permission(user=user1).first()
        assert data.user_permission == ObjectPermission.CREATOR

        data = Post.objects.annotate_user_permission(user=user2).first()
        assert data.user_permission == ObjectPermission.ADMIN

    def test_annotate_user_permission__superuser_personal_projects(
        self, question_binary, user1, user_admin
    ):
        default_project = factory_project(
            default_permission=None,
            created_by=user1,
            type=Project.ProjectTypes.PERSONAL_PROJECT,
        )
        factory_post(
            author=user1,
            question=question_binary,
            default_project=default_project,
        )

        data = Post.objects.annotate_user_permission(user=user1).first()
        assert data.user_permission == ObjectPermission.ADMIN

        assert not Post.objects.annotate_user_permission(user=user_admin)

        # Invite admin user
        ProjectUserPermission.objects.create(
            user=user_admin,
            project=default_project,
            permission=ObjectPermission.FORECASTER,
        )

        data = Post.objects.annotate_user_permission(user=user_admin).first()
        assert data.user_permission == ObjectPermission.FORECASTER

    def test_filter_permission(self, user1, user2):
        user3 = factory_user()

        # Invisible project
        factory_post(
            author=factory_user(),
            default_project=factory_project(default_permission=None),
        )

        # User2 & User3
        p1 = factory_post(
            author=factory_user(),
            default_project=factory_project(
                # Private Projects
                default_permission=None,
                override_permissions={
                    user2.id: ObjectPermission.FORECASTER,
                    user3.id: ObjectPermission.ADMIN,
                },
            ),
            projects=[
                # Private Projects
                factory_project(
                    default_permission=None,
                ),
            ],
        )

        # User1 & User3
        p2 = factory_post(
            author=user3,
            # Private Project
            default_project=factory_project(
                default_permission=None,
                override_permissions={
                    user1.id: ObjectPermission.FORECASTER,
                },
            ),
        )

        # Public
        p3 = factory_post(
            author=factory_user(),
            default_project=factory_project(default_permission=ObjectPermission.VIEWER),
        )

        # Anon user
        assert set(Post.objects.filter_permission().values_list("id", flat=True)) == {
            p3.id
        }
        # User 1
        assert set(
            Post.objects.filter_permission(user=user1).values_list("id", flat=True)
        ) == {p2.id, p3.id}
        # User 2
        assert set(
            Post.objects.filter_permission(user=user2).values_list("id", flat=True)
        ) == {p1.id, p3.id}
        # User 3
        assert set(
            Post.objects.filter_permission(user=user3).values_list("id", flat=True)
        ) == {p1.id, p2.id, p3.id}

        #
        # Test allowed by permission level
        #
        assert set(
            Post.objects.filter_permission(
                user=user3, permission=ObjectPermission.FORECASTER
            ).values_list("id", flat=True)
        ) == {p1.id, p2.id}
        assert set(
            Post.objects.filter_permission(
                user=user3, permission=ObjectPermission.CURATOR
            ).values_list("id", flat=True)
        ) == {p1.id, p2.id}
        assert set(
            Post.objects.filter_permission(
                user=user3, permission=ObjectPermission.ADMIN
            ).values_list("id", flat=True)
        ) == {p1.id, p2.id}

        assert set(
            Post.objects.filter_permission(
                user=user1, permission=ObjectPermission.FORECASTER
            ).values_list("id", flat=True)
        ) == {p2.id}
        assert not set(
            Post.objects.filter_permission(
                user=user1, permission=ObjectPermission.ADMIN
            ).values_list("id", flat=True)
        )

    def test_non_approved_queryset(self, user1, user2):
        user3 = factory_user()
        user4 = factory_user()

        # User2 & User3
        p1 = factory_post(
            author=user1,
            default_project=factory_project(
                # Private Projects
                default_permission=ObjectPermission.VIEWER,
                override_permissions={
                    user2.id: ObjectPermission.FORECASTER,
                    user3.id: ObjectPermission.ADMIN,
                },
            ),
            curation_status=Post.CurationStatus.DRAFT,
        )

        # Post exists for creator
        assert Post.objects.filter_permission(user=user1).filter(pk=p1.pk).exists()
        # Draft post should not be visible to anyone except creators and admins/curators
        assert Post.objects.filter_permission(user=user3).filter(pk=p1.pk).exists()
        # Post is not visible for Forecaster
        assert not Post.objects.filter_permission(user=user2).filter(pk=p1.pk).exists()
        # Post is not visible for a random user
        assert not Post.objects.filter_permission(user=user4).filter(pk=p1.pk).exists()

        # Making it pending should change a situation
        p1.curation_status = Post.CurationStatus.PENDING
        p1.save()

        # Post still exists for creator
        assert Post.objects.filter_permission(user=user1).filter(pk=p1.pk).exists()
        # Visible for admins
        assert Post.objects.filter_permission(user=user3).filter(pk=p1.pk).exists()
        # Post is not visible for Forecaster
        assert not Post.objects.filter_permission(user=user2).filter(pk=p1.pk).exists()
        # Post is not visible for a random user
        assert not Post.objects.filter_permission(user=user4).filter(pk=p1.pk).exists()

        # Change it to site main, but still draft
        p1.default_project = get_site_main_project()
        p1.save()

        # Post is now visible for Forecaster
        assert Post.objects.filter_permission(user=user2).filter(pk=p1.pk).exists()
        # Post is now visible for a random user
        assert Post.objects.filter_permission(user=user4).filter(pk=p1.pk).exists()

        # Approve post
        p1.curation_status = Post.CurationStatus.APPROVED
        p1.published_at = timezone.now()
        p1.save()

        # Post is visible for creator
        assert Post.objects.filter_permission(user=user1).filter(pk=p1.pk).exists()
        # Visible for admins
        assert Post.objects.filter_permission(user=user3).filter(pk=p1.pk).exists()
        # Post visible for Forecaster
        assert Post.objects.filter_permission(user=user2).filter(pk=p1.pk).exists()
        # Post visible for a random user
        assert Post.objects.filter_permission(user=user4).filter(pk=p1.pk).exists()

        # Reject post
        p1.curation_status = Post.CurationStatus.REJECTED
        p1.save()

        # Post is visible for creator only
        assert Post.objects.filter_permission(user=user1).filter(pk=p1.pk).exists()
        # not visible for admins
        assert not Post.objects.filter_permission(user=user3).filter(pk=p1.pk).exists()
        # Post not visible for Forecaster
        assert not Post.objects.filter_permission(user=user2).filter(pk=p1.pk).exists()
        # Post not visible for a random user
        assert not Post.objects.filter_permission(user=user4).filter(pk=p1.pk).exists()

    @pytest.mark.parametrize(
        "user_project_permission,excepted_permission",
        [
            [ObjectPermission.ADMIN, ObjectPermission.ADMIN],
            [ObjectPermission.CURATOR, ObjectPermission.CURATOR],
            [ObjectPermission.FORECASTER, ObjectPermission.CREATOR],
            [ObjectPermission.VIEWER, ObjectPermission.CREATOR],
        ],
    )
    def test_owner_vs_admin_permission(
        self, user1, user_project_permission, excepted_permission
    ):
        p1 = factory_post(
            author=user1,
            default_project=factory_project(
                # Private Projects
                override_permissions={
                    user1.id: user_project_permission,
                },
            ),
            curation_status=Post.CurationStatus.APPROVED,
        )

        # Post exists for creator
        assert (
            Post.objects.annotate_user_permission(user=user1)
            .filter(pk=p1.pk)
            .first()
            .user_permission
            == excepted_permission
        )


def test_annotate_unread_comment_count(user1, user2, user_admin):
    # User2 & User3
    post = factory_post(
        author=factory_user(),
        default_project=factory_project(default_permission=ObjectPermission.VIEWER),
        curation_status=Post.CurationStatus.APPROVED,
    )

    factory_post_snapshot(
        user=user1,
        post=post,
        comments_count=2,
        viewed_at=datetime(2024, 6, 1),
        divergence=0.95,
    )
    factory_post_snapshot(
        user=user2, post=post, comments_count=1, viewed_at=datetime(2024, 6, 2)
    )

    factory_comment(on_post=post, created_at=datetime(2024, 6, 1))
    factory_comment(on_post=post, created_at=datetime(2024, 6, 2))
    factory_comment(on_post=post, created_at=datetime(2024, 6, 3))

    assert (
        Post.objects.filter(pk=post.id).annotate_unread_comment_count(user1.id).first()
    ).unread_comment_count == 1
    assert (
        Post.objects.filter(pk=post.id).annotate_unread_comment_count(user2.id).first()
    ).unread_comment_count == 2


@freeze_time("2024-07-09")
@pytest.mark.skip()
def test_annotate_weekly_movement(user1, conditional_1):
    post = factory_post(author=user1, conditional=conditional_1)

    for _ in range(2):
        factory_forecast(
            question=conditional_1.question_yes,
            author=user1,
            start_time=datetime(2024, 7, 8),
        )
        factory_forecast(
            question=conditional_1.question_no,
            author=user1,
            start_time=datetime(2024, 7, 7),
        )

    # Previous month
    for idx in range(4):
        factory_forecast(
            question=conditional_1.question_no,
            author=user1,
            start_time=datetime(2024, 6, idx + 1),
        )

    assert (
        Post.objects.filter(pk=post.id)
        .annotate_weekly_movement()
        .first()
        .weekly_movement
        == 2
    )


@pytest.mark.parametrize(
    "condition_sct,child_sct,expected_sct",
    [
        (
            make_aware(datetime(2024, 1, 1)),
            make_aware(datetime(2025, 1, 1)),
            make_aware(datetime(2024, 1, 1)),
        ),
        (
            make_aware(datetime(2025, 1, 1)),
            make_aware(datetime(2024, 1, 1)),
            make_aware(datetime(2024, 1, 1)),
        ),
    ],
)
def test_set_scheduled_close_time__conditional(
    user1, condition_sct, child_sct, expected_sct
):
    post = factory_post(
        author=user1,
        conditional=create_conditional(
            condition=create_question(
                question_type=Question.QuestionType.BINARY,
                scheduled_close_time=condition_sct,
            ),
            condition_child=create_question(
                question_type=Question.QuestionType.BINARY,
                scheduled_close_time=child_sct,
            ),
            question_yes=create_question(
                question_type=Question.QuestionType.NUMERIC, title="If Yes"
            ),
            question_no=create_question(
                question_type=Question.QuestionType.NUMERIC, title="If No"
            ),
        ),
    )
    post.set_scheduled_close_time()
    assert post.scheduled_close_time == expected_sct
