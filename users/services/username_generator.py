import random

from django.db.models.functions import Upper

from users.models import User

# Purpose-built forecasting-themed wordlists. Output is NEVER derived from the
# user's email or profile data - generate_username() takes no user input at all.
ADJECTIVES = [
    "Calibrated",
    "Bayesian",
    "Prudent",
    "Keen",
    "Sharp",
    "Bold",
    "Steady",
    "Curious",
    "Rational",
    "Astute",
    "Vigilant",
    "Precise",
    "Shrewd",
    "Sage",
    "Lucid",
    "Nimble",
    "Candid",
    "Diligent",
    "Earnest",
    "Foresighted",
    "Insightful",
    "Judicious",
    "Measured",
    "Observant",
]
NOUNS = [
    "Forecaster",
    "Oracle",
    "Augur",
    "Predictor",
    "Estimator",
    "Analyst",
    "Signal",
    "Prior",
    "Posterior",
    "Outlook",
    "Horizon",
    "Beacon",
    "Compass",
    "Almanac",
    "Barometer",
    "Prognosis",
    "Trendline",
    "Quantile",
    "Interval",
    "Median",
    "Scenario",
    "Milestone",
    "Vanguard",
    "Watcher",
]

CANDIDATE_BATCH_SIZE = 10


def generate_username() -> str:
    """
    Random readable username like "CalibratedAugur", with a deterministic
    "KeenSignal2"-style fallback. Fast path: one case-insensitive query over a
    batch of candidates. If the whole batch is taken, the smallest free numeric
    suffix for one combo is used - guaranteed to succeed, no retries.
    """
    candidates = [
        f"{random.choice(ADJECTIVES)}{random.choice(NOUNS)}"
        for _ in range(CANDIDATE_BATCH_SIZE)
    ]

    # UPPER matches the functional index upper_username_idx (index scan;
    # LOWER would seq-scan the users table).
    taken = {
        username.upper()
        for username in User.objects.annotate(username_upper=Upper("username"))
        .filter(username_upper__in=[c.upper() for c in candidates])
        .values_list("username", flat=True)
    }

    for candidate in candidates:
        if candidate.upper() not in taken:
            return candidate

    combo = candidates[0]
    existing = User.objects.filter(username__istartswith=combo).values_list(
        "username", flat=True
    )
    # isascii() guards against Unicode digit-likes (e.g. "²") that pass
    # isdigit() but crash int(); \w usernames can contain them.
    suffixes = {
        int(rest)
        for name in existing
        if (rest := name[len(combo) :]).isascii() and rest.isdigit()
    }

    suffix = 2
    while suffix in suffixes:
        suffix += 1

    return f"{combo}{suffix}"
