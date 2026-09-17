from django.db import models

# Default number of bots a user may own. Lift per user via metadata["max_bots"].
DEFAULT_MAX_BOTS = 5

forbidden_usernames = [
    "anonymous",
    "moderator",
    "moderators",
    "predictor",
    "predictors",
    "metaculus",
    "admin",
    "admins",
    "curator",
    "curators",
]


class ApiAccessTier(models.TextChoices):
    RESTRICTED = "restricted"
    BENCHMARKING = "benchmarking"
    UNRESTRICTED = "unrestricted"


class ApiForecastingAccess(models.TextChoices):
    # Account may submit forecasts via the API (bots, and humans who confirmed).
    ENABLED = "enabled"
    # Default for human accounts: API forecasting blocked, no prompt shown yet.
    DISABLED = "disabled"
    # Human account hit a blocked API forecast and must confirm; prompt is shown.
    PENDING = "pending"
