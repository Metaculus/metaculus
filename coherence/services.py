from django.db import transaction

from coherence.models import Strength, Direction, LinkType, CoherenceLink
from users.models import User


def create_coherence_link(
    *,
    user: User = None,
    question1: dict = None,
    question2: dict = None,
    direction: list[Direction] = None,
    strength: list[Strength] = None,
    type: list[LinkType] = None,
):

    with transaction.atomic():
        obj = CoherenceLink(
            user=user,
            question1=question1,
            question2=question2,
            direction=direction,
            strength=strength,
            type=type,
        )

        # Save project and validate
        obj.full_clean()
        obj.save()

    return obj
