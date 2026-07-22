import logging
import multiprocessing
import os
import random
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import dataclass, replace
from datetime import datetime, timezone as dt_timezone

import numpy as np
from django.core.management.base import BaseCommand, CommandError, CommandParser
from django.db.models import Count, Max

from questions.constants import UnsuccessfulResolutionType
from questions.models import Forecast, Question
from scoring.constants import ScoreTypes
from scoring.fast_scoring import (
    DECAYED_REPUTATION_CLASSES,
    MAX_SAMPLED_TIMESTEPS,
    MEAN_BASED_METHODS,
    MEDIAN_BASED_METHODS,
    REPUTATION_WEIGHTED_CLASSES,
    STATIC_FILTER_CLASSES,
    ReputationArrays,
    compute_aggregation_series,
    compute_geometric_mean_series,
    compute_median_aggregation_series,
    compute_spot_scores,
    get_or_build_question_data,
    preload_reputation_history,
    preload_static_filter,
    score_baseline,
    score_peer,
    subsample_timesteps,
)
from utils.the_math.aggregations import AGGREGATIONS

logger = logging.getLogger(__name__)

VALID_AGGREGATION_METHODS = [agg.method for agg in AGGREGATIONS]
DEFAULT_AGGREGATION_METHODS = [
    "unweighted",
    "recency_weighted",
    "single_aggregation",
    "year_performance",
]
VALID_QUESTION_TYPES = [c.value for c in Question.QuestionType]
SPOT_SCORE_TYPES = {"spot_peer", "spot_baseline"}
StaticFilterKey = tuple[str, datetime | None]


@dataclass(frozen=True)
class AggregationSpec:
    """One --aggregation-method entry, parsed from either a bare method name
    or "method,param1,param2,..." - the latter attaches extra, method
    -specific parameters so a grid search over them (e.g. single_aggregation's
    a/b) can run as several specs in one invocation instead of one full run
    per combination.

    `method` is the real aggregation method name, used for all of
    fast_scoring's dispatch logic. `label` is the raw, comma-joined spec
    string - used as the totals dict key and shown in the report, so
    grid-search variants of the same method stay distinguishable from each
    other and from a plain, unparameterized run of it.
    """

    method: str
    label: str
    a: float | None = None
    b: float | None = None
    b_spot: float | None = None
    joined_before: datetime | None = None


def _parse_joined_before(joined_before_str: str | None) -> datetime | None:
    if not joined_before_str:
        return None
    parsed = datetime.fromisoformat(joined_before_str)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt_timezone.utc)
    return parsed


def _parse_aggregation_spec(raw: str) -> AggregationSpec:
    """Parses one --aggregation-method value. A bare method name works as
    before (e.g. "unweighted"); "method,x,y..." attaches extra parameters:
      - single_aggregation / year_performance: "method,a,b" - per-spec a/b,
        overriding the global --a/--b for just this spec.
      - spot_sensitive: "method,a,b" or "method,a,b,b_spot" - per-spec a/b
        (used outside the spot-sensitive period) and, optionally, b_spot
        (used strictly before the question's spot scoring time); omitting
        b_spot defaults it to whatever b resolves to.
      - joined_before_date: "method,YYYY-MM-DD" - per-spec joined_before
        cutoff, overriding the global --joined-before for just this spec.
    Every other method takes no extra parameters.
    """
    parts = [p.strip() for p in raw.split(",")]
    method, extra = parts[0], parts[1:]
    label = ",".join(parts)

    if method == "spot_sensitive":
        if len(extra) not in (0, 2, 3):
            raise CommandError(
                f"{raw!r}: {method!r} takes 0, 2 (a,b), or 3 (a,b,b_spot) "
                f"extra values, got {len(extra)}"
            )
        if not extra:
            return AggregationSpec(method=method, label=label)
        try:
            a, b = float(extra[0]), float(extra[1])
            b_spot = float(extra[2]) if len(extra) == 3 else None
        except ValueError as e:
            raise CommandError(f"{raw!r}: a/b/b_spot must be numbers ({e})")
        return AggregationSpec(method=method, label=label, a=a, b=b, b_spot=b_spot)

    if method in DECAYED_REPUTATION_CLASSES:
        if len(extra) not in (0, 2):
            raise CommandError(
                f"{raw!r}: {method!r} takes 0 or 2 extra values (a,b), got "
                f"{len(extra)}"
            )
        if not extra:
            return AggregationSpec(method=method, label=label)
        try:
            a, b = float(extra[0]), float(extra[1])
        except ValueError as e:
            raise CommandError(f"{raw!r}: a/b must be numbers ({e})")
        return AggregationSpec(method=method, label=label, a=a, b=b)

    if method == "joined_before_date":
        if len(extra) not in (0, 1):
            raise CommandError(
                f"{raw!r}: {method!r} takes 0 or 1 extra value (a "
                f"joined_before date), got {len(extra)}"
            )
        if not extra:
            return AggregationSpec(method=method, label=label)
        return AggregationSpec(
            method=method, label=label, joined_before=_parse_joined_before(extra[0])
        )

    if extra:
        raise CommandError(
            f"{raw!r}: {method!r} doesn't accept extra comma-separated "
            f"parameters, got {extra}"
        )
    return AggregationSpec(method=method, label=label)


def _detect_max_workers() -> int:
    """Best-effort count of usable CPU cores, for --workers auto. Prefers
    sched_getaffinity (Linux-only) over cpu_count(): it reflects this
    process's actual CPU affinity/cgroup quota (e.g. inside a container with
    a fractional core limit), which cpu_count() ignores - not a concern for
    production correctness (this command isn't production code), just for
    not spawning far more workers than can actually run concurrently."""
    try:
        return len(os.sched_getaffinity(0))
    except AttributeError:
        return os.cpu_count() or 1


def _score_question(
    question: Question,
    question_score_type: str,
    specs: list[AggregationSpec],
    totals: dict[str, dict],
    rebuild_cache: bool,
    sample_timesteps: bool,
    reputation_histories: dict[str, ReputationArrays],
    static_filters: dict[StaticFilterKey, set[int]],
) -> None:
    """Scores one question against every requested aggregation spec,
    accumulating into `totals` (keyed by spec.label) in place. Module-level
    (not a Command method) so it can run identically in-process (--workers
    1) or inside a worker process (--workers > 1, via _score_question_worker
    below)."""
    if question_score_type in SPOT_SCORE_TYPES:
        for spec in specs:
            score, _coverage = compute_spot_scores(
                question,
                spec.method,
                question_score_type,
                a=spec.a,
                b=spec.b,
                reputation_history=reputation_histories.get(spec.method),
            )
            totals[spec.label]["score"] += score
            totals[spec.label]["count"] += 1
            totals[spec.label]["scores"].append(score)
        return

    data = get_or_build_question_data(question, rebuild_cache=rebuild_cache)
    if data is None:
        return
    if sample_timesteps:
        data = subsample_timesteps(data)

    gm_series = gm_counts = None
    if question_score_type == ScoreTypes.PEER:
        gm_series, gm_counts = compute_geometric_mean_series(data)

    for spec in specs:
        if spec.method in MEAN_BASED_METHODS:
            series = compute_aggregation_series(
                data,
                question,
                spec.method,
                a=spec.a,
                b=spec.b,
                b_spot=spec.b_spot,
                reputation_history=reputation_histories.get(spec.method),
            )
        else:
            series = compute_median_aggregation_series(
                data,
                question,
                spec.method,
                reputation_history=reputation_histories.get(spec.method),
                static_filter=static_filters.get((spec.method, spec.joined_before)),
            )

        if question_score_type == ScoreTypes.PEER:
            score, _coverage = score_peer(data, series, gm_series, gm_counts)
        elif question_score_type == ScoreTypes.BASELINE:
            score, _coverage = score_baseline(data, series)
        else:
            raise NotImplementedError(
                f"Unsupported score_type for interval scoring: "
                f"{question_score_type!r}"
            )
        totals[spec.label]["score"] += score
        totals[spec.label]["count"] += 1
        totals[spec.label]["scores"].append(score)


# Parallel (--workers > 1) scoring ###########################################
# Each worker process scores its own questions independently and returns
# only a small per-label totals dict to merge back in the parent - never
# the (potentially large) QuestionScoringData itself, keeping inter-process
# payloads tiny. Run config that's constant for the whole batch (in
# particular reputation_histories, which can be large) is sent once via the
# pool's initializer/initargs (pickled once per *worker process*), not via
# per-task arguments (which would re-pickle it on every single question).

_worker_config: dict | None = None


def _init_worker(
    score_type: str,
    specs: list[AggregationSpec],
    rebuild_cache: bool,
    sample_timesteps: bool,
    reputation_histories: dict[str, ReputationArrays],
    static_filters: dict[StaticFilterKey, set[int]],
) -> None:
    global _worker_config
    # Forked workers inherit the parent's already-open DB connection(s),
    # which aren't safe to share across processes - force each worker to
    # establish its own on first use instead.
    from django.db import connections

    connections.close_all()
    _worker_config = {
        "score_type": score_type,
        "specs": specs,
        "rebuild_cache": rebuild_cache,
        "sample_timesteps": sample_timesteps,
        "reputation_histories": reputation_histories,
        "static_filters": static_filters,
    }


def _score_question_worker(question_id: int) -> dict[str, dict] | None:
    """Runs inside a worker process (see _init_worker for the per-process
    config this reads). Returns None (after logging) instead of raising, so
    one bad question doesn't take down the whole pool - mirrors the
    sequential loop's per-question try/except."""
    config = _worker_config
    assert config is not None, "_score_question_worker called before _init_worker"
    try:
        question = Question.objects.get(id=question_id)
        question_score_type = (
            question.default_score_type
            if config["score_type"] == "default"
            else config["score_type"]
        )
        totals = {
            spec.label: {"score": 0.0, "count": 0, "scores": []}
            for spec in config["specs"]
        }
        _score_question(
            question,
            question_score_type,
            config["specs"],
            totals,
            config["rebuild_cache"],
            config["sample_timesteps"],
            config["reputation_histories"],
            config["static_filters"],
        )
        return totals
    except Exception:
        logger.exception("Failed to evaluate question %s - skipping", question_id)
        return None


class Command(BaseCommand):
    help = """
    Rapid-iteration benchmark: evaluate one or more aggregation methods
    against already-resolved questions and report their summed/averaged
    score (peer, by default) - meant as a quick feedback loop for tuning
    aggregation parameters (e.g. via scipy.optimize) rather than a
    production scoring path.

    Bypasses evaluate_question/get_aggregation_history entirely (see
    scoring/fast_scoring.py): every forecast is reduced to a single float -
    its PMF value at the question's resolution bucket - once, and all
    aggregation/scoring math runs on compact (num_forecasters,
    num_timesteps) arrays instead of full PMF/CDF vectors at every
    timestep. Only valid for mean-based methods on any question type, or
    median-based methods (recency_weighted, unweighted) when
    multiple_choice questions are excluded - see --exclude-question-type.
    """

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--seed",
            type=int,
            default=None,
            help="Random seed used when --question-count samples a subset of "
            "eligible questions, for repeatable runs.",
        )
        parser.add_argument(
            "--question-count",
            type=int,
            default=None,
            help="If set, randomly sample this many eligible questions instead "
            "of using all of them - for fast iteration. Default: use all "
            "eligible questions.",
        )
        parser.add_argument(
            "--aggregation-method",
            dest="aggregation_methods",
            action="append",
            default=None,
            help="Aggregation method to evaluate (repeatable, e.g. "
            "--aggregation-method single_aggregation --aggregation-method "
            "year_performance). Valid choices: "
            f"{', '.join(VALID_AGGREGATION_METHODS)}. Default: "
            f"{', '.join(DEFAULT_AGGREGATION_METHODS)}. For a grid search, "
            "attach extra comma-separated parameters to run several "
            "variants of the same method in one invocation - each gets its "
            "own row in the report, labeled with the full spec string: "
            "'single_aggregation,0.5,6.0' (per-spec a,b, repeatable with "
            "different values), 'spot_sensitive,0.5,6.0' or "
            "'spot_sensitive,0.5,6.0,8.0' (per-spec a,b and an optional "
            "b_spot - defaults to b), or 'joined_before_date,2024-01-01' "
            "(per-spec joined_before cutoff).",
        )
        parser.add_argument(
            "--exclude-question-type",
            dest="exclude_question_types",
            action="append",
            default=None,
            help="Question type to exclude from the eligible pool (repeatable). "
            f"Valid choices: {', '.join(VALID_QUESTION_TYPES)}. Median-based "
            "aggregation methods (e.g. recency_weighted, unweighted) require "
            "multiple_choice to be excluded - their median renormalization "
            "needs the full PMF, which this fast path doesn't retain.",
        )
        parser.add_argument(
            "--score-type",
            default="default",
            choices=[c.value for c in ScoreTypes] + ["default"],
            help="Score type to compute. 'default' (the default) scores each "
            "question using its own default_score_type field instead of one "
            "fixed type for every question.",
        )
        parser.add_argument(
            "--min-forecasters",
            type=int,
            default=8,
            help="Minimum number of forecasters a question must have to be "
            "included (default: 8).",
        )
        parser.add_argument(
            "--rebuild-cache",
            action="store_true",
            default=False,
            help="Ignore any cached per-question data and rebuild it from the "
            "database (use after changing the PMF-reduction logic itself, or "
            "if a question's forecasts have changed).",
        )
        parser.add_argument(
            "--sample-timesteps",
            action="store_true",
            default=False,
            help=f"For questions with a dense timestep grid (many forecast "
            f"starts/ends), evenly subsample it down to at most "
            f"{MAX_SAMPLED_TIMESTEPS} points before scoring - trades score "
            "precision for speed, similar in spirit to how minimize_history "
            "subsamples a display timeline. Has no effect on spot scoring "
            "(already a single point). Default: use the full grid.",
        )
        parser.add_argument(
            "--joined-before",
            type=str,
            default=None,
            help="ISO-8601 date/datetime cutoff (e.g. 2024-01-01) for the "
            "joined_before_date aggregation method - only forecasters who "
            "joined before this are included. Default for any "
            "joined_before_date spec that doesn't attach its own date (see "
            "--aggregation-method); required if none do.",
        )
        parser.add_argument(
            "--workers",
            type=int,
            default=None,
            help="Number of worker processes to score questions in parallel. "
            "Each question is scored independently, so this scales close to "
            "linearly with core count - useful for large runs. Each worker "
            "opens its own DB connection. Pass 1 to force sequential. "
            "Default: auto-detect and use all available CPU cores.",
        )
        parser.add_argument(
            "--a",
            type=float,
            default=0.5,
            help="Default decay/reputation blend exponent for "
            "reputation-weighted methods (single_aggregation, "
            "year_performance) - overridable per-spec, see "
            "--aggregation-method. Default: 0.5.",
        )
        parser.add_argument(
            "--b",
            type=float,
            default=6.0,
            help="Default outer exponent for reputation-weighted methods' "
            "weight formula - overridable per-spec, see "
            "--aggregation-method. Default: 6.0.",
        )

    def handle(self, *args, **options):

        seed = options["seed"]
        question_count = options["question_count"]
        score_type = options["score_type"]
        min_forecasters = options["min_forecasters"]
        exclude_question_types = options["exclude_question_types"] or []
        rebuild_cache = options["rebuild_cache"]
        sample_timesteps = options["sample_timesteps"]
        workers = options["workers"]
        workers_auto_detected = workers is None
        if workers is None:
            workers = _detect_max_workers()
        default_a = options["a"]
        default_b = options["b"]
        default_joined_before = _parse_joined_before(options["joined_before"])
        raw_specs = options["aggregation_methods"] or DEFAULT_AGGREGATION_METHODS
        specs = [_parse_aggregation_spec(raw) for raw in raw_specs]
        # Fill in each spec's a/b/b_spot/joined_before from the global
        # --a/--b/--joined-before defaults wherever it didn't attach its
        # own - after this, every spec is fully self-contained and
        # downstream code never needs to know about the global defaults
        # again. b_spot defaults to the spec's own *resolved* b (not a
        # separate global), so it must be filled in after a/b are.
        resolved_specs = []
        for spec in specs:
            resolved_a = spec.a if spec.a is not None else default_a
            resolved_b = spec.b if spec.b is not None else default_b
            resolved_specs.append(
                replace(
                    spec,
                    a=resolved_a,
                    b=resolved_b,
                    b_spot=spec.b_spot if spec.b_spot is not None else resolved_b,
                    joined_before=(
                        spec.joined_before
                        if spec.joined_before is not None
                        else default_joined_before
                    ),
                )
            )
        specs = resolved_specs

        self._validate_options(specs, exclude_question_types)

        question_ids = self._select_question_ids(
            min_forecasters=min_forecasters,
            question_count=question_count,
            seed=seed,
            exclude_question_types=exclude_question_types,
        )

        reputation_histories = self._preload_reputation_histories(question_ids, specs)
        static_filters = self._preload_static_filters(question_ids, specs)

        totals = {
            spec.label: {"score": 0.0, "count": 0, "scores": []} for spec in specs
        }

        total_questions = len(question_ids)
        eval_start = time.perf_counter()
        run_args = (
            question_ids,
            score_type,
            specs,
            rebuild_cache,
            sample_timesteps,
            reputation_histories,
            static_filters,
            totals,
            eval_start,
        )
        if workers > 1:
            self._run_parallel(*run_args, workers=workers)
        else:
            self._run_sequential(*run_args)

        self.stdout.write("")  # move past the in-place progress line
        if workers > 1:
            self.stdout.write(f"Scored with {workers} worker processes")
        self._print_settings(
            specs,
            seed=seed,
            question_count=question_count,
            score_type=score_type,
            min_forecasters=min_forecasters,
            exclude_question_types=exclude_question_types,
            rebuild_cache=rebuild_cache,
            sample_timesteps=sample_timesteps,
            workers=workers,
            workers_auto_detected=workers_auto_detected,
            default_a=default_a,
            default_b=default_b,
            default_joined_before=default_joined_before,
        )
        elapsed = time.perf_counter() - eval_start
        self._print_results(totals, elapsed, total_questions, score_type)

    def _run_sequential(
        self,
        question_ids: list[int],
        score_type: str,
        specs: list[AggregationSpec],
        rebuild_cache: bool,
        sample_timesteps: bool,
        reputation_histories: dict[str, ReputationArrays],
        static_filters: dict[StaticFilterKey, set[int]],
        totals: dict[str, dict],
        eval_start: float,
    ) -> None:
        total_questions = len(question_ids)
        questions = Question.objects.filter(id__in=question_ids)
        for i, question in enumerate(questions.iterator(), start=1):
            question_score_type = (
                question.default_score_type if score_type == "default" else score_type
            )
            try:
                _score_question(
                    question,
                    question_score_type,
                    specs,
                    totals,
                    rebuild_cache,
                    sample_timesteps,
                    reputation_histories,
                    static_filters,
                )
            except Exception:
                logger.exception(
                    "Failed to evaluate question %s - skipping", question.id
                )
            finally:
                self._report_progress(i, total_questions, eval_start)

    def _run_parallel(
        self,
        question_ids: list[int],
        score_type: str,
        specs: list[AggregationSpec],
        rebuild_cache: bool,
        sample_timesteps: bool,
        reputation_histories: dict[str, ReputationArrays],
        static_filters: dict[StaticFilterKey, set[int]],
        totals: dict[str, dict],
        eval_start: float,
        workers: int,
    ) -> None:
        total_questions = len(question_ids)
        # fork (the Linux default): workers inherit the parent's
        # already-loaded Django app registry, so there's no need to
        # bootstrap Django itself in _init_worker - just give each worker
        # its own DB connection.
        context = multiprocessing.get_context("fork")
        with ProcessPoolExecutor(
            max_workers=workers,
            mp_context=context,
            initializer=_init_worker,
            initargs=(
                score_type,
                specs,
                rebuild_cache,
                sample_timesteps,
                reputation_histories,
                static_filters,
            ),
        ) as executor:
            futures = [
                executor.submit(_score_question_worker, question_id)
                for question_id in question_ids
            ]
            for i, future in enumerate(as_completed(futures), start=1):
                result = future.result()
                if result is not None:
                    self._merge_totals(totals, result)
                self._report_progress(i, total_questions, eval_start)

    @staticmethod
    def _merge_totals(totals: dict[str, dict], delta: dict[str, dict]) -> None:
        for label, stats in delta.items():
            totals[label]["score"] += stats["score"]
            totals[label]["count"] += stats["count"]
            totals[label]["scores"].extend(stats["scores"])

    def _report_progress(self, completed: int, total: int, eval_start: float) -> None:
        elapsed = time.perf_counter() - eval_start
        avg_per_question = elapsed / completed
        eta = avg_per_question * (total - completed)
        self.stdout.write(
            f"\r  evaluating {completed}/{total}... "
            f"(elapsed: {elapsed:.1f}s, eta: {eta:.1f}s)",
            ending="",
        )
        self.stdout.flush()

    def _validate_options(
        self,
        specs: list[AggregationSpec],
        exclude_question_types: list[str],
    ) -> None:
        methods = {spec.method for spec in specs}

        invalid_methods = sorted(methods - set(VALID_AGGREGATION_METHODS))
        if invalid_methods:
            raise CommandError(
                f"Unknown aggregation method(s): {', '.join(invalid_methods)}. "
                f"Valid choices: {', '.join(VALID_AGGREGATION_METHODS)}"
            )

        invalid_types = sorted(set(exclude_question_types) - set(VALID_QUESTION_TYPES))
        if invalid_types:
            raise CommandError(
                f"Unknown question type(s): {', '.join(invalid_types)}. "
                f"Valid choices: {', '.join(VALID_QUESTION_TYPES)}"
            )

        median_methods = sorted(methods & MEDIAN_BASED_METHODS)
        if (
            median_methods
            and Question.QuestionType.MULTIPLE_CHOICE not in exclude_question_types
        ):
            raise CommandError(
                f"Median-based aggregation method(s) {', '.join(median_methods)} "
                "requested, but multiple_choice questions aren't excluded. "
                "Median aggregation's renormalization for multiple_choice needs "
                "the full PMF, which this fast path doesn't retain - add "
                "--exclude-question-type multiple_choice, or drop these methods."
            )

        missing_joined_before = any(
            spec.method == "joined_before_date" and spec.joined_before is None
            for spec in specs
        )
        if missing_joined_before:
            raise CommandError(
                "joined_before_date requires --joined-before <ISO date/datetime>, "
                "or a per-spec date via --aggregation-method "
                "'joined_before_date,<date>'."
            )

        unsupported_methods = sorted(methods - MEAN_BASED_METHODS - MEDIAN_BASED_METHODS)
        if unsupported_methods:
            raise CommandError(
                f"Aggregation method(s) {', '.join(unsupported_methods)} aren't "
                "supported by this fast scoring path yet."
            )

        duplicate_labels = sorted(
            {label for label in (spec.label for spec in specs) if
             sum(1 for spec in specs if spec.label == label) > 1}
        )
        if duplicate_labels:
            raise CommandError(
                f"Duplicate --aggregation-method spec(s): {', '.join(duplicate_labels)}. "
                "Each spec (including its parameters) must be unique."
            )

    def _gather_batch_forecaster_ids(self, question_ids: list[int]) -> list[int]:
        return list(
            Forecast.objects.filter(question_id__in=question_ids)
            .values_list("author_id", flat=True)
            .distinct()
        )

    def _preload_reputation_histories(
        self, question_ids: list[int], specs: list[AggregationSpec]
    ) -> dict[str, ReputationArrays]:
        """Fetches every reputation-weighted method's full user-reputation
        history once for the whole batch of questions, instead of once per
        question - the dominant cost otherwise, since the same active
        forecasters reappear across most questions. Keyed by base method
        (not spec label): the reputation values a/b blend into a weight
        don't depend on a/b themselves, so grid-search specs of the same
        method share one preloaded history."""
        methods_needing_reputation = sorted(
            {spec.method for spec in specs if spec.method in REPUTATION_WEIGHTED_CLASSES}
        )
        if not methods_needing_reputation:
            return {}

        user_ids = self._gather_batch_forecaster_ids(question_ids)
        # Bound the preload to what this batch actually needs - the latest
        # close time among its questions - rather than "now", which would
        # fetch a decade of irrelevant future scores for a batch of old
        # questions.
        end_time = Question.objects.filter(id__in=question_ids).aggregate(
            Max("scheduled_close_time")
        )["scheduled_close_time__max"]
        self.stdout.write(
            f"Preloading reputation history for {len(user_ids)} forecasters "
            f"({', '.join(methods_needing_reputation)})..."
        )

        # Methods that pull from the exact same underlying Reputation
        # records (e.g. "single_aggregation" and "spot_sensitive" both read
        # "average_peer_score" - SpotSensitiveReputationWeighted extends
        # PeerScoreReputationWeighted without overriding
        # get_reputation_history) share one preload instead of redundantly
        # querying/holding the same data once per method - each preload can
        # be millions of Reputation rows for a large batch, and duplicating
        # that per method (then again per --workers process) is exactly
        # what OOM-killed a run requesting several such methods at once.
        cache: dict[str, ReputationArrays] = {}
        result: dict[str, ReputationArrays] = {}
        for method in methods_needing_reputation:
            weighted_class = REPUTATION_WEIGHTED_CLASSES[method]
            cache_key = getattr(weighted_class, "reputation_type", None) or method
            if cache_key not in cache:
                cache[cache_key] = preload_reputation_history(
                    method, user_ids, end_time=end_time
                )
            result[method] = cache[cache_key]
        return result

    def _preload_static_filters(
        self, question_ids: list[int], specs: list[AggregationSpec]
    ) -> dict[StaticFilterKey, set[int]]:
        """Fetches every static-filter method's full qualifying user_id set
        once for the whole batch of questions, instead of once per question.
        Keyed by (method, joined_before): unlike reputation histories, a
        joined_before_date spec's *result* depends on its own date, so
        distinct dates from a grid search each need their own preload -
        metaculus_pros ignores joined_before entirely, so it always
        collapses to a single key regardless of how many specs use it."""
        filter_keys = sorted(
            {
                (spec.method, spec.joined_before)
                for spec in specs
                if spec.method in STATIC_FILTER_CLASSES
            },
            key=lambda k: (k[0], k[1] or datetime.min.replace(tzinfo=dt_timezone.utc)),
        )
        if not filter_keys:
            return {}

        user_ids = self._gather_batch_forecaster_ids(question_ids)
        self.stdout.write(
            f"Preloading static filters for {len(user_ids)} forecasters "
            f"({', '.join(sorted({method for method, _ in filter_keys}))})..."
        )
        return {
            (method, joined_before): preload_static_filter(
                method, user_ids, joined_before=joined_before
            )
            for method, joined_before in filter_keys
        }

    def _select_question_ids(
        self,
        min_forecasters: int,
        question_count: int | None,
        seed: int | None,
        exclude_question_types: list[str],
    ) -> list[int]:
        eligible = (
            Question.objects.filter_public()
            .filter(resolution__isnull=False)
            .exclude(resolution__in=UnsuccessfulResolutionType)
            .exclude(type__in=exclude_question_types)
            .annotate(num_forecasters=Count("user_forecasts__author_id", distinct=True))
            .filter(num_forecasters__gte=min_forecasters)
            # Deterministic order so --seed sampling below is actually
            # reproducible - without it, Postgres row order for an unordered
            # query isn't guaranteed to be stable across runs even when the
            # underlying data hasn't changed, and random.Random.sample's
            # result depends on input order, not just input contents.
            # .order_by("id")
            .order_by("-scheduled_close_time", "id")
        )
        question_ids = list(eligible.values_list("id", flat=True))
        total_eligible = len(question_ids)

        if question_count is not None and question_count < total_eligible:
            rng = random.Random(seed)
            question_ids = rng.sample(question_ids, question_count)

        self.stdout.write(
            f"Selected {len(question_ids)} of {total_eligible} eligible questions"
        )
        return question_ids

    def _print_settings(
        self,
        specs: list[AggregationSpec],
        *,
        seed: int | None,
        question_count: int | None,
        score_type: str,
        min_forecasters: int,
        exclude_question_types: list[str],
        rebuild_cache: bool,
        sample_timesteps: bool,
        workers: int,
        workers_auto_detected: bool,
        default_a: float,
        default_b: float,
        default_joined_before: datetime | None,
    ) -> None:
        rows = [
            ("seed", seed if seed is not None else "none (non-reproducible sample)"),
            ("question_count", question_count if question_count is not None else "all eligible"),
            ("score_type", score_type),
            ("min_forecasters", min_forecasters),
            ("exclude_question_types", ", ".join(exclude_question_types) or "none"),
            ("rebuild_cache", rebuild_cache),
            ("sample_timesteps", f"{sample_timesteps} (max {MAX_SAMPLED_TIMESTEPS})"),
            (
                "workers",
                f"{workers} (auto-detected)" if workers_auto_detected else workers,
            ),
            ("default a / b", f"{default_a} / {default_b}"),
            (
                "default joined_before",
                default_joined_before.date().isoformat() if default_joined_before else "none",
            ),
        ]
        key_width = max(len(key) for key, _ in rows) + 2

        self.stdout.write("=" * 60)
        self.stdout.write("Benchmark settings")
        self.stdout.write("=" * 60)
        for key, value in rows:
            self.stdout.write(f"  {key:<{key_width}}{value}")
        self.stdout.write(f"  aggregation methods ({len(specs)}):")
        for spec in specs:
            self.stdout.write(f"    - {spec.label}")
        self.stdout.write("=" * 60)
        self.stdout.write("")

    def _print_results(
        self,
        totals: dict[str, dict],
        elapsed: float,
        num_questions: int,
        score_type: str,
    ) -> None:
        score_type_label = (
            "default (per-question default_score_type)"
            if score_type == "default"
            else score_type
        )
        self.stdout.write("")
        self.stdout.write(
            f"Results across {num_questions} questions, score_type={score_type_label} "
            f"(elapsed: {elapsed:.2f}s)"
        )
        label_width = max([len("method")] + [len(label) for label in totals]) + 2
        header = (
            f"{'#':>3} {'method':<{label_width}}{'total_score':>14}{'avg_score':>12}"
            f"{'vs_best':>10}{'p1_score':>12}{'p10_score':>12}"
        )
        self.stdout.write(header)
        self.stdout.write("-" * len(header))

        ranked = sorted(totals.items(), key=lambda kv: kv[1]["score"], reverse=True)
        best_avg_score = None
        for rank, (label, stats) in enumerate(ranked, start=1):
            count = stats["count"] or 1
            avg_score = stats["score"] / count
            scores = stats["scores"]
            if best_avg_score is None:
                best_avg_score = avg_score
            # 1st/10th percentile: how bad the worst-case tail gets, not just
            # the average - lets a method with a great mean but occasional
            # catastrophic misses be told apart from one that's consistently
            # mediocre.
            p1_score = np.percentile(scores, 1) if scores else float("nan")
            p10_score = np.percentile(scores, 10) if scores else float("nan")
            self.stdout.write(
                f"{rank:>3} {label:<{label_width}}{stats['score']:>14.2f}"
                f"{avg_score:>12.4f}{avg_score - best_avg_score:>10.4f}"
                f"{p1_score:>12.4f}{p10_score:>12.4f}"
            )
