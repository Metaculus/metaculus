from django.db import models


class ResolutionType(models.TextChoices):
    AMBIGUOUS = "ambiguous"
    ANNULLED = "annulled"

