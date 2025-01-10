from datetime import datetime, timedelta

from django.db import models
from django.db.models.query import QuerySet, Q

from projects.models import Project
from questions.models import Question
from questions.types import AggregationMethod
from users.models import User
from utils.models import TimeStampedModel

GLOBAL_LEADERBOARD_STRING = "Leaderboard"
GLOBAL_LEADERBOARD_SLUG = "leaderboard"


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
        max_length=200, null=True, choices=AggregationMethod.choices, db_index=True
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

    class Meta:
        indexes = [
            models.Index(
                fields=["question"],
                name="score_question_idx",
                condition=Q(aggregation_method__isnull=False),
            ),
            models.Index(fields=["user", "question"]),
        ]


class ArchivedScore(TimeStampedModel):
    """This is a permanent copy of scores that can't be recalculated"""

    # typing
    question_id: int
    objects: models.Manager["ArchivedScore"]
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

    class Meta:
        indexes = [
            models.Index(
                fields=["question"],
                name="archivedscore_aggmethod_idx",
                condition=Q(aggregation_method__isnull=False),
            ),
            models.Index(fields=["user", "question"]),
        ]


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

    def get_questions(self) -> QuerySet[Question]:
        from posts.models import Post

        questions = Question.objects.filter(
            related_posts__post__curation_status=Post.CurationStatus.APPROVED
        )

        if self.project and self.project.type == Project.ProjectTypes.SITE_MAIN:
            # global leaderboard
            if self.start_time is None or self.end_time is None:
                raise ValueError("Global leaderboards must have start and end times")

            questions = questions.filter_public().filter(
                related_posts__post__in=Post.objects.filter_for_main_feed()
            )

            if self.score_type == self.ScoreTypes.COMMENT_INSIGHT:
                # post must be published
                return questions.filter(
                    related_posts__post__published_at__lt=self.end_time
                )
            elif self.score_type == self.ScoreTypes.QUESTION_WRITING:
                # post must be published, and can't be resolved before the start_time
                # of the leaderboard
                return questions.filter(
                    Q(scheduled_close_time__gte=self.start_time)
                    & (
                        Q(actual_close_time__isnull=True)
                        | Q(actual_close_time__gte=self.start_time)
                    ),
                    related_posts__post__published_at__lt=self.end_time,
                )

            close_grace_period = timedelta(days=3)
            resolve_grace_period = timedelta(days=100)

            questions = questions.filter(
                Q(actual_resolve_time__isnull=True)
                | Q(actual_resolve_time__lte=self.end_time + resolve_grace_period),
                open_time__gte=self.start_time,
                open_time__lt=self.end_time,
                scheduled_close_time__lte=self.end_time + close_grace_period,
            )

            gl_dates = global_leaderboard_dates()
            checked_intervals: list[tuple[datetime, datetime]] = []
            for start, end in gl_dates[::-1]:  # must be in reverse order, biggest first
                if (
                    (self.start_time, self.end_time) == (start, end)
                    or start < self.start_time
                    or self.end_time < end
                ):
                    continue
                to_add = True
                for checked_start, checked_end in checked_intervals:
                    if checked_start < start and end < checked_end:
                        to_add = False
                        break
                if to_add:
                    checked_intervals.append((start, end))
                    questions = questions.filter(
                        Q(open_time__lt=start)
                        | Q(scheduled_close_time__gt=end + close_grace_period)
                        | Q(actual_resolve_time__gt=end + resolve_grace_period)
                    )

            return questions

        if self.project:
            return questions.filter(
                Q(related_posts__post__projects=self.project)
                | Q(related_posts__post__default_project=self.project)
            )

        return questions


def name_and_slug_for_global_leaderboard_dates(
    gl_dates: tuple[datetime, datetime]
) -> tuple[str, str]:
    """
    Generates a tag name for a global leaderboard tag given the start and end dates
    """
    start_year = gl_dates[0].year
    end_year = gl_dates[1].year
    if end_year - start_year == 1:
        return (
            f"{start_year} {GLOBAL_LEADERBOARD_STRING}",
            f"{start_year}_{GLOBAL_LEADERBOARD_SLUG}",
        )
    return (
        f"{start_year}-{end_year - 1} {GLOBAL_LEADERBOARD_STRING}",
        f"{start_year}_{end_year - 1}_{GLOBAL_LEADERBOARD_SLUG}",
    )


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
