from notifications.models import Notification
from notifications.services import (
    NotificationNewComments,
    NotificationPostParams,
    NotificationPostCPChange,
    CPChangeData,
    NotificationQuestionParams,
    NotificationPostStatusChange,
    NotificationProjectParams,
    NotificationPredictedQuestionResolved,
    delete_scheduled_question_resolution_notifications,
)
from posts.models import Post
from tests.unit.test_comments.factories import factory_comment
from tests.unit.test_notifications.factories import factory_notification
from tests.unit.test_posts.conftest import *  # noqa
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_questions.conftest import *  # noqa


class TestNotificationNewComments:
    def test_get_email_context_group(self, user1, user2, mocker):
        mocker.patch("misc.tasks.send_email_async.send")
        fn = mocker.patch("posts.services.feed.get_similar_posts_for_posts")
        fn.return_value = []
        post_1 = factory_post(author=user1)
        post_2 = factory_post(author=user1)

        # Post #1 Notifications
        post_1_duplicated_comment = factory_comment(
            author=user2, on_post=post_1, text_en="Comment 2"
        )

        factory_notification(
            recipient=user1,
            notification_type="post_new_comments",
            params=NotificationNewComments.ParamsType(
                post=NotificationPostParams.from_post(post_1),
                new_comments_count=0,
                new_comment_ids=[
                    factory_comment(
                        author=user2, on_post=post_1, text_en="Comment 1"
                    ).pk,
                    post_1_duplicated_comment.pk,
                ],
            ),
        )
        factory_notification(
            recipient=user1,
            notification_type="post_new_comments",
            params=NotificationNewComments.ParamsType(
                post=NotificationPostParams.from_post(post_1),
                new_comments_count=0,
                new_comment_ids=[
                    factory_comment(
                        author=user2,
                        on_post=post_1,
                        text_en=(
                            "It is a long established fact that a reader will be distracted by the readable content of "
                            "a page when looking at its layout. @user1 The point of using Lorem Ipsum is that "
                            "it has a more-or-less normal distribution of letters, as opposed to using"
                        ),
                    ).pk
                ],
            ),
        )
        factory_notification(
            recipient=user1,
            notification_type="post_new_comments",
            params=NotificationNewComments.ParamsType(
                post=NotificationPostParams.from_post(post_1),
                new_comments_count=0,
                new_comment_ids=[
                    factory_comment(
                        author=user2, on_post=post_1, text_en="Comment 3"
                    ).pk,
                    factory_comment(
                        author=user2, on_post=post_1, text_en="Comment 4"
                    ).pk,
                    post_1_duplicated_comment.pk,
                ],
            ),
        )

        # Post #2 notifications
        factory_notification(
            recipient=user1,
            notification_type="post_new_comments",
            params=NotificationNewComments.ParamsType(
                post=NotificationPostParams.from_post(post_2),
                new_comments_count=0,
                new_comment_ids=[
                    factory_comment(
                        author=user2, on_post=post_1, text_en="Comment 2.1"
                    ).pk,
                    factory_comment(
                        author=user2, on_post=post_1, text_en="Comment 2.2"
                    ).pk,
                ],
            ),
        )

        context = NotificationNewComments.get_email_context_group(
            Notification.objects.filter(recipient=user1, type="post_new_comments")
        )
        context_notifs = context["notifications"]

        assert len(context_notifs) == 2
        assert context_notifs[0]["post"]["post_id"] == post_1.pk
        assert len(context_notifs[0]["comments"]) == 5
        assert context_notifs[0]
        # Check mentions go first
        assert "@user1" in context_notifs[0]["comments"][2]["preview_text"]

        assert context_notifs[1]["post"]["post_id"] == post_2.pk
        assert len(context_notifs[1]["comments"]) == 2


class TestNotificationCPChange:
    def test_get_email_context_group__deduplication(self, user1, user2, mocker):
        mocker.patch("utils.email.send_email_async")
        fn = mocker.patch("posts.services.feed.get_similar_posts_for_posts")
        fn.return_value = []
        post_1 = factory_post(author=user1)
        post_2 = factory_post(author=user1)

        # Post 1 duplicated notifications
        factory_notification(
            recipient=user1,
            notification_type="post_cp_change",
            params=NotificationPostCPChange.ParamsType(
                post=NotificationPostParams.from_post(post_1),
                question_data=[
                    CPChangeData(
                        question=NotificationQuestionParams(
                            id=1,
                            type="binary",
                            title="Question Title",
                            post_id=1,
                            post_title="Question Title",
                        ),
                        cp_median=0.5,
                        cp_change_label="goneUp",
                        cp_change_value=0.3,
                    )
                ],
                last_sent="SOME TIME AGO",
            ),
        )
        factory_notification(
            recipient=user1,
            notification_type="post_cp_change",
            params=NotificationPostCPChange.ParamsType(
                post=NotificationPostParams.from_post(post_1),
                question_data=[
                    CPChangeData(
                        question=NotificationQuestionParams(
                            id=1,
                            type="binary",
                            title="Question Title",
                            post_id=1,
                            post_title="Question Title",
                        ),
                        cp_median=0.5,
                        cp_change_label="goneUp",
                        cp_change_value=0.25,
                    )
                ],
                last_sent="SOME TIME AGO",
            ),
        )

        # Post 2
        factory_notification(
            recipient=user1,
            notification_type="post_cp_change",
            params=NotificationPostCPChange.ParamsType(
                post=NotificationPostParams.from_post(post_2),
                question_data=[
                    CPChangeData(
                        question=NotificationQuestionParams(
                            id=1,
                            type="binary",
                            title="Question Title",
                            post_id=1,
                            post_title="Question Title",
                        ),
                        cp_median=0.5,
                        cp_change_label="goneUp",
                        cp_change_value=0.7,
                    )
                ],
                last_sent="SOME TIME AGO",
            ),
        )

        context = NotificationPostCPChange.get_email_context_group(
            Notification.objects.filter(recipient=user1, type="post_cp_change")
        )
        context_notifs = context["params"]

        assert len(context_notifs) == 2
        assert context_notifs[0].post.post_id == post_2.pk
        assert context_notifs[0].question_data[0].cp_change_value == 0.7

        assert context_notifs[1].post.post_id == post_1.pk
        assert context_notifs[1].question_data[0].cp_change_value == 0.25


class TestNotificationPostStatusChange:
    def test_group_post_subquestions(self):
        cls = NotificationPostStatusChange.ParamsType

        params = [
            # Duplicate events
            cls(
                post=NotificationPostParams(
                    post_id=1, post_title="Post", post_type="question"
                ),
                event=Post.PostStatusChange.OPEN,
            ),
            cls(
                post=NotificationPostParams(
                    post_id=1, post_title="Post", post_type="question"
                ),
                event=Post.PostStatusChange.OPEN,
                project=NotificationProjectParams(id=1, name="Project", slug="project"),
            ),
            # Different project events
            cls(
                post=NotificationPostParams(
                    post_id=2, post_title="Post", post_type="question"
                ),
                event=Post.PostStatusChange.OPEN,
                project=NotificationProjectParams(id=2, name="Project", slug="project"),
            ),
            cls(
                post=NotificationPostParams(
                    post_id=3, post_title="Post", post_type="question"
                ),
                event=Post.PostStatusChange.OPEN,
                project=NotificationProjectParams(id=3, name="Project", slug="project"),
            ),
            cls(
                post=NotificationPostParams(
                    post_id=301, post_title="Post", post_type="question"
                ),
                event=Post.PostStatusChange.OPEN,
                project=NotificationProjectParams(id=3, name="Project", slug="project"),
            ),
            cls(
                post=NotificationPostParams(
                    post_id=3, post_title="Post", post_type="question"
                ),
                event=Post.PostStatusChange.OPEN,
                project=NotificationProjectParams(id=3, name="Project", slug="project"),
            ),
            # Same post, different events
            cls(
                post=NotificationPostParams(
                    post_id=4, post_title="Post", post_type="question"
                ),
                event=Post.PostStatusChange.OPEN,
            ),
            cls(
                post=NotificationPostParams(
                    post_id=4, post_title="Post", post_type="question"
                ),
                event=Post.PostStatusChange.CLOSED,
            ),
            # Same post, same subquestions, different events
            cls(
                post=NotificationPostParams(
                    post_id=5, post_title="Post", post_type="question"
                ),
                question=NotificationQuestionParams(
                    id=1,
                    title="",
                    label="First",
                    type="binary",
                    post_id=1,
                    post_title="Question Title",
                ),
                event=Post.PostStatusChange.OPEN,
            ),
            cls(
                post=NotificationPostParams(
                    post_id=5, post_title="Post", post_type="question"
                ),
                question=NotificationQuestionParams(
                    id=1,
                    title="",
                    label="First",
                    type="binary",
                    post_id=1,
                    post_title="Question Title",
                ),
                event=Post.PostStatusChange.CLOSED,
            ),
            # Same post, different subquestions, same events
            cls(
                post=NotificationPostParams(
                    post_id=6, post_title="Post", post_type="question"
                ),
                question=NotificationQuestionParams(
                    id=1,
                    title="",
                    label="First",
                    type="binary",
                    post_id=1,
                    post_title="Question Title",
                ),
                event=Post.PostStatusChange.OPEN,
            ),
            cls(
                post=NotificationPostParams(
                    post_id=6, post_title="Post", post_type="question"
                ),
                question=NotificationQuestionParams(
                    id=2,
                    title="",
                    label="Second",
                    type="binary",
                    post_id=1,
                    post_title="Question Title",
                ),
                event=Post.PostStatusChange.OPEN,
            ),
        ]

        result_params = NotificationPostStatusChange._generate_notification_params(
            params
        )

        # Test from_projects
        from_projects = result_params["from_projects"]

        assert len(from_projects) == 3

        assert from_projects[0]["project"].id == 1
        assert len(from_projects[0]["notifications"]) == 1
        assert from_projects[0]["notifications"][0].post.post_id == 1

        assert from_projects[1]["project"].id == 2
        assert len(from_projects[1]["notifications"]) == 1
        assert from_projects[1]["notifications"][0].post.post_id == 2

        assert from_projects[2]["project"].id == 3
        assert len(from_projects[2]["notifications"]) == 2
        assert from_projects[2]["notifications"][0].post.post_id == 3
        assert from_projects[2]["notifications"][1].post.post_id == 301

        # Test from_posts
        from_posts = result_params["from_posts"]

        assert len(from_posts) == 5

        assert from_posts[0].post.post_id == 4
        assert from_posts[1].post.post_id == 4
        assert from_posts[2].post.post_id == 5
        assert from_posts[2].question.id == 1
        assert from_posts[2].event == Post.PostStatusChange.OPEN
        assert from_posts[3].post.post_id == 5
        assert from_posts[3].question.id == 1
        assert from_posts[3].event == Post.PostStatusChange.CLOSED
        assert from_posts[4].post.post_id == 6
        assert from_posts[4].post.post_title == "Post: First, Second"


def test_delete_scheduled_question_resolution_notifications(
    user1, post_binary_public, post_numeric_public
):
    unrelated = NotificationPredictedQuestionResolved.schedule(
        user1,
        NotificationPredictedQuestionResolved.ParamsType(
            post=NotificationPostParams.from_post(post_numeric_public),
            question=NotificationQuestionParams.from_question(
                post_numeric_public.question
            ),
            resolution="100",
            forecasts_count=10,
            coverage=0.15,
        ),
    )
    params = NotificationPredictedQuestionResolved.ParamsType(
        post=NotificationPostParams.from_post(post_binary_public),
        question=NotificationQuestionParams.from_question(post_binary_public.question),
        resolution="yes",
        forecasts_count=150,
        coverage=0.75,
    )

    sent = NotificationPredictedQuestionResolved.schedule(user1, params)
    sent.mark_as_sent()
    sent.save()

    pending = NotificationPredictedQuestionResolved.schedule(user1, params)

    delete_scheduled_question_resolution_notifications(post_binary_public.question)

    assert not Notification.objects.filter(id=pending.id).exists()
    assert Notification.objects.filter(id=sent.id).exists()
    assert Notification.objects.filter(id=unrelated.id).exists()

    delete_scheduled_question_resolution_notifications(post_numeric_public.question)
    assert not Notification.objects.filter(id=unrelated.id).exists()
