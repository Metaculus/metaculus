from django.db import transaction

from coherence.models import (
    CoherenceLink,
    AggregateCoherenceLink,
    Direction,
    Strength,
    LinkType,
)
from questions.models import Question
from users.models import User


def create_coherence_link(
    *,
    user: User = None,
    question1: Question = None,
    question2: Question = None,
    direction: Direction = None,
    strength: Strength = None,
    link_type: LinkType = None,
):

    with transaction.atomic():
        obj = CoherenceLink(
            user=user,
            question1=question1,
            question2=question2,
            direction=direction,
            strength=strength,
            type=link_type,
        )

        # Save project and validate
        obj.full_clean()
        obj.save()
        create_aggregate_coherence_link(
            question1=question1, question2=question2, link_type=link_type
        )

    return obj


def create_aggregate_coherence_link(
    *,
    question1: Question = None,
    question2: Question = None,
    link_type: LinkType = None,
):
    with transaction.atomic():
        obj, created = AggregateCoherenceLink.objects.get_or_create(
            question1=question1,
            question2=question2,
            type=link_type,
        )

        if created:
            obj.full_clean()
            obj.save()

    return obj
