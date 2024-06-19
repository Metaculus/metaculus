from posts.models import Post
from projects.permissions import ObjectPermission
from tests.fixtures import *  # noqa
from tests.test_posts.factories import factory_post
from tests.test_projects.factories import factory_project
from tests.test_questions.factories import create_forecast
from tests.test_questions.fixtures import *  # noqa
from tests.test_users.factories import factory_user


class TestPostQuerySetAnnotatePredictionsCount:
    def test_question(self, question_binary, user1):
        post = factory_post(author=user1, question=question_binary)

        create_forecast(question=question_binary, author=user1)
        create_forecast(question=question_binary, author=user1)

        assert (
            Post.objects.filter(pk=post.id)
            .annotate_predictions_count()
            .first()
            .predictions_count
            == 2
        )

    def test_conditional_questions(self, conditional_1, user1):
        post = factory_post(author=user1, conditional=conditional_1)

        create_forecast(question=conditional_1.question_yes, author=user1)
        create_forecast(question=conditional_1.question_no, author=user1)
        create_forecast(question=conditional_1.question_no, author=user1)

        assert (
            Post.objects.filter(pk=post.id)
            .annotate_predictions_count()
            .first()
            .predictions_count
            == 3
        )

    def test_mixed(self, conditional_1, question_binary, user1):
        """
        This test ensures we have correct annotation distinct configuration
        https://docs.djangoproject.com/en/5.0/topics/db/aggregation/#combining-multiple-aggregations
        """

        post1 = factory_post(author=user1, conditional=conditional_1)
        post2 = factory_post(author=user1, question=question_binary)

        create_forecast(question=conditional_1.question_yes, author=user1)
        create_forecast(question=conditional_1.question_no, author=user1)
        create_forecast(question=conditional_1.question_no, author=user1)

        create_forecast(question=question_binary, author=user1)
        create_forecast(question=question_binary, author=user1)

        qs = Post.objects.annotate_predictions_count().annotate_nr_forecasters().all()

        assert next(x for x in qs if x.id == post1.id).predictions_count == 3
        assert next(x for x in qs if x.id == post2.id).predictions_count == 2


class TestPostPermissions:
    def test_annotate_user_permission(self, question_binary, user1, user2):
        factory_post(
            author=user2,
            question=question_binary,
            projects=[
                factory_project(default_permission=ObjectPermission.VIEWER),
                factory_project(default_permission=ObjectPermission.CURATOR),
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
        factory_post(author=factory_user())

        # User2 & User3
        p1 = factory_post(
            author=factory_user(),
            projects=[
                # Private Projects
                factory_project(
                    default_permission=None,
                    override_permissions={
                        user2.id: ObjectPermission.FORECASTER,
                        user3.id: ObjectPermission.ADMIN,
                    },
                ),
                factory_project(
                    default_permission=None,
                ),
            ],
        )

        # User1 & User3
        p2 = factory_post(
            author=user3,
            projects=[
                # Private Project
                factory_project(
                    default_permission=None,
                    override_permissions={
                        user1.id: ObjectPermission.FORECASTER,
                    },
                ),
            ],
        )

        # Public
        p3 = factory_post(
            author=factory_user(),
            projects=[
                # Private Project
                factory_project(default_permission=ObjectPermission.VIEWER),
            ],
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
