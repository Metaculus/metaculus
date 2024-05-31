from django.db import models

# Create your models here.

class UserWeights(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    calculated_on = models.DateTimeField(auto_now_add=True)
    weight = models.FloatField()


class Leaderboard(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    for_project = models.ForeignKey('projects.Project', on_delete=models.CASCADE)
    score = models.FloatField()
    calculated_on = models.DateTimeField(auto_now_add=True)