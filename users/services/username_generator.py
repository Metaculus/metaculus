import random

from django.db.models.functions import Upper

from users.models import User
from users.services.username_words import (
    ADJECTIVES,
    ADVERBS,
    AGENT_NOUNS,
    CONCEPT_NOUNS,
    PLURAL_CONCEPTS,
)

# Output is NEVER derived from the user's email or profile data -
# generate_username() takes no user input at all.

# Longest name the patterns can produce - a budget the wordlists are curated to
# obey, not a runtime check. The numeric fallback below can add a digit past it;
# harmless, since the column holds 150 characters.
MAX_GENERATED_LENGTH = 24

_ALL_NOUNS = AGENT_NOUNS + CONCEPT_NOUNS
# Three-part names need shorter words to stay inside MAX_GENERATED_LENGTH.
_SHORT_ADJECTIVES = [word for word in ADJECTIVES if len(word) <= 7]
_SHORT_AGENT_NOUNS = [word for word in AGENT_NOUNS if len(word) <= 9]

# A pattern is a tuple of parts; a part is the list of words that slot draws
# from. Together they span ~666k names.
PATTERNS = [
    (ADJECTIVES, _ALL_NOUNS),  # CalibratedAugur, LucidQuantile
    (CONCEPT_NOUNS, AGENT_NOUNS),  # SignalCartographer, PriorWarden
    (ADVERBS, _SHORT_ADJECTIVES, _SHORT_AGENT_NOUNS),  # QuietlyBoldOracle
    (AGENT_NOUNS, ["Of"], PLURAL_CONCEPTS),  # WardenOfPriors
]
# Tuned for how the output reads, not for how large each pattern is: a
# saturated pattern simply loses its candidates to the rest of the batch.
PATTERN_WEIGHTS = [35, 30, 20, 15]

CANDIDATE_BATCH_SIZE = 8


def generate_username() -> str:
    """
    Random readable username like "CalibratedAugur", "SignalCartographer" or
    "WardenOfPriors", with a deterministic "KeenSignal2"-style fallback. Fast
    path: one case-insensitive query over a batch of candidates. If the whole
    batch is taken, the smallest free numeric suffix for one candidate is used -
    guaranteed to succeed, no retries.
    """
    candidates = [
        "".join(random.choice(part) for part in pattern)
        for pattern in random.choices(
            PATTERNS, weights=PATTERN_WEIGHTS, k=CANDIDATE_BATCH_SIZE
        )
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
