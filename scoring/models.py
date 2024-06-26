from django.db import models

from users.models import User
from projects.models import Project
from questions.models import Question
from utils.models import TimeStampedModel


# Create your models here.


class UserWeight(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    calculated_on = models.DateTimeField(auto_now_add=True)
    weight = models.FloatField(default=1)


class Score(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    score = models.FloatField()
    coverage = models.FloatField(default=0)

    class ScoreTypes(models.TextChoices):
        RELATIVE_LEGACY = "relative_legacy"
        PEER = "peer"
        BASELINE = "baseline"
        SPOT_PEER = "spot_peer"
        SPOT_BASELINE = "spot_baseline"

    score_type = models.CharField(max_length=200, choices=ScoreTypes.choices)


class LeaderboardEntry(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="leaderboard_entries"
    )
    leaderboard_type = models.CharField(
        max_length=200, choices=Project.LeaderboardTypes.choices
    )
    score = models.FloatField()
    coverage = models.FloatField(null=True)
    contribution_count = models.IntegerField(default=0)
    medal = models.CharField(max_length=200, null=True)
    calculated_on = models.DateTimeField(auto_now_add=True)
