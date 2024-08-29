import datetime

from freezegun import freeze_time

from posts.models import Post
from projects.permissions import ObjectPermission
from tests.unit.fixtures import *  # noqa
from tests.unit.test_comments.factories import factory_comment
from tests.unit.test_posts.factories import factory_post, factory_post_snapshot
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import factory_forecast
from tests.unit.test_questions.fixtures import *  # noqa
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

    def test_annotate_user_permission__creator(self, question_binary, user1):
        factory_post(
            author=user1,
            question=question_binary,
            projects=[
                factory_project(default_permission=ObjectPermission.VIEWER),
                factory_project(default_permission=ObjectPermission.CURATOR),
            ],
        )

        data = Post.objects.annotate_user_permission(user=user1).first()
        assert data.user_permission == ObjectPermission.CREATOR

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
            curation_status=Post.CurationStatus.PENDING,
        )

        # Post exists for creator
        assert Post.objects.filter_permission(user=user1).filter(pk=p1.pk).exists()
        # Post exists for the project owner
        assert Post.objects.filter_permission(user=user3).filter(pk=p1.pk).exists()
        # Post is not visible for Forecaster
        assert not Post.objects.filter_permission(user=user2).filter(pk=p1.pk).exists()
        # Post is not visible for a random user
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
        viewed_at=datetime.datetime(2024, 6, 1),
        divergence=0.95,
    )
    factory_post_snapshot(
        user=user2, post=post, comments_count=1, viewed_at=datetime.datetime(2024, 6, 2)
    )

    factory_comment(on_post=post, created_at=datetime.datetime(2024, 6, 1))
    factory_comment(on_post=post, created_at=datetime.datetime(2024, 6, 2))
    factory_comment(on_post=post, created_at=datetime.datetime(2024, 6, 3))

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
            start_time=datetime.datetime(2024, 7, 8),
        )
        factory_forecast(
            question=conditional_1.question_no,
            author=user1,
            start_time=datetime.datetime(2024, 7, 7),
        )

    # Previous month
    for idx in range(4):
        factory_forecast(
            question=conditional_1.question_no,
            author=user1,
            start_time=datetime.datetime(2024, 6, idx + 1),
        )

    assert (
        Post.objects.filter(pk=post.id)
        .annotate_weekly_movement()
        .first()
        .weekly_movement
        == 2
    )
