from collections import defaultdict
from typing import Iterable

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404

from comments.models import (
    KeyFactor,
    KeyFactorVote,
    Comment,
    KeyFactorDriver,
    ImpactDirection,
    KeyFactorBaseRate,
    KeyFactorNews,
)
from misc.models import ITNArticle
from posts.services.common import get_post_permission_for_user
from projects.permissions import ObjectPermission
from questions.models import Question
from users.models import User
from utils.datetime import timedelta_to_days


@transaction.atomic
def key_factor_vote(
    key_factor: KeyFactor,
    user: User,
    vote: int = None,
    vote_type: KeyFactorVote.VoteType = None,
) -> float:
    # Deleting existing vote for this vote type
    key_factor.votes.filter(user=user, vote_type=vote_type).delete()

    if vote is not None:
        key_factor.votes.create(user=user, score=vote, vote_type=vote_type)

    # Update counters
    # For now, we generate `strength` for all key factor types.
    # This is mainly for simplicity — only Drivers and News actually use `strength`,
    # while BaseRate doesn't require vote score calculations.
    # So it’s easier and more consistent to apply the same logic across all key factors, even if some don’t use it.
    key_factor.votes_score = calculate_votes_strength(
        list(key_factor.votes.values_list("score", flat=True))
    )
    key_factor.save(update_fields=["votes_score"])

    return key_factor.votes_score


def get_votes_for_key_factors(
    key_factors: Iterable[KeyFactor],
) -> dict[int, list[KeyFactorVote]]:
    """
    Generates map of user votes for a set of KeyFactors
    """

    votes = KeyFactorVote.objects.filter(key_factor__in=key_factors)
    votes_map = defaultdict(list)

    for vote in votes:
        votes_map[vote.key_factor_id].append(vote)

    return votes_map


@transaction.atomic
def create_key_factors(comment: Comment, key_factors: list[dict]):
    # Limit total key-factors for one user per comment
    if comment.key_factors.filter_active().count() + len(key_factors) > 4:
        raise ValidationError(
            "Exceeded the maximum limit of 4 key factors allowed per comment"
        )

    # Limit total key-factors amount for one user per post
    if (
        KeyFactor.objects.for_posts(posts=[comment.on_post])
        .filter_active()
        .filter(comment__author=comment.author)
        .count()
        + len(key_factors)
        > 6
    ):
        raise ValidationError(
            "Exceeded the maximum limit of 6 key factors allowed per question"
        )

    for key_factor_data in key_factors:
        create_key_factor(
            user=comment.author,
            comment=comment,
            **key_factor_data,
        )


@transaction.atomic
def create_key_factor(
    *,
    user: User = None,
    comment: Comment = None,
    question_id: int = None,
    question_option: str = None,
    driver: dict = None,
    base_rate: dict = None,
    news: dict = None,
    **kwargs,
) -> KeyFactor:
    question = None

    # Validate question
    if question_id:
        question = get_object_or_404(Question, pk=question_id)

        # Check permissions
        permission = get_post_permission_for_user(question.get_post(), user=user)
        ObjectPermission.can_view(permission, raise_exception=True)

    if question_option:
        if not question:
            raise ValidationError(
                {"question_option": "Question ID is required for options"}
            )

        if question.type != Question.QuestionType.MULTIPLE_CHOICE:
            raise ValidationError(
                {"question_option": "Should be a multiple-choice question"}
            )

        if question_option not in question.options:
            raise ValidationError(
                {"question_option": "Question option must be one of the options"}
            )

    obj = KeyFactor(
        comment=comment,
        question_id=question_id,
        question_option=question_option or "",
        # Initial strength will be always 2
        votes_score=2,
        **kwargs,
    )

    # Adding types
    if driver:
        obj.driver = create_key_factor_driver(**driver)
    elif base_rate:
        obj.base_rate = create_key_factor_base_rate(**base_rate)
    elif news:
        obj.news = create_key_factor_news(**news)
    else:
        raise ValidationError("Wrong Key Factor Type")

    # Save object and validate
    obj.full_clean()
    obj.save()

    return obj


def create_key_factor_driver(
    *,
    text: str = None,
    impact_direction: ImpactDirection = None,
    certainty: int = None,
    **kwargs,
) -> KeyFactorDriver:
    obj = KeyFactorDriver(
        text=text, impact_direction=impact_direction, certainty=certainty, **kwargs
    )
    obj.full_clean()
    obj.save()

    return obj


def create_key_factor_base_rate(*, type: str = None, **kwargs) -> KeyFactorBaseRate:
    """
    Creates a KeyFactorBaseRate object based on type.

    For FREQUENCY type:
        - reference_class, rate_numerator, rate_denominator, unit, source are required

    For TREND type:
        - reference_class, projected_value, projected_by_year, unit, extrapolation, source are required
        - based_on is optional
    """

    obj = KeyFactorBaseRate(
        type=type,
        **kwargs,
    )
    obj.full_clean()
    obj.save()

    return obj


def create_key_factor_news(
    *,
    itn_article_id: int = None,
    url: str = None,
    title: str = None,
    img_url: str = None,
    source: str = None,
    published_at=None,
    **kwargs,
) -> KeyFactorNews:
    """
    Creates a KeyFactorNews object.

    If itn_article_id is provided:
        - Will populate url, title, img_url from the ITN Article if not explicitly provided

    Otherwise:
        - Requires url, title, source
    """

    if itn_article_id:
        itn_article: ITNArticle = get_object_or_404(ITNArticle, pk=itn_article_id)

        # Populate from ITN article
        url = itn_article.url
        title = itn_article.title
        img_url = itn_article.img_url
        source = itn_article.media_label or itn_article.media_name
        published_at = itn_article.created_at

    obj = KeyFactorNews(
        itn_article_id=itn_article_id,
        url=url,
        title=title,
        img_url=img_url or "",
        source=source,
        published_at=published_at or timezone.now(),
        **kwargs,
    )
    obj.full_clean()
    obj.save()

    return obj


def calculate_votes_strength(scores: list[int]):
    """
    Calculates overall strengths of the KeyFactor
    """

    return (sum(scores) + 2 * max(0, 3 - len(scores))) / max(3, len(scores))


def delete_key_factor(key_factor: KeyFactor):
    # TODO: should it delete a comment if that comment was automatically created?

    key_factor.delete()


def get_key_factor_question_lifetime(key_factor: KeyFactor) -> float:
    post = key_factor.comment.on_post
    question = key_factor.question

    open_time = post.open_time

    if question:
        open_time = question.open_time

    if not open_time:
        return 0.0

    lifetime = timedelta_to_days(timezone.now() - open_time)

    return lifetime if lifetime > 0 else 0.0


def calculate_freshness_votes_decay(
    key_factor: KeyFactor, votes: list[KeyFactorVote], lifetime_denominator: int
) -> float:
    now = timezone.now()
    lifetime = get_key_factor_question_lifetime(key_factor)

    weights_sum = 0
    strengths_sum = 0

    for vote in votes:
        weight = 2 ** (
            -timedelta_to_days(now - vote.created_at)
            / max(lifetime / lifetime_denominator, 14)
        )
        weights_sum += weight
        strengths_sum += vote.score * weight

    return (strengths_sum + 2 * max(3 - weights_sum, 0)) / max(weights_sum, 3)


def calculate_freshness_base_rate(
    key_factor: KeyFactor, votes: list[KeyFactorVote]
) -> float:
    """
    Calculates freshness for BaseRate KeyFactors.
    BaseRate freshness doesn't decay over time, it's just the average of votes.
    """
    if not votes:
        return 0.0

    avg = sum(v.score for v in votes) / len(votes)

    return max(0.0, avg)


def calculate_freshness(key_factor: KeyFactor, votes: list[KeyFactorVote]) -> float:
    if key_factor.driver_id:
        return calculate_freshness_votes_decay(key_factor, votes, 5)
    elif key_factor.news_id:
        return calculate_freshness_votes_decay(key_factor, votes, 10)
    elif key_factor.base_rate_id:
        return calculate_freshness_base_rate(key_factor, votes)

    raise ValidationError("Key Factor does not support freshness calculation")


def calculate_key_factors_freshness(
    key_factors: Iterable[KeyFactor], votes_map: dict[int, list[KeyFactorVote]]
) -> dict[KeyFactor, float]:
    """
    Generates freshness of KeyFactors
    """

    return {
        kf: calculate_freshness(kf, votes_map.get(kf.id) or []) for kf in key_factors
    }


def get_key_factor_vote_type_and_choices(key_factor: KeyFactor) -> tuple[str, list]:
    """
    Determines vote type and available choices based on KeyFactor type.
    Returns (vote_type, vote_choices) tuple.

    - Driver: vote_type=STRENGTH, choices=VoteStrength
    - BaseRate: vote_type=DIRECTION, choices=VoteDirection
    - News: vote_type=STRENGTH, choices=VoteStrength
    """
    if key_factor.driver_id or key_factor.news_id:
        return KeyFactorVote.VoteType.STRENGTH, KeyFactorVote.VoteStrength.choices
    elif key_factor.base_rate_id:
        return KeyFactorVote.VoteType.DIRECTION, KeyFactorVote.VoteDirection.choices
    else:
        raise ValidationError(
            "KeyFactor has no valid type (driver, base_rate, or news)"
        )
