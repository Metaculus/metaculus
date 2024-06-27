from django.db import models


class BinaryResolution(models.TextChoices):
    YES = "yes"
    NO = "no"
    AMBIGUOUS = "ambiguous"
    ANNULLED = "annulled"
