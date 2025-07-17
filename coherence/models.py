from django.db import models
from django.db.models.functions import Least, Greatest

from questions.models import Question
from utils.models import TimeStampedModel
from users.models import User


class CoherenceLink(TimeStampedModel):
    class Direction(models.TextChoices):
        POSITIVE = "positive"
        NEGATIVE = "negative"

    class Strength(models.TextChoices):
        LOW = "low"
        MEDIUM = "medium"
        HIGH = "high"

    class LinkType(models.TextChoices):
        CAUSAL = "causal"

    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, models.CASCADE, related_name="coherence_links")
    question1 = models.ForeignKey(
        Question, models.CASCADE, related_name="coherence_links_as_q1"
    )
    question2 = models.ForeignKey(
        Question, models.CASCADE, related_name="coherence_links_as_q2"
    )
    direction = models.CharField(max_length=16, choices=Direction.choices)
    strength = models.CharField(max_length=16, choices=Strength.choices)
    type = models.CharField(max_length=16, choices=LinkType.choices)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                models.F("user"),
                Least("question1", "question2"),
                Greatest("question1", "question2"),
                name="unique_user_question_pair",
            )
        ]
