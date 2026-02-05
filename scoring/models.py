from datetime import datetime, timedelta

from django.db import models
from django.db.models.query import QuerySet, Q

from projects.models import Project
from questions.models import Question
from questions.types import AggregationMethod
from scoring.constants import ScoreTypes, ArchivedScoreTypes, LeaderboardScoreTypes
from users.models import User
from utils.models import TimeStampedModel

GLOBAL_LEADERBOARD_STRING = "Leaderboard"
GLOBAL_LEADERBOARD_SLUG = "leaderboard"


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

    score_type = models.CharField(
        max_length=200, choices=ScoreTypes.choices, db_index=True
    )

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
            models.Index(fields=["edited_at"], name="score_edited_at_idx"),
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

    score_type = models.CharField(max_length=200, choices=ArchivedScoreTypes.choices)

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
    display_config = models.JSONField(
        null=True,
        blank=True,
        help_text=(
            "Optional JSON configuration for displaying this leaderboard."
            "<br>If not set, default display settings will be used."
            "<br>Example display_config:"
            "<pre>{\n"
            '    "display_name": "My Custom Leaderboard",\n'
            '    "column_renames": {\n'
            '        "Questions": "Question Links"\n'
            "    },\n"
            '    "display_order": 1,\n'
            '    "display_on_project": true\n'
            "}</pre>"
        ),
    )

    score_type = models.CharField(
        max_length=200,
        choices=LeaderboardScoreTypes.choices,
        help_text="""
    <table>
        <tr><td>peer_tournament</td><td> Sum of peer scores. Most likely what you want.</td></tr>
        <tr><td>default</td><td> Sum of 'Default' scores as determined by each Question's 'default_score_type'</td></tr>
        <tr><td>spot_peer_tournament</td><td> Sum of spot peer scores.</td></tr>
        <tr><td>spot_baseline_tournament</td><td> Sum of spot baseline scores.</td></tr>
        <tr><td>relative_legacy</td><td> Old site scoring.</td></tr>
        <tr><td>baseline_global</td><td> Sum of baseline scores.
            <br> Normally only used for global leaderboards, but does work in tournaments.</td></tr>
        <tr><td>peer_global</td><td> Coverage-weighted average of peer scores.
            <br> Normally only used for global leaderboards. Doesn't work well in tournaments unless there are well over 50 questions.</td></tr>
        <tr><td>peer_global_legacy</td><td> Average of peer scores.
            <br> Only used for global leaderboards before 2024. This is not what you're looking for.</td></tr>
        <tr><td>comment_insight</td><td> H-index of upvotes for comments on questions.
            <br> Nromally used for global leaderboards, but can be used in tournaments.</td></tr>
        <tr><td>question_writing</td><td> H-index of number of forecasters / 10 on questions.
            <br> Normally used for global leaderboards, but can be used in tournaments.</td></tr>
        <tr><td>manual</td><td> Does not automatically update. Manually set all entries.</td></tr>
    </table>
    """,
    )
    start_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="""Optional (required for global leaderboards). If not set, the Project's open_date will be used instead.
        </br>- Global Leaderboards: filters for questions that have an open time after this. Automatically set, do not change.
        </br>- Non-Global Leaderboards: has no effect on question filtering.
        </br>- Filtering MedalExclusionRecords: MedalExclusionRecords that have no end_time or an end_time greater than this (and a start_time before this Leaderboard's end_time or finalize_time) will be triggered.
        """,
    )
    end_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="""Optional (required for global leaderboards).
        </br>- Global Leaderboards: filters for questions that have a scheduled_close_time before this (plus a grace period). Automatically set, do not change.
        </br>- Non-Global Leaderboards: has no effect on question filtering.
        </br>- Filtering MedalExclusionRecords: MedalExclusionRecords that have a start_time less than this (and no end_time or an end_time later that this Leaderboard's start_time) will be triggered. If not set, this Leaderboard's finalize_time will be used instead - it is recommended not to use this field unless required.
        """,
    )
    finalize_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="""Optional. If not set, the Project's close_date will be used instead.
        </br>- For all Leaderboards: used to filter out questions that have a resolution_set_time after this (as they were resolved after this Leaderboard was finalized).
        </br>- Filtering MedalExclusionRecords: If set and end_time is not set, MedalExclusionRecords that have a start_time less than this (and no end_time or an end_time later that this Leaderboard's start_time) will be triggered.
        """,
    )
    finalized = models.BooleanField(
        default=False,
        help_text="If true, this Leaderboard's entries cannot be updated except by a manual action in the admin panel. Automatically set to True the first time this leaderboard is updated after the finalize_time.",
    )
    prize_pool = models.DecimalField(
        default=None,
        decimal_places=2,
        max_digits=15,
        null=True,
        blank=True,
        help_text="""Optional. If not set, the Project's prize_pool will be used instead.
        </br>- If the Project has a prize pool, but this leaderboard has none, set this to 0.
        """,
    )
    minimum_prize_amount = models.DecimalField(
        default=50.00,
        decimal_places=2,
        max_digits=15,
        help_text="""The minimum amount a user can win in this leaderboard.
        Any remaining money is redistributed. Tournaments that close before June 2025 will have a value of 0.00.
        """,
    )
    bot_status = models.CharField(
        max_length=32,
        choices=Project.BotLeaderboardStatus.choices,
        null=True,
        blank=True,
        help_text="""Optional. If not set, the Project's bot_leaderboard_status will be
        used instead. See Project for more details.""",
    )
    user_list = models.ManyToManyField(
        User,
        blank=True,
        help_text="""Optional. If not set, all users with scores will be included.
        </br>- If set, only users in this list will be included.
        </br>- Exclusion Records still apply independent of this list.
        """,
    )

    def __str__(self):
        if self.name:
            return f"Leaderboard {self.name}"
        return f"{self.score_type} Leaderboard for {self.project.name}"

    def get_questions(self) -> QuerySet[Question]:
        from posts.models import Post

        questions = Question.objects.filter(
            post__curation_status=Post.CurationStatus.APPROVED
        )

        if not (self.project and self.project.type == Project.ProjectTypes.SITE_MAIN):
            # normal Project leaderboard
            if self.project:
                questions = questions.filter(
                    Q(post__projects=self.project)
                    | Q(post__default_project=self.project),
                )
            return questions.distinct("id")

        # global leaderboard
        if self.start_time is None or self.end_time is None:
            raise ValueError("Global leaderboards must have start and end times")

        questions = questions.filter_public().filter(
            post__in=Post.objects.filter_for_main_feed()
        )

        if self.score_type == LeaderboardScoreTypes.COMMENT_INSIGHT:
            # post must be published
            return questions.filter(post__published_at__lt=self.end_time)
        elif self.score_type == LeaderboardScoreTypes.QUESTION_WRITING:
            # post must be published, and can't be resolved before the start_time
            # of the leaderboard
            return questions.filter(
                Q(scheduled_close_time__gte=self.start_time)
                & (
                    Q(actual_close_time__isnull=True)
                    | Q(actual_close_time__gte=self.start_time)
                ),
                post__published_at__lt=self.end_time,
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
        checked_intervals: set[tuple[datetime, datetime]] = set()
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
                if (start, end) not in checked_intervals:
                    checked_intervals.add((start, end))
                    questions = questions.filter(
                        Q(open_time__lt=start)
                        | Q(scheduled_close_time__gt=end + close_grace_period)
                        | Q(actual_resolve_time__gt=end + resolve_grace_period)
                    )

        return questions


def name_and_slug_for_global_leaderboard_dates(
    gl_dates: tuple[datetime, datetime],
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
    ci_lower = models.FloatField(
        null=True, blank=True, help_text="Confidence Interval lower bound"
    )
    ci_upper = models.FloatField(
        null=True, blank=True, help_text="Confidence Interval lower bound"
    )
    take = models.FloatField(null=True, blank=True)
    rank = models.IntegerField(null=True, blank=True)
    excluded = models.BooleanField(default=False, db_index=True)
    show_when_excluded = models.BooleanField(
        default=False,
        help_text="""If true, this entry will still be shown in the leaderboard even if
        excluded.""",
    )

    class Medals(models.TextChoices):
        GOLD = "gold"
        SILVER = "silver"
        BRONZE = "bronze"

    medal = models.CharField(
        max_length=200, null=True, blank=True, choices=Medals.choices, db_index=True
    )
    percent_prize = models.FloatField(null=True, blank=True)
    prize = models.FloatField(null=True, blank=True)
    coverage = models.FloatField(null=True, blank=True)
    contribution_count = models.IntegerField(default=0)
    calculated_on = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.leaderboard:
            return (
                f"{self.user.username if self.user else self.aggregation_method}'s "
                f"Entry in {self.leaderboard}"
            )
        return (
            "LeaderboardEntry for "
            f"{self.user.username if self.user else self.aggregation_method}"
        )


class LeaderboardsRanksEntry(TimeStampedModel):
    class RankTypes(models.TextChoices):
        TOURNAMENTS_GLOBAL = "tournaments_global"
        PEER_GLOBAL = "peer_global"
        BASELINE_GLOBAL = "baseline_global"
        COMMENTS_GLOBAL = "comments_global"
        QUESTIONS_GLOBAL = "questions_global"

    user = models.ForeignKey(User, null=False, on_delete=models.CASCADE)
    points = models.FloatField(null=False)

    rank_type = models.CharField(max_length=200, choices=RankTypes.choices, null=False)
    rank = models.IntegerField(null=False)
    rank_total = models.IntegerField(null=False)
    rank_timestamp = models.DateTimeField(null=False)

    best_rank = models.IntegerField(null=True)
    best_rank_total = models.IntegerField(null=True)
    best_rank_timestamp = models.DateTimeField(null=True)

    def __str__(self):
        return f"{self.user}"

    class Meta:
        unique_together = ["user", "rank_type"]


class MedalExclusionRecord(models.Model):
    id: int
    objects: models.Manager["MedalExclusionRecord"]
    user_id: int
    project_id: int | None
    leaderboard_id: int | None

    user = models.ForeignKey(User, on_delete=models.CASCADE)

    start_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="""Optional.
        If not set, this exclusion will extend indefinitely backwards in time.""",
        db_index=True,
    )
    end_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="""Optional.
        If not set, this exclusion will extend indefinitely forwards in time.""",
    )

    class ExclusionTypes(models.TextChoices):
        STAFF = "staff"
        PROJECT_OWNER = "project_owner"
        DISQUALIFIED = "disqualified"
        OTHER = "other"

    exclusion_type = models.CharField(
        max_length=200,
        choices=ExclusionTypes.choices,
        help_text="""Records the type of exclusion. Use Other for custom exclusions.""",
    )
    show_anyway = models.BooleanField(
        default=False,
        help_text="""If true, users excluded by this record will still appear in leaderboards.
        <br>They will still be excluded from taking ranks and prizes.""",
    )
    notes = models.TextField(
        null=True,
        blank=True,
        help_text="""Notes about this exclusion.
        Use this field for disqualified and custom exclusions.""",
    )

    # Exclusion scopes
    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="""Sets the scope of this exclusion to a specific project.
        </br>If this and leaderboard are not set, the exclusion will be universal
        </br>Only set this or leaderboard, though not strictly enforced.
        """,
    )
    leaderboard = models.ForeignKey(
        Leaderboard,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="""Sets the scope of this exclusion to a specific leaderboard.
        </br>If this and project are not set, the exclusion will be universal
        </br>Only set this or project, though not strictly enforced.
        """,
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
        project__type=Project.ProjectTypes.SITE_MAIN,
        start_time__isnull=False,
        end_time__isnull=False,
    )
    intervals = [(lb.start_time, lb.end_time) for lb in leaderboards]
    intervals.sort(key=lambda x: (x[1].year - x[0].year, x[0]))
    return intervals
