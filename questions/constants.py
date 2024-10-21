from django.db import models


class ResolutionType(models.TextChoices):
    AMBIGUOUS = "ambiguous"
    ANNULLED = "annulled"


class QuestionStatus(models.TextChoices):
    UPCOMING = "upcoming"
    RESOLVED = "resolved"
    CLOSED = "closed"
    OPEN = "open"
