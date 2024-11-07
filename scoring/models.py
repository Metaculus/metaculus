from datetime import datetime

from django.db import models
from django.db.models.query import QuerySet, Q

from projects.models import Project
from questions.models import Question
from questions.types import AggregationMethod
from users.models import User
from utils.models import TimeStampedModel


class UserWeight(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    calculated_on = models.DateTimeField(auto_now_add=True)
    weight = models.FloatField(default=1)


class Score(TimeStampedModel):
    # typing
    question_id: int
    objects: models.Manager["Score"]
    user_id: int | None

    user = models.ForeignKey(User, null=True, on_delete=models.CASCADE)
    aggregation_method = models.CharField(
        max_length=200, null=True, choices=AggregationMethod.choices
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="scores"
    )
    score = models.FloatField()
    coverage = models.FloatField(default=0)

    # NOTE: we need to use `edited_at` to store the time this is calculated
    # it effects reputation

    class ScoreTypes(models.TextChoices):
        RELATIVE_LEGACY = "relative_legacy"
        PEER = "peer"
        BASELINE = "baseline"
        SPOT_PEER = "spot_peer"
        SPOT_BASELINE = "spot_baseline"
        MANUAL = "manual"

    score_type = models.CharField(max_length=200, choices=ScoreTypes.choices)

    def __str__(self):
        return (
            f"{self.score_type} for "
            f"{self.user.username if self.user else self.aggregation_method} "
            f"on {self.question.id}"
        )


class ArchivedScore(TimeStampedModel):
    """This is a permanent copy of scores that can't be recalculated"""

    # typing
    question_id: int
    objects: models.Manager["Score"]
    user_id: int | None

    user = models.ForeignKey(User, null=True, on_delete=models.CASCADE)
    aggregation_method = models.CharField(
        max_length=200, null=True, choices=AggregationMethod.choices
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="archived_scores"
    )
    score = models.FloatField()
    coverage = models.FloatField(default=0)

    class ScoreTypes(models.TextChoices):
        RELATIVE_LEGACY = "relative_legacy"

    score_type = models.CharField(max_length=200, choices=ScoreTypes.choices)

    def __str__(self):
        return (
            f"Archived {self.score_type} for "
            f"{self.user.username if self.user else self.aggregation_method} "
            f"on {self.question.id}"
        )


class Leaderboard(TimeStampedModel):
    # typing
    id: int
    project_id: int
    objects: models.Manager["Leaderboard"]
    entries: QuerySet["LeaderboardEntry"]

    name = models.CharField(max_length=200, null=True, blank=True)
    project = models.ForeignKey(
        Project,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="leaderboards",
    )

    class ScoreTypes(models.TextChoices):
        RELATIVE_LEGACY_TOURNAMENT = "relative_legacy_tournament"
        PEER_GLOBAL = "peer_global"
        PEER_GLOBAL_LEGACY = "peer_global_legacy"
        PEER_TOURNAMENT = "peer_tournament"
        SPOT_PEER_TOURNAMENT = "spot_peer_tournament"
        BASELINE_GLOBAL = "baseline_global"
        COMMENT_INSIGHT = "comment_insight"
        QUESTION_WRITING = "question_writing"
        MANUAL = "manual"

        @classmethod
        def get_base_score(cls, score_type: str) -> Score.ScoreTypes:
            match score_type:
                case cls.RELATIVE_LEGACY_TOURNAMENT:
                    return Score.ScoreTypes.RELATIVE_LEGACY
                case cls.PEER_GLOBAL:
                    return Score.ScoreTypes.PEER
                case cls.PEER_GLOBAL_LEGACY:
                    return Score.ScoreTypes.PEER
                case cls.PEER_TOURNAMENT:
                    return Score.ScoreTypes.PEER
                case cls.SPOT_PEER_TOURNAMENT:
                    return Score.ScoreTypes.SPOT_PEER
                case cls.BASELINE_GLOBAL:
                    return Score.ScoreTypes.BASELINE
                case cls.MANUAL:
                    return Score.ScoreTypes.MANUAL
                case cls.COMMENT_INSIGHT:
                    raise ValueError(
                        "Comment insight leaderboards do not have base scores"
                    )
                case cls.QUESTION_WRITING:
                    raise ValueError(
                        "Question Writing leaderboards do not have base scores"
                    )

    score_type = models.CharField(max_length=200, choices=ScoreTypes.choices)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    finalize_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        if self.name:
            return f"Leaderboard {self.name}"
        return f"{self.score_type} Leaderboard for {self.project.name}"

    def get_questions(self) -> list[Question]:
        from posts.models import Post

        invalid_statuses = [
            Post.CurationStatus.DELETED,
            Post.CurationStatus.DRAFT,
            Post.CurationStatus.REJECTED,
        ]

        if self.project:
            questions = (
                Question.objects.filter(
                    Q(related_posts__post__projects=self.project)
                    | Q(related_posts__post__default_project=self.project)
                )
                .exclude(related_posts__post__curation_status__in=invalid_statuses)
                .distinct("pk")
            )
        else:
            questions = Question.objects.all().exclude(
                related_posts__post__curation_status__in=invalid_statuses
            )

        if self.score_type == self.ScoreTypes.COMMENT_INSIGHT:
            # post must be published
            return list(
                questions.filter(
                    related_posts__post__published_at__lt=self.end_time
                ).distinct("pk")
            )
        elif self.score_type == self.ScoreTypes.QUESTION_WRITING:
            # post must be published, and can't be resolved before the start_time
            # of the leaderboard

            return list(
                questions.filter(
                    Q(scheduled_close_time__gte=self.start_time)
                    & (
                        Q(actual_close_time__isnull=True)
                        | Q(actual_close_time__gte=self.start_time)
                    ),
                    related_posts__post__published_at__lt=self.end_time,
                )
                .exclude(related_posts__post__curation_status__in=invalid_statuses)
                .distinct("pk")
            )

        if self.start_time and self.end_time:
            # global leaderboard
            window = (self.start_time, self.end_time)
            questions = [
                q for q in questions if q.get_global_leaderboard_dates() == window
            ]

        return list(questions)


class LeaderboardEntry(TimeStampedModel):
    # typing
    id: int
    objects: models.Manager["LeaderboardEntry"]
    user_id: int | None

    user = models.ForeignKey(User, null=True, on_delete=models.CASCADE, blank=True)
    aggregation_method = models.CharField(
        max_length=200, null=True, choices=AggregationMethod.choices, blank=True
    )
    leaderboard = models.ForeignKey(
        Leaderboard, on_delete=models.CASCADE, related_name="entries", null=True
    )
    score = models.FloatField()
    take = models.FloatField(null=True, blank=True)
    rank = models.IntegerField(null=True, blank=True)
    excluded = models.BooleanField(default=False)

    class Medals(models.TextChoices):
        GOLD = "gold"
        SILVER = "silver"
        BRONZE = "bronze"

    medal = models.CharField(
        max_length=200, null=True, blank=True, choices=Medals.choices
    )
    percent_prize = models.FloatField(null=True, blank=True)
    prize = models.FloatField(null=True, blank=True)
    coverage = models.FloatField(null=True, blank=True)
    contribution_count = models.IntegerField(default=0)
    calculated_on = models.DateTimeField(auto_now=True)

    def __str__(self):
        return (
            "LeaderboardEntry for "
            f"{self.user.username if self.user else self.aggregation_method}"
        )


class MedalExclusionRecord(models.Model):
    id: int
    objects: models.Manager["MedalExclusionRecord"]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)

    class ExclusionTypes(models.TextChoices):
        STAFF = "staff"
        PROJECT_OWNER = "project_owner"

    exclusion_type = models.CharField(max_length=200, choices=ExclusionTypes.choices)
    project = models.ForeignKey(
        Project, on_delete=models.SET_NULL, null=True, blank=True
    )

    def __str__(self) -> str:
        return (
            f"<MedalExclusionRecord for {self.user.username}, "
            f"Start:{self.start_time}, End:{self.end_time or 'None'}>"
        )


def global_leaderboard_dates() -> list[tuple[datetime, datetime]]:
    # Returns the start and end dates for each global leaderboard
    # reads directly from the set of global leaderboards
    leaderboards = Leaderboard.objects.filter(
        start_time__isnull=False, end_time__isnull=False
    )
    intervals = [(lb.start_time, lb.end_time) for lb in leaderboards]
    intervals.sort(key=lambda x: (x[1] - x[0], x[0]))
    return intervals
