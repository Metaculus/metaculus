import math
import time
from collections import defaultdict

from django.core.management.base import BaseCommand, CommandParser
from django.db import transaction

from scoring.models import (
    MINIMUM_REPUTATION,
    REPUTATION_GAMMAS,
    REPUTATION_RHOS,
    Leaderboard,
    LeaderboardEntry,
    Reputation,
    Score,
)
from utils.models import ModelBatchCreator

BATCH_SIZE = 5000


def _log_progress(label: str, processed: int, total: int, start_time: float) -> None:
    """Prints periodic progress for a step iterating a large queryset - the
    rho x gamma grid in populate_peer_reputations multiplies every peer
    Score into dozens of Reputation rows, so this gives visible signs of
    life (and a rough ETA) instead of a silent terminal for however many
    minutes it takes."""
    if total == 0:
        return
    step = max(total // 100, 1)  # ~100 updates over the whole run
    if processed != total and processed % step != 0:
        return
    elapsed = time.time() - start_time
    rate = processed / elapsed if elapsed > 0 else 0
    remaining = (total - processed) / rate if rate > 0 else 0
    print(
        f"  [{label}] {processed}/{total} ({processed / total:.1%}) - "
        f"{elapsed:.0f}s elapsed, ~{remaining:.0f}s remaining",
        flush=True,
    )


def populate_year_performance() -> None:
    # Populate "year_performance" reputation for each user from their score
    # on each finalized global 1-year peer leaderboard, using the
    # leaderboard's finalize_time as the reputation's time.
    #
    # Fetches the (small) set of qualifying leaderboards up front instead of
    # querying LeaderboardEntry once per leaderboard, then does a single bulk
    # query for their entries.
    valid_leaderboards = {
        leaderboard_id: finalize_time
        for leaderboard_id, finalize_time, start_time, end_time in Leaderboard.objects.filter(
            project__type="site_main",
            score_type__in=["peer_global", "peer_global_legacy"],
            finalized=True,
            finalize_time__isnull=False,
        ).values_list("id", "finalize_time", "start_time", "end_time")
        if start_time is not None
        and end_time is not None
        and end_time.year - start_time.year == 1
    }

    entries = LeaderboardEntry.objects.filter(
        leaderboard_id__in=valid_leaderboards, user__isnull=False
    ).values_list("leaderboard_id", "user_id", "score")

    total = entries.count()
    print(f"populate_year_performance: processing {total} entries...", flush=True)

    with ModelBatchCreator(model_class=Reputation, batch_size=BATCH_SIZE) as creator:
        start_time = time.time()
        for i, (leaderboard_id, user_id, score) in enumerate(
            entries.iterator(chunk_size=BATCH_SIZE), start=1
        ):
            _log_progress("year_performance", i, total, start_time)
            creator.append(
                Reputation(
                    user_id=user_id,
                    time=valid_leaderboards[leaderboard_id],
                    type="year_performance",
                    value=max(score, MINIMUM_REPUTATION),
                )
            )


def _softplus(x: float) -> float:
    # Numerically stable log(1 + exp(x)) - avoids overflow in exp(x) for
    # large positive x (used with x scaled by 1/MINIMUM_REPUTATION below,
    # so x routinely reaches magnitudes exp() can't handle directly).
    if x > 0:
        return x + math.log1p(math.exp(-x))
    return math.log1p(math.exp(x))


def populate_peer_reputations() -> None:
    # Populate "average_peer_score" together with the "peer_threshold_*" and
    # "peer_continuous_*" grid (every (rho, gamma) combo in REPUTATION_RHOS x
    # REPUTATION_GAMMAS) in a single pass over peer Scores. All of these are
    # derived from the same running (average peer score r_i, total coverage
    # c_i) state, replayed in chronological order so a re-scored question
    # replaces its prior contribution instead of double-counting it - looping
    # the (large) peer-score queryset once per reputation family, as the
    # original migration did, doubled the DB reads and bookkeeping for no
    # reason.
    #
    # "peer_threshold_{rho}_coverage_{gamma}": a hard-thresholded r_i' -
    #   r_i' = MINIMUM_REPUTATION      if r_i < rho or c_i < gamma
    #   r_i' = r_i - rho               otherwise
    #
    # "peer_continuous_{rho}_coverage_{gamma}": a smooth version of the same
    # idea - shrinks r_i toward rho by a Bayesian-style blend weighted by
    # c_i vs. the coverage threshold gamma, then passes (blend - rho)
    # through an epsilon-scaled softplus, which smoothly approximates
    # max(blend - rho, 0) (exactly max() as MINIMUM_REPUTATION -> 0):
    #   blend = (gamma*rho + c_i*r_i) / (gamma + c_i)
    #   r_i' = MINIMUM_REPUTATION * softplus((blend - rho) / MINIMUM_REPUTATION)
    peer_scores = (
        Score.objects.filter(
            score_type="peer",
            user__isnull=False,
            question__post__default_project__default_permission__isnull=False,
        )
        .order_by("edited_at")
        .values_list("user_id", "question_id", "score", "coverage", "edited_at")
    )

    # Precomputed once so the hot loop below never re-formats type strings.
    grid = [
        (
            rho,
            gamma,
            f"peer_threshold_{rho}_coverage_{gamma}",
            f"peer_continuous_{rho}_coverage_{gamma}",
        )
        for rho in REPUTATION_RHOS
        for gamma in REPUTATION_GAMMAS
    ]

    # user_id -> {question_id: (score, coverage)}, so a re-scored question
    # replaces its prior contribution instead of double-counting it.
    scores_by_user_question: dict[int, dict[int, tuple[float, float]]] = defaultdict(
        dict
    )
    # user_id -> [score_sum, coverage_sum]
    totals_by_user: dict[int, list[float]] = defaultdict(lambda: [0.0, 0.0])

    total = peer_scores.count()
    print(
        f"populate_peer_reputations: processing {total} peer scores x "
        f"{len(grid)} (rho, gamma) combos x 2 formulas...",
        flush=True,
    )

    with ModelBatchCreator(model_class=Reputation, batch_size=BATCH_SIZE) as creator:
        start_time = time.time()
        for i, (user_id, question_id, score, coverage, edited_at) in enumerate(
            peer_scores.iterator(chunk_size=BATCH_SIZE), start=1
        ):
            _log_progress("peer_reputations", i, total, start_time)

            totals = totals_by_user[user_id]
            previous = scores_by_user_question[user_id].get(question_id)
            if previous is not None:
                totals[0] -= previous[0]
                totals[1] -= previous[1]
            scores_by_user_question[user_id][question_id] = (score, coverage)
            totals[0] += score
            totals[1] += coverage

            r = totals[0] / (30 + totals[1])
            c = totals[1]

            creator.append(
                Reputation(
                    user_id=user_id,
                    time=edited_at,
                    type="average_peer_score",
                    value=max(r, MINIMUM_REPUTATION),
                )
            )

            for rho, gamma, threshold_type, continuous_type in grid:
                if r < rho or c < gamma:
                    threshold_value = MINIMUM_REPUTATION
                else:
                    threshold_value = max(r - rho, MINIMUM_REPUTATION)
                creator.append(
                    Reputation(
                        user_id=user_id,
                        time=edited_at,
                        type=threshold_type,
                        value=threshold_value,
                    )
                )

                blend = (gamma * rho + c * r) / (gamma + c)
                continuous_value = max(
                    MINIMUM_REPUTATION * _softplus((blend - rho) / MINIMUM_REPUTATION),
                    MINIMUM_REPUTATION,
                )
                creator.append(
                    Reputation(
                        user_id=user_id,
                        time=edited_at,
                        type=continuous_type,
                        value=continuous_value,
                    )
                )


PEER_REPUTATION_TYPES = ["average_peer_score"] + [
    f"peer_{formula}_{rho}_coverage_{gamma}"
    for formula in ("threshold", "continuous")
    for rho in REPUTATION_RHOS
    for gamma in REPUTATION_GAMMAS
]


class Command(BaseCommand):
    help = """
    Backfill Reputation rows (year_performance, average_peer_score, and the
    peer_threshold_*/peer_continuous_* grid) from historical Leaderboard and
    Score data.

    This used to run inline in migration 0022, but replaying every peer
    Score across the full (rho, gamma) grid is too slow to run as part of a
    migration - run it manually (e.g. from a one-off deploy task) after
    migrating instead.

    Re-running is safe: existing Reputation rows for the selected --types
    are deleted and recomputed from scratch, e.g. after changing
    REPUTATION_RHOS/REPUTATION_GAMMAS.
    """

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--types",
            nargs="+",
            choices=["year_performance", "peer"],
            default=["year_performance", "peer"],
            help="Which reputation families to (re)populate. 'peer' covers "
            "average_peer_score and the full peer_threshold_*/peer_continuous_* "
            "grid, since they're computed together in one pass over the same "
            "underlying Scores.",
        )

    def handle(self, *args, **options):
        types = options["types"]

        if "year_performance" in types:
            with transaction.atomic():
                Reputation.objects.filter(type="year_performance").delete()
                populate_year_performance()

        if "peer" in types:
            with transaction.atomic():
                Reputation.objects.filter(type__in=PEER_REPUTATION_TYPES).delete()
                populate_peer_reputations()
