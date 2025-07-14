from django.db import models

from questions.models import Question
from utils.models import TimeStampedModel
from users.models import User

class Direction(models.TextChoices):
    POSITIVE = "p"
    NEGATIVE = "n"

class Strength(models.TextChoices):
    LOW = "l"
    MEDIUM = "m"
    HIGH = "h"

class CoherenceLink(TimeStampedModel):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, models.CASCADE, related_name="coherence_links")
    question1 = models.ForeignKey(Question, models.CASCADE, related_name="coherence_links_as_q1")
    question2 = models.ForeignKey(Question, models.CASCADE, related_name="coherence_links_as_q2")
    direction = models.CharField(max_length=16, choices=Direction.choices)
    strength = models.CharField(max_length=16, choices=Strength.choices)