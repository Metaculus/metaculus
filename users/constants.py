from django.db import models


class ApiAccessTier(models.TextChoices):
    RESTRICTED = "restricted", "Restricted"
    BOT_BENCHMARKING = "bot_benchmarking", "Bot Benchmarking"
    UNRESTRICTED = "unrestricted", "Unrestricted"
