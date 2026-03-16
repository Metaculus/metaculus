from django.db import models


class ApiAccessTier(models.TextChoices):
    RESTRICTED = "restricted", "Restricted"
    BENCHMARKING = "benchmarking", "Benchmarking"
    UNRESTRICTED = "unrestricted", "Unrestricted"
