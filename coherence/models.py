from collections.abc import Iterable

from django.db import models
from django.db.models import Q, Subquery, OuterRef
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


class AggregateCoherenceLinkManager(models.QuerySet):
    def annotate_user_vote(self, user: User):
        """
        Annotates queryset with the user's vote option
        """

        return self.annotate(
            user_vote=Subquery(
                AggregateCoherenceLinkVote.objects.filter(
                    user=user, aggregation=OuterRef("pk")
                ).values("score")[:1]
            ),
        )

    def filter_permission(self, user: User = None):
        """
        Filters links where both linked questions are visible to the given user.
        """

        from posts.models import Post

        if not user or not user.is_authenticated:
            user = None

        visible_posts = Post.objects.filter_permission(user=user).values("id")
        return self.filter(
            question1__post_id__in=visible_posts,
            question2__post_id__in=visible_posts,
        )


class AggregateCoherenceLink(TimeStampedModel):
    question1 = models.ForeignKey(
        Question, models.CASCADE, related_name="aggregate_coherence_links_as_q1"
    )
    question2 = models.ForeignKey(
        Question, models.CASCADE, related_name="aggregate_coherence_links_as_q2"
    )
    type = models.CharField(max_length=16, choices=LinkType.choices)

    # Annotated fields
    user_vote: int = None

    objects = AggregateCoherenceLinkManager.as_manager()

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


class AggregateCoherenceLinkVote(TimeStampedModel):
    class VoteDirection(models.IntegerChoices):
        UP = 1
        DOWN = -1

    user = models.ForeignKey(User, models.CASCADE)
    aggregation = models.ForeignKey(
        AggregateCoherenceLink, models.CASCADE, related_name="votes"
    )
    score = models.SmallIntegerField(choices=VoteDirection.choices)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                name="uq_aggregate_coherence_link_votes_unique_user",
                fields=["user_id", "aggregation_id"],
            ),
        ]
