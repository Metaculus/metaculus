from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import Subquery, OuterRef
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


class AggregateCoherenceLinkQuerySet(models.QuerySet):
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

    objects = AggregateCoherenceLinkQuerySet.as_manager()

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


# ---------------------------------------------------------------------------
# AI-suggested coherence links.
#
# One row per eligible target question, updated in place by two writers —
# the paid LLM pipeline and the daily free-vote refresh — so the table never
# grows over time and needs no cleanup. If a method is retired its name may
# linger in the JSON until the target's next refresh, but the read aggregator
# ignores any method not in Method.ALL, so retired names have no effect.
# ---------------------------------------------------------------------------


class CoherenceLinkSuggestion(TimeStampedModel):
    """
    All AI-suggested links for one target question, plus metadata about the
    last paid (LLM) run that produced them.
    """

    class Method:
        """The voting methods. Suggestions are ranked by how many voted."""

        # Paid methods: one LLM call each, run by the daily scheduler on
        # stale targets until the budget runs out.
        LLM_BROAD = "llm_broad"  # full pool, high recall
        LLM_STRICT = "llm_strict"  # full pool, genuine causal influence only
        LLM_SIMILAR_ONLY = "llm_similar_only"  # strict, over an embedding shortlist
        # Free methods: cheap queries, refreshed daily for every target.
        SIMILAR = "similar"  # in the Similar Questions list
        COMMUNITY_LINK = "community_link"  # an AggregateCoherenceLink exists

        PAID = frozenset({LLM_BROAD, LLM_STRICT, LLM_SIMILAR_ONLY})
        FREE = frozenset({SIMILAR, COMMUNITY_LINK})
        ALL = PAID | FREE

    class PaidRunStatus(models.TextChoices):
        PENDING = "pending"
        DONE = "done"
        ERROR = "error"

    target_question = models.OneToOneField(
        Question, models.CASCADE, related_name="ai_suggestions"
    )

    # Vote storage. {"<candidate_question_id>": ["method_name", ...]}
    # Keys are strings so the JSON round-trips cleanly.
    methods_by_candidate = models.JSONField(default=dict, blank=True)

    # ---- Last paid-run state (overwritten in place; no history) ----
    # Empty string = the paid pipeline has never run for this target.
    paid_run_status = models.CharField(
        max_length=16, blank=True, default="", choices=PaidRunStatus.choices
    )
    paid_run_started_at = models.DateTimeField(null=True, blank=True)
    # Incremented via F() after each method completes, so a crashed worker
    # mid-run still leaves accurate spend on record.
    paid_run_cost_usd = models.DecimalField(max_digits=10, decimal_places=6, default=0)
    paid_run_methods_attempted = ArrayField(
        models.CharField(max_length=32), default=list, blank=True
    )
    paid_run_methods_succeeded = ArrayField(
        models.CharField(max_length=32), default=list, blank=True
    )
    paid_run_pool_hash = models.CharField(max_length=64, blank=True, default="")
    paid_run_pool_size = models.PositiveIntegerField(null=True, blank=True)
    paid_run_elapsed_s = models.PositiveIntegerField(null=True, blank=True)
    paid_run_error_message = models.TextField(blank=True, default="")

    # ---- Free-vote refresh marker ----
    free_refreshed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            # Budget query: sum cost where started_at >= today's start
            models.Index(
                fields=["paid_run_started_at"], name="clsugg_paid_started_idx"
            ),
        ]

    def replace_votes(self, methods: frozenset, new_votes: dict) -> None:
        """
        Replace this row's entries for the given method group (Method.PAID or
        Method.FREE), preserving the other group's entries untouched.

        `new_votes` maps candidate question id -> iterable of method names;
        names outside `methods` are ignored, as are self-votes. Both writers
        go through here so neither can clobber the other's votes.
        """
        merged: dict[str, list[str]] = {}
        for cid_str, names in (self.methods_by_candidate or {}).items():
            kept = [m for m in names if m not in methods]
            if kept:
                merged[cid_str] = kept

        for cid, names in new_votes.items():
            if cid == self.target_question_id:
                continue
            entry = merged.setdefault(str(cid), [])
            for m in names:
                if m in methods and m not in entry:
                    entry.append(m)

        self.methods_by_candidate = merged
