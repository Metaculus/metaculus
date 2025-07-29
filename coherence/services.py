from django.db import transaction

from coherence.models import CoherenceLink
from questions.models import Question
from users.models import User


def create_coherence_link(
    *,
    user: User = None,
    question1: Question = None,
    question2: Question = None,
    direction: CoherenceLink.Direction = None,
    strength: CoherenceLink.Strength = None,
    link_type: CoherenceLink.LinkType = None,
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

    return obj
