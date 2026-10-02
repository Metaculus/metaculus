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
    """Deprecated. Backs the legacy User.api_access_tier and
    UserDataAccess.api_access_tier columns, which nothing reads any more.

    TEMPORARY: both columns, and this enum, must be removed before this branch merges.
    Use ApiAccessLevel and misc.models.UserApiAccess.
    """

    RESTRICTED = "restricted"
    BENCHMARKING = "benchmarking"
    UNRESTRICTED = "unrestricted"


class ApiAccessLevel(models.TextChoices):
    """Levels a UserApiAccess grant may confer. See misc.models.UserApiAccess."""

    BENCHMARKING = "benchmarking"
    UNRESTRICTED = "unrestricted"


# Reported to the API gateway for a user holding no UserApiAccess grant. Deliberately
# not one of ApiAccessLevel: a stored grant conferring it would be indistinguishable
# from holding no grant at all.
API_ACCESS_RESTRICTED = "restricted"

# Least to most permissive. Grants resolve by taking the maximum, so a project-scoped
# grant can only widen a global one, never narrow it.
API_ACCESS_LEVEL_RANK = {
    API_ACCESS_RESTRICTED: 0,
    ApiAccessLevel.BENCHMARKING: 1,
    ApiAccessLevel.UNRESTRICTED: 2,
}


class ApiForecastingAccess(models.TextChoices):
    # Account may submit forecasts via the API (bots, and humans who confirmed).
    ENABLED = "enabled"
    # Default for human accounts: API forecasting blocked, no prompt shown yet.
    DISABLED = "disabled"
    # Human account hit a blocked API forecast and must confirm; prompt is shown.
    PENDING = "pending"
