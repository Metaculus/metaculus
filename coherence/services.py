from django.db import transaction

from coherence.models import CoherenceLink
from users.models import User


def create_coherence_link(
    *,
    user: User = None,
    question1: dict = None,
    question2: dict = None,
    direction: list[CoherenceLink.Direction] = None,
    strength: list[CoherenceLink.Strength] = None,
    type: list[CoherenceLink.LinkType] = None,
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
