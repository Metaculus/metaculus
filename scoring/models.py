from datetime import datetime, timezone

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

    score_type = models.CharField(max_length=200, choices=ScoreTypes.choices)


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


class Leaderboard(TimeStampedModel):
    # typing
    id: int
    project_id: int
    objects: models.Manager["Leaderboard"]
    entries: QuerySet["LeaderboardEntry"]

    name = models.CharField(max_length=200, null=True)
    project = models.ForeignKey(
        Project, null=True, on_delete=models.CASCADE, related_name="leaderboards"
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
                case cls.COMMENT_INSIGHT:
                    raise ValueError(
                        "Comment insight leaderboards do not have base scores"
                    )
                case cls.QUESTION_WRITING:
                    raise ValueError(
                        "Question Writing leaderboards do not have base scores"
                    )

    score_type = models.CharField(max_length=200, choices=ScoreTypes.choices)
    start_time = models.DateTimeField(null=True)
    end_time = models.DateTimeField(null=True)
    finalize_time = models.DateTimeField(null=True)

    def get_questions(self) -> list[Question]:
        if self.project:
            questions = Question.objects.filter(
                Q(post__projects=self.project)
                | Q(group__post__projects=self.project)
                | Q(post__default_project=self.project)
                | Q(group__post__default_project=self.project)
                | Q(conditional_yes__post__projects=self.project)
                | Q(conditional_no__post__projects=self.project)
                | Q(conditional_yes__post__default_project=self.project)
                | Q(conditional_no__post__default_project=self.project)
            ).distinct("pk")
        else:
            questions = Question.objects.all()

        if self.score_type == self.ScoreTypes.COMMENT_INSIGHT:
            # post must be published
            return list(
                questions.filter(
                    Q(post__published_at__lt=self.end_time)
                    | Q(group__post__published_at__lt=self.end_time)
                ).distinct("pk")
            )
        elif self.score_type == self.ScoreTypes.QUESTION_WRITING:
            # post must be published, and can't be resolved before the start_time
            # of the leaderboard
            from posts.models import Post

            invalid_statuses = [
                Post.CurationStatus.DELETED,
                Post.CurationStatus.DRAFT,
                Post.CurationStatus.REJECTED,
            ]
            return list(
                questions.filter(
                    Q(post__published_at__lt=self.end_time)
                    | Q(group__post__published_at__lt=self.end_time)
                    | Q(conditional_yes__post__published_at__lt=self.end_time)
                    | Q(conditional_no__post__published_at__lt=self.end_time),
                    # Q(scheduled_close_time__gte=self.start_time),
                )
                .exclude(
                    Q(post__curation_status__in=invalid_statuses)
                    | Q(group__post__curation_status__in=invalid_statuses)
                    | Q(conditional_yes__post__curation_status__in=invalid_statuses)
                    | Q(conditional_no__post__curation_status__in=invalid_statuses),
                )
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

    user = models.ForeignKey(User, null=True, on_delete=models.CASCADE)
    aggregation_method = models.CharField(
        max_length=200, null=True, choices=AggregationMethod.choices
    )
    leaderboard = models.ForeignKey(
        Leaderboard, on_delete=models.CASCADE, related_name="entries", null=True
    )
    score = models.FloatField()
    take = models.FloatField(null=True)
    rank = models.IntegerField(null=True)
    excluded = models.BooleanField(default=False)

    class Medals(models.TextChoices):
        GOLD = "gold"
        SILVER = "silver"
        BRONZE = "bronze"

    medal = models.CharField(max_length=200, null=True, choices=Medals.choices)
    percent_prize = models.FloatField(null=True)
    prize = models.FloatField(null=True)
    coverage = models.FloatField(null=True)
    contribution_count = models.IntegerField(default=0)
    calculated_on = models.DateTimeField(auto_now=True)


class MedalExclusionRecord(models.Model):
    id: int
    objects: models.Manager["MedalExclusionRecord"]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True)

    class ExclusionTypes(models.TextChoices):
        STAFF = "staff"
        PROJECT_OWNER = "project_owner"

    exclusion_type = models.CharField(max_length=200, choices=ExclusionTypes.choices)
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True)

    def __str__(self) -> str:
        return (
            f"<MedalExclusionRecord for {self.user.username}, "
            f"Start:{self.start_time}, End:{self.end_time or 'None'}>"
        )


def populate_medal_exclusion_records():
    """Populate medal exclusion records."""

    exclusions = [
        {
            "start_time": datetime(2016, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 5,  # max.wainwright (Max Wainwright)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2016, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 8,  # Anthony (Anthony Aguirre)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2016, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 10,  # Greg (Greg Laughlin)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2022, 1, 1, tzinfo=timezone.utc),
            "end_time": datetime(2023, 1, 1, tzinfo=timezone.utc),
            "user_id": 100345,  # EvanHarper (Even Harper)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2018, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 103275,  # Christian (Christian Williams)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2020, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 104161,  # casens (Rudy Ordoyne)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2018, 1, 1, tzinfo=timezone.utc),
            "end_time": datetime(2021, 1, 1, tzinfo=timezone.utc),
            "user_id": 104761,  # Tamay (Tama Besiroglu)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2020, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 105951,  # Sylvain (Sylvain Chevalier)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2022, 1, 1, tzinfo=timezone.utc),
            "end_time": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "user_id": 106424,  # rakyi (Martin Račák)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2019, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 109158,  # Gaia (Gaia Dempsey)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2022, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 109639,  # nikos (Nikos Bosse)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2020, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 111848,  # juancambeiro (Juan Cambeiro)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2021, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 112036,  # TomL (Tom Liptay)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2022, 1, 1, tzinfo=timezone.utc),
            "end_time": datetime(2023, 1, 1, tzinfo=timezone.utc),
            "user_id": 112062,  # dschwarz (Dan Schwarz)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2022, 1, 1, tzinfo=timezone.utc),
            "end_time": datetime(2023, 1, 1, tzinfo=timezone.utc),
            "user_id": 112146,  # GustavoLacerda (Gusto Lacerda)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2020, 1, 1, tzinfo=timezone.utc),
            "end_time": datetime(2022, 1, 1, tzinfo=timezone.utc),
            "user_id": 113121,  # AlyssaStevens (Alyssa Stevens)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2016, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 114881,  # Metaculus-Partners
            "exclusion_type": "project_owner",  # TODO: add project
        },
        {
            "start_time": datetime(2016, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 115254,  # MetaculusOutlooks
            "exclusion_type": "project_owner",  # TODO: add project
        },
        {
            "start_time": datetime(2022, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 117502,  # RyanBeck (Ryan Beck)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2022, 1, 1, tzinfo=timezone.utc),
            "end_time": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "user_id": 118883,  # scoblic (Peter Scoblic)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2023, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 119005,  # will_aldred (Will Aldred)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2021, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 119055,  # sriivv (?Srinivasan Venkatramanan?)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2021, 1, 1, tzinfo=timezone.utc),
            "end_time": datetime(2023, 1, 1, tzinfo=timezone.utc),
            "user_id": 119426,  # havlickova.blanka (Blanka Havlickova)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2021, 1, 1, tzinfo=timezone.utc),
            "end_time": datetime(2023, 1, 1, tzinfo=timezone.utc),
            "user_id": 119604,  # Lawrence (Lawrence Phillips)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2021, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 120279,  # Tom_Metaculus (Tom Liptay)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2022, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 126463,  # prospero (Atakan Seckin)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2022, 1, 1, tzinfo=timezone.utc),
            "end_time": datetime(2023, 1, 1, tzinfo=timezone.utc),
            "user_id": 129011,  # AlexL (Alex Lawson)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2022, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 130973,  # NMorrison (Nate Morrison)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2023, 1, 1, tzinfo=timezone.utc),
            "end_time": datetime(2024, 6, 13, tzinfo=timezone.utc),
            "user_id": 131279,  # raxsade (Ragnar Sade)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2022, 1, 1, tzinfo=timezone.utc),
            "end_time": datetime(2024, 6, 7, tzinfo=timezone.utc),
            "user_id": 132519,  # Anastasia (Anastasia Miliano)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2023, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 133407,  # jleibowich (Jacob Leibowich)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2023, 1, 1, tzinfo=timezone.utc),
            "end_time": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "user_id": 134734,  # rezendi (Jon Rezendi)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2022, 12, 19, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 135613,  # LukeAdmin (Luke Sabor)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2023, 1, 1, tzinfo=timezone.utc),
            "end_time": datetime(2024, 6, 13, tzinfo=timezone.utc),
            "user_id": 136589,  # KirillYakunin (Kiril Yakunin)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2023, 1, 1, tzinfo=timezone.utc),
            "end_time": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "user_id": 137624,  # jwildman (Jack Wildman)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2023, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 137979,  # elis (Elis Popescu)
            "exclusion_type": "staff",
        },
        {
            "start_time": datetime(2023, 1, 1, tzinfo=timezone.utc),
            "end_time": None,
            "user_id": 144359,  # w.aldred (Will Aldred)
            "exclusion_type": "staff",
        },
    ]

    # Filter only existing users
    user_ids = list(
        User.objects.filter(id__in=[x["user_id"] for x in exclusions]).values_list(
            "id", flat=True
        )
    )

    for exclusion in exclusions:
        if exclusion["user_id"] in user_ids:
            MedalExclusionRecord.objects.get_or_create(**exclusion)


def global_leaderboard_dates() -> list[tuple[datetime, datetime]]:
    # Returns the start and end dates for each global leaderboard
    # This will have to be updated every year
    utc = timezone.utc
    return [
        # one year intervals
        (datetime(2016, 1, 1, tzinfo=utc), datetime(2017, 1, 1, tzinfo=utc)),
        (datetime(2017, 1, 1, tzinfo=utc), datetime(2018, 1, 1, tzinfo=utc)),
        (datetime(2018, 1, 1, tzinfo=utc), datetime(2019, 1, 1, tzinfo=utc)),
        (datetime(2019, 1, 1, tzinfo=utc), datetime(2020, 1, 1, tzinfo=utc)),
        (datetime(2020, 1, 1, tzinfo=utc), datetime(2021, 1, 1, tzinfo=utc)),
        (datetime(2021, 1, 1, tzinfo=utc), datetime(2022, 1, 1, tzinfo=utc)),
        (datetime(2022, 1, 1, tzinfo=utc), datetime(2023, 1, 1, tzinfo=utc)),
        (datetime(2023, 1, 1, tzinfo=utc), datetime(2024, 1, 1, tzinfo=utc)),
        (datetime(2024, 1, 1, tzinfo=utc), datetime(2025, 1, 1, tzinfo=utc)),
        (datetime(2025, 1, 1, tzinfo=utc), datetime(2026, 1, 1, tzinfo=utc)),
        # two year intervals
        (datetime(2016, 1, 1, tzinfo=utc), datetime(2018, 1, 1, tzinfo=utc)),
        (datetime(2018, 1, 1, tzinfo=utc), datetime(2020, 1, 1, tzinfo=utc)),
        (datetime(2020, 1, 1, tzinfo=utc), datetime(2022, 1, 1, tzinfo=utc)),
        (datetime(2022, 1, 1, tzinfo=utc), datetime(2024, 1, 1, tzinfo=utc)),
        (datetime(2024, 1, 1, tzinfo=utc), datetime(2026, 1, 1, tzinfo=utc)),
        # five year intervals
        (datetime(2016, 1, 1, tzinfo=utc), datetime(2021, 1, 1, tzinfo=utc)),
        (datetime(2021, 1, 1, tzinfo=utc), datetime(2026, 1, 1, tzinfo=utc)),
        # ten year intervals
        (datetime(2016, 1, 1, tzinfo=utc), datetime(2026, 1, 1, tzinfo=utc)),
    ]


def global_leaderboard_dates_and_score_types() -> (
    list[tuple[datetime, datetime, Leaderboard.ScoreTypes]]
):
    leaderboard_dates = global_leaderboard_dates()
    global_leaderboards = []
    for start, end in leaderboard_dates:
        if end > datetime(2024, 6, 1, tzinfo=timezone.utc):
            global_leaderboards.append((start, end, Leaderboard.ScoreTypes.PEER_GLOBAL))
        else:
            global_leaderboards.append(
                (start, end, Leaderboard.ScoreTypes.PEER_GLOBAL_LEGACY)
            )
        global_leaderboards.append((start, end, Leaderboard.ScoreTypes.BASELINE_GLOBAL))
        if end.year - start.year == 1:
            global_leaderboards.append(
                (start, end, Leaderboard.ScoreTypes.COMMENT_INSIGHT)
            )
            global_leaderboards.append(
                (start, end, Leaderboard.ScoreTypes.QUESTION_WRITING)
            )
    return global_leaderboards
