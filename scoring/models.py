from django.db import models

from projects.models import Project
from utils.models import TimeStampedModel


# Create your models here.


class UserWeight(TimeStampedModel):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE)
    calculated_on = models.DateTimeField(auto_now_add=True)
    weight = models.FloatField(default=1)


class Score(TimeStampedModel):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE)
    for_question = models.ForeignKey("questions.Question", on_delete=models.CASCADE)
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
    user = models.ForeignKey("users.User", on_delete=models.CASCADE)
    for_project = models.ForeignKey(
        "projects.Project", on_delete=models.CASCADE, related_name="leaderboard_entries"
    )
    leaderboard_type = models.CharField(
        max_length=200, choices=Project.LeaderboardTypes.choices
    )
    score = models.FloatField()
    coverage = models.FloatField(null=True)
    contribution_count = models.IntegerField(default=0)
    medal = models.CharField(max_length=200, null=True)
    calculated_on = models.DateTimeField(auto_now_add=True)
    # Here and for the score we can either have a boolean flag which says "stop computing" (i.e. this entry is forever stored)
    # Or we can have a dynamic calculation which decides if we stop computing (e.g. the project is closed, or for questions, the question is closed)
