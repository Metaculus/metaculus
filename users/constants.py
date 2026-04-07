from django.db import models


class ApiAccessTier(models.TextChoices):
    RESTRICTED = "restricted"
    BENCHMARKING = "benchmarking"
    UNRESTRICTED = "unrestricted"
