import pytest

from comments.models import (
    Comment,
    KeyFactor,
    KeyFactorBaseRate,
    KeyFactorDriver,
    KeyFactorNews,
)
from comments.services.key_factors.common import delete_key_factor
from tests.unit.test_comments.factories import factory_comment, factory_key_factor
from tests.unit.test_posts.factories import factory_post


@pytest.fixture
def comment(user1) -> Comment:
    return factory_comment(
        author=user1, on_post=factory_post(author=user1), text="Comment"
    )


def create_key_factors(comment: Comment) -> list:
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

    factory_key_factor(comment=comment, driver=driver)
    factory_key_factor(comment=comment, base_rate=base_rate)
    factory_key_factor(comment=comment, news=news)

    return [driver, base_rate, news]


def remaining(content: list) -> list:
    return [obj for obj in content if type(obj).objects.filter(pk=obj.pk).exists()]


def test_delete_key_factor_deletes_its_content(comment):
    content = create_key_factors(comment)

    for key_factor in KeyFactor.objects.filter(comment=comment):
        delete_key_factor(key_factor)

    assert remaining(content) == []


def test_deleting_the_comment_deletes_key_factor_content(comment):
    content = create_key_factors(comment)

    comment.delete()

    assert remaining(content) == []


def test_queryset_delete_deletes_key_factor_content(comment):
    content = create_key_factors(comment)

    KeyFactor.objects.filter(comment=comment).delete()

    assert remaining(content) == []


def test_deleting_a_key_factor_loaded_without_its_links(comment):
    content = create_key_factors(comment)

    for pk in KeyFactor.objects.filter(comment=comment).values_list("pk", flat=True):
        KeyFactor.objects.only("id").get(pk=pk).delete()

    assert not KeyFactor.objects.filter(comment=comment).exists()
    assert remaining(content) == []


def test_keeps_content_of_other_key_factors(comment, user1):
    other_comment = factory_comment(
        author=user1, on_post=comment.on_post, text="Other comment"
    )
    kept = create_key_factors(other_comment)
    create_key_factors(comment)

    KeyFactor.objects.filter(comment=comment).delete()

    assert remaining(kept) == kept
