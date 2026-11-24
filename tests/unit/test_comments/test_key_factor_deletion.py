import pytest
from django.urls import reverse

from comments.models import (
    Comment,
    KeyFactor,
    KeyFactorBaseRate,
    KeyFactorDriver,
    KeyFactorNews,
)
from comments.services.key_factors.common import delete_key_factor
from comments.services.key_factors.deletion import delete_key_factors
from posts.models import Post
from questions.models import Question
from questions.services.common import update_group_of_questions
from tests.unit.test_comments.factories import factory_comment, factory_key_factor
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import (
    create_question,
    factory_group_of_questions,
)
from tests.unit.test_users.factories import factory_user
from users.services.common import clean_user_data_delete


@pytest.fixture
def comment(user1) -> Comment:
    return factory_comment(
        author=user1, on_post=factory_post(author=user1), text="Comment"
    )


def create_key_factors(comment: Comment, **kwargs) -> list:
    """
    Creates one key factor of each type and returns their content rows.
    """

    driver = KeyFactorDriver.objects.create(text="Driver")
    base_rate = KeyFactorBaseRate.objects.create(
        type=KeyFactorBaseRate.BaseRateType.FREQUENCY,
        reference_class="Class",
        unit="%",
        source="Source",
    )
    news = KeyFactorNews.objects.create(
        url="https://example.com", title="News", source="Example"
    )

    factory_key_factor(comment=comment, driver=driver, **kwargs)
    factory_key_factor(comment=comment, base_rate=base_rate, **kwargs)
    factory_key_factor(comment=comment, news=news, **kwargs)

    return [driver, base_rate, news]


def remaining(content: list) -> list:
    return [obj for obj in content if type(obj).objects.filter(pk=obj.pk).exists()]


def test_delete_key_factor_deletes_its_content(comment):
    content = create_key_factors(comment)

    for key_factor in KeyFactor.objects.filter(comment=comment):
        delete_key_factor(key_factor)

    assert remaining(content) == []


def test_delete_key_factors_keeps_other_key_factors(comment, user1):
    other_comment = factory_comment(
        author=user1, on_post=comment.on_post, text="Other comment"
    )
    kept = create_key_factors(other_comment)
    deleted = create_key_factors(comment)

    delete_key_factors(KeyFactor.objects.filter(comment=comment))

    assert remaining(deleted) == []
    assert remaining(kept) == kept


def test_deleting_user_data_deletes_key_factor_content(user1, user2):
    # Private comment on someone else's post: the comment is deleted
    private_comment = factory_comment(
        author=user1,
        on_post=factory_post(author=user2),
        text="Private",
        is_private=True,
    )
    private_content = create_key_factors(private_comment)

    # Post with only the user's own comments: the whole post is deleted
    own_post = factory_post(author=user1)
    own_content = create_key_factors(
        factory_comment(author=user1, on_post=own_post, text="Own")
    )

    clean_user_data_delete(user1)

    assert not Post.objects.filter(pk=own_post.pk).exists()
    assert remaining(private_content) == []
    assert remaining(own_content) == []


def test_deleting_a_project_deletes_key_factor_content(user1, create_client_for_user):
    staff = factory_user(is_staff=True, is_superuser=True)
    project = factory_project()
    post = factory_post(author=user1, default_project=project)
    content = create_key_factors(
        factory_comment(author=user1, on_post=post, text="Comment")
    )

    response = create_client_for_user(staff).post(
        reverse("project-delete", kwargs={"project_id": project.pk})
    )

    assert response.status_code == 204
    assert remaining(content) == []


def test_removing_a_group_question_deletes_its_key_factor_content(comment):
    question = create_question(question_type=Question.QuestionType.BINARY)
    group = factory_group_of_questions(questions=[question])
    content = create_key_factors(comment, question=question)

    update_group_of_questions(group, delete=[question.pk])

    assert not Question.objects.filter(pk=question.pk).exists()
    assert remaining(content) == []
