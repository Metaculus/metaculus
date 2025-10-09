from django.db import models
from django.db.models.functions import Least, Greatest

from questions.models import Question
from users.models import User
from utils.models import TimeStampedModel


class LinkType(models.TextChoices):
    CAUSAL = "causal"


class CoherenceLink(TimeStampedModel):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, models.CASCADE, related_name="coherence_links")
    question1 = models.ForeignKey(
        Question, models.CASCADE, related_name="coherence_links_as_q1"
    )
    question2 = models.ForeignKey(
        Question, models.CASCADE, related_name="coherence_links_as_q2"
    )
    direction = models.IntegerField(default=0, editable=False)
    strength = models.IntegerField(default=0, editable=False)
    type = models.CharField(max_length=16, choices=LinkType.choices)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                models.F("user"),
                Least("question1", "question2"),
                Greatest("question1", "question2"),
                name="unique_user_question_pair",
            ),
            models.CheckConstraint(
                check=~models.Q(question1=models.F("question2")),
                name="different_questions",
            ),
        ]


class AggregateCoherenceLink(TimeStampedModel):
    question1 = models.ForeignKey(
        Question, models.CASCADE, related_name="aggregate_coherence_links_as_q1"
    )
    question2 = models.ForeignKey(
        Question, models.CASCADE, related_name="aggregate_coherence_links_as_q2"
    )
    type = models.CharField(max_length=16, choices=LinkType.choices)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["question1", "question2"],
                name="aggregate_unique_question_pair",
            ),
            models.CheckConstraint(
                check=~models.Q(question1=models.F("question2")),
                name="aggregate_different_questions",
            ),
        ]
