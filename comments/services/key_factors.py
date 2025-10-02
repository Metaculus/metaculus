from typing import Iterable

from django.db import transaction
from rest_framework.exceptions import ValidationError

from comments.models import KeyFactor, KeyFactorVote, Comment, KeyFactorDriver
from posts.models import Post
from users.models import User
from utils.dtypes import generate_map_from_list
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
    key_factor.votes_score = calculate_votes_strength(
        list(key_factor.votes.values_list("score", flat=True))
    )
    key_factor.save(update_fields=["votes_score"])

    return key_factor.votes_score


def get_user_votes_for_key_factors(
    key_factors: Iterable[KeyFactor], user: User
) -> dict[int, list[KeyFactor]]:
    """
    Generates map of user votes for a set of KeyFactors
    """

    votes = KeyFactorVote.objects.filter(key_factor__in=key_factors, user=user)

    return generate_map_from_list(list(votes), key=lambda vote: vote.key_factor_id)


@transaction.atomic
def create_key_factors(comment: Comment, key_factors: list[str]):
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

    for key_factor in key_factors:
        driver = KeyFactorDriver.objects.create(text=key_factor)
        KeyFactor.objects.create(comment=comment, driver=driver)


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


def calculate_votes_strength(scores: list[int]):
    """
    Calculates overall strengths of the KeyFactor
    """

    return (sum(scores) + max(0, 3 - len(scores))) / max(3, len(scores))
