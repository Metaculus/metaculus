from collections import defaultdict
from typing import Iterable

from django.db import transaction
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404

from comments.models import (
    KeyFactor,
    KeyFactorVote,
    Comment,
    KeyFactorDriver,
    ImpactDirection,
)
from posts.models import Post
from posts.services.common import get_post_permission_for_user
from projects.permissions import ObjectPermission
from questions.models import Question
from users.models import User
from utils.openai import generate_keyfactors


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


def get_votes_for_key_factors(key_factors: Iterable[KeyFactor]) -> dict[int, list[int]]:
    """
    Generates map of user votes for a set of KeyFactors
    """

    votes = KeyFactorVote.objects.filter(key_factor__in=key_factors).only(
        "key_factor_id", "score"
    )
    votes_map = defaultdict(list)

    for vote in votes:
        votes_map[vote.key_factor_id].append(vote.score)

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


def generate_keyfactors_for_comment(
    comment_text: str, existing_keyfactors: list[str], post: Post
):
    if post.question is None and post.group_of_questions is None:
        raise ValidationError(
            "Key factors can only be generated for questions and question groups"
        )

    if post.question:
        question_data = (
            f"Title: {post.title}\n Description: {post.question.description}"
        )
    elif post.group_of_questions:
        question_data = (
            f"Title: {post.title}\n Description: {post.group_of_questions.description}"
        )

    return generate_keyfactors(
        question_data,
        comment_text,
        existing_keyfactors,
    )


@transaction.atomic
def create_key_factor(
    *,
    user: User = None,
    comment: Comment = None,
    question_id: int = None,
    question_option: str = None,
    driver: dict = None,
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
        **kwargs,
    )

    # Adding types
    if driver:
        obj.driver = create_key_factor_driver(**driver)
    else:
        raise ValidationError("Wrong Key Factor Type")

    # Save object and validate
    obj.full_clean()
    obj.save()

    return obj


def create_key_factor_driver(
    *, text: str = None, impact_direction: ImpactDirection = None, **kwargs
) -> KeyFactorDriver:
    obj = KeyFactorDriver(text=text, impact_direction=impact_direction, **kwargs)
    obj.full_clean()
    obj.save()

    return obj


def calculate_votes_strength(scores: list[int]):
    """
    Calculates overall strengths of the KeyFactor
    """

    return (sum(scores) + max(0, 3 - len(scores))) / max(3, len(scores))
