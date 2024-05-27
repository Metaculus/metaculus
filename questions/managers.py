from django.db import models


class QuestionQuerySet(models.QuerySet):
    def prefetch_projects(self):
        return self.prefetch_related("projects")
