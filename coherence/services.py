from django.db import transaction

from coherence.models import CoherenceLink
from users.models import User


def create_coherence_link(
    *,
    user: User = None,
    question1_id: int = None,
    question2_id: int = None,
    direction: CoherenceLink.Direction = None,
    strength: CoherenceLink.Strength = None,
    type: CoherenceLink.LinkType = None,
):

    with transaction.atomic():
        obj = CoherenceLink(
            user=user,
            question1_id=question1_id,
            question2_id=question2_id,
            direction=direction,
            strength=strength,
            type=type,
        )

        # Save project and validate
        obj.full_clean()
        obj.save()

    return obj
