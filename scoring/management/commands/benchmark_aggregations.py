import argparse
import logging
import multiprocessing
import os
import random
import re
import textwrap
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import dataclass, field, replace
from datetime import datetime, timezone as dt_timezone
from typing import Any

import numpy as np
from django.core.management.base import (
    BaseCommand,
    CommandError,
    CommandParser,
    DjangoHelpFormatter,
)
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
    WEIGHT_CLASS_PARAMS,
    WEIGHT_CLASS_REGISTRY,
    ReputationArrays,
    compute_aggregation_series,
    compute_composed_aggregation_series,
    compute_geometric_mean_series,
    compute_median_aggregation_series,
    compute_spot_scores,
    get_or_build_question_data,
    preload_class_reputation_history,
    preload_reputation_history,
    preload_reputation_history_by_type,
    preload_static_filter,
    preload_static_filter_by_class,
    score_baseline,
    score_peer,
    subsample_timesteps,
)
from scoring.models import Reputation
from utils.the_math.aggregations import (
    AGGREGATIONS,
    TIME_DECAY_REGISTRY,
    DecayReputationWeighted,
    Filtered,
    ReputationWeighted,
)

logger = logging.getLogger(__name__)

VALID_AGGREGATION_METHODS = [agg.method for agg in AGGREGATIONS]
DEFAULT_AGGREGATION_METHODS = [
    "unweighted",
    "recency_weighted",
    "single_aggregation",
]
VALID_QUESTION_TYPES = [c.value for c in Question.QuestionType]
VALID_REPUTATION_TYPES = [c.value for c in Reputation.ReputationTypes]
SPOT_SCORE_TYPES = {"spot_peer", "spot_baseline"}
StaticFilterKey = tuple[str, datetime | None]

# --method's grammar is "key=value|key=value|..." (or a bare pre-established
# method name, shorthand for "name=<that>"). Every key may be given by its
# full name or a short alias, so a grid search over several params doesn't
# get unreasonably long - e.g. "name=single_aggregation|t=linear|a=0.5".
KEY_ALIASES: dict[str, str] = {
    "name": "name",
    "n": "name",
    "a": "a",
    "b": "b",
    "b_spot": "b_spot",
    "bs": "b_spot",
    "pre_spot_decay": "pre_spot_decay",
    "psd": "pre_spot_decay",
    "joined_before": "joined_before",
    "jb": "joined_before",
    "time_decay": "time_decay",
    "t": "time_decay",
    "td": "time_decay",
    "weight": "weight",
    "w": "weight",
    "reputation_type": "reputation_type",
    "r": "reputation_type",
    "aggregator": "aggregator",
    "ag": "aggregator",
    "label": "label",
    "l": "label",
}
_CANONICAL_TO_ALIASES: dict[str, list[str]] = {}
for _alias, _canonical in KEY_ALIASES.items():
    _CANONICAL_TO_ALIASES.setdefault(_canonical, []).append(_alias)
# e.g. "a, ag/aggregator, b, bs/b_spot, jb/joined_before, l/label, n/name,
# r/reputation_type, t/td/time_decay, w/weight" - shortest alias first.
VALID_KEYS_HELP = ", ".join(
    "/".join(sorted(aliases, key=len))
    for _, aliases in sorted(_CANONICAL_TO_ALIASES.items())
)


def _help(text: str, width: int = 78) -> str:
    """Wraps a plain-prose --help string to `width` columns with real
    newlines. _MethodHelpFormatter (see below) disables argparse's own
    per-argument wrapping for this whole parser - that's needed for
    --method's hand-formatted grammar reference, but as a side effect it'd
    otherwise turn every other argument's help text into one giant
    unwrapped line - so every plain-prose help string needs to go through
    this instead."""
    return textwrap.fill(text, width=width)


def _wrapped_choices(values, indent: str = "     ", width: int = 78) -> str:
    """Wraps a long comma-separated list of choices onto multiple indented
    lines, for embedding in --method's --help text - argparse's own
    line-wrapping is disabled there (see _MethodHelpFormatter) since it
    would otherwise collapse all the manually-placed newlines/indentation
    used to make that grammar readable, so long lists need to be wrapped
    by hand instead."""
    return textwrap.fill(
        ", ".join(values), width=width, initial_indent=indent, subsequent_indent=indent
    )


class _MethodHelpFormatter(DjangoHelpFormatter, argparse.RawTextHelpFormatter):
    """DjangoHelpFormatter (keeps command-specific args listed before the
    common ones) plus RawTextHelpFormatter (preserves --method's own
    hand-formatted newlines/indentation instead of re-wrapping/collapsing
    them to fit the terminal width, which is what turned it into an
    unreadable wall of text)."""


AGGREGATOR_ALIASES: dict[str, str] = {
    "mean": "MeanAggregatorMixin",
    "median": "MedianAggregatorMixin",
}

# Extra key=value params each pre-established method accepts on top of
# name=/label= - anything else is rejected. Methods not listed here (e.g.
# unweighted, recency_weighted, the medal/pro methods) accept none.
NAMED_METHOD_PARAMS: dict[str, frozenset[str]] = {
    method: frozenset({"a", "b", "time_decay", "pre_spot_decay", "b_spot"})
    for method in DECAYED_REPUTATION_CLASSES
}
NAMED_METHOD_PARAMS["joined_before_date"] = frozenset({"joined_before"})


@dataclass(frozen=True)
class AggregationSpec:
    """One --method entry using a pre-established aggregation name (a
    "name=<method>|..." spec, or a bare method name as shorthand for that
    with no extra params) - the extra key=value params (a, b, b_spot,
    pre_spot_decay, time_decay, joined_before) support a grid search over
    them (e.g. single_aggregation's a/b) by running several specs in one
    invocation instead of one full run per combination. See
    NAMED_METHOD_PARAMS for which params each method accepts.

    `method` is the real aggregation method name, used for all of
    fast_scoring's dispatch logic. `label` is the raw spec string (or an
    explicit label= override) - used as the totals dict key and shown in
    the report, so grid-search variants of the same method stay
    distinguishable from each other and from a plain, unparameterized run.
    """

    method: str
    label: str
    a: float | None = None
    b: float | None = None
    b_spot: float | None = None
    joined_before: datetime | None = None
    time_decay: str | None = None
    pre_spot_decay: bool = False


@dataclass(frozen=True)
class WeightClassUse:
    """One weight class within a composed --method spec, e.g. the
    "DecayReputationWeighted:a=0.7,b=10.0,pre_spot_decay=true,b_spot=9.5,
    time_decay=old_metaculus" in a "weight=..." field. `params` holds only
    the params resolved so far (explicitly given, or filled from the global
    --joined-before default) - see WEIGHT_CLASS_PARAMS for each class's
    accepted param names."""

    name: str
    params: dict[str, float | datetime | str | bool | None] = field(
        default_factory=dict
    )


@dataclass(frozen=True)
class ComposedMethodSpec:
    """One --method entry that composes an aggregation on the fly from an
    aggregator + a list of weight classes (one or more weight=... fields),
    rather than referencing a pre-established name - see --method's help
    text for the full syntax. `label` is the raw spec string (or an
    explicit label= override) - opaque report/totals-key name, not parsed
    further.

    There's no spec-wide reputation_type: it's a per-weight-class param (see
    WEIGHT_CLASS_PARAMS["DecayReputationWeighted"]), since it's only
    meaningful attached to a specific DecayReputationWeighted instance - a
    single spec can combine several, each reading its own independent
    Reputation type (e.g. one decayed on average_peer_score, another on
    year_performance)."""

    label: str
    aggregator: str
    weight_classes: list[WeightClassUse]


MethodSpec = AggregationSpec | ComposedMethodSpec


def _parse_joined_before(joined_before_str: str | None) -> datetime | None:
    if not joined_before_str:
        return None
    parsed = datetime.fromisoformat(joined_before_str)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt_timezone.utc)
    return parsed


def _resolve_key(raw_key: str, raw: str) -> str:
    """Resolves one key=value field's key (full name or alias, see
    KEY_ALIASES) to its canonical name."""
    key = KEY_ALIASES.get(raw_key)
    if key is None:
        raise CommandError(
            f"{raw!r}: unknown key {raw_key!r}. Valid keys (full name or "
            f"alias): {VALID_KEYS_HELP}"
        )
    return key


_BOOL_VALUES = {"true": True, "false": False}


def _parse_param_value(key: str, raw_value: str, raw: str) -> Any:
    """Parses one param's raw string value according to what `key` expects -
    shared between a named spec's top-level fields and a composed weight
    class's own sub-params, since both draw from the same key set (a, b,
    b_spot, pre_spot_decay, time_decay, joined_before, reputation_type -
    the latter only within a weight= token, see WEIGHT_CLASS_PARAMS).
    Returns Any rather than a precise union: which concrete type comes back
    depends on `key`, and the caller already knows/enforces that via
    NAMED_METHOD_PARAMS/WEIGHT_CLASS_PARAMS."""
    if key == "joined_before":
        return _parse_joined_before(raw_value)
    if key == "time_decay":
        if raw_value not in TIME_DECAY_REGISTRY:
            raise CommandError(
                f"{raw!r}: unknown time_decay {raw_value!r}. Valid choices: "
                f"{', '.join(sorted(TIME_DECAY_REGISTRY))}"
            )
        return raw_value
    if key == "reputation_type":
        if raw_value not in VALID_REPUTATION_TYPES:
            raise CommandError(
                f"{raw!r}: unknown reputation_type {raw_value!r}. Valid "
                f"choices: {', '.join(VALID_REPUTATION_TYPES)}"
            )
        return raw_value
    if key == "pre_spot_decay":
        lowered = raw_value.strip().lower()
        if lowered not in _BOOL_VALUES:
            raise CommandError(
                f"{raw!r}: pre_spot_decay must be true/false, got {raw_value!r}"
            )
        return _BOOL_VALUES[lowered]
    try:
        return float(raw_value)
    except ValueError as e:
        raise CommandError(f"{raw!r}: {key!r} must be a number ({e})")


def _split_fields(raw: str) -> tuple[dict[str, str], list[str]]:
    """Splits one --method value into (single-valued fields, weight= values)
    - weight is the only key allowed to repeat, since a composed spec can
    combine multiple weight classes. Raises on an unknown key, a malformed
    field (no '='), or any non-weight key given more than once."""
    fields: dict[str, str] = {}
    weight_tokens: list[str] = []
    for part in raw.split("|"):
        part = part.strip()
        if not part:
            raise CommandError(f"{raw!r}: empty field in a '|'-delimited spec")
        if "=" not in part:
            raise CommandError(
                f"{raw!r}: malformed field {part!r} - expected key=value"
            )
        raw_key, raw_value = (s.strip() for s in part.split("=", 1))
        key = _resolve_key(raw_key, raw)
        if key == "weight":
            weight_tokens.append(raw_value)
            continue
        if key in fields:
            raise CommandError(f"{raw!r}: key {key!r} given more than once")
        fields[key] = raw_value
    return fields, weight_tokens


def _parse_named_spec(fields: dict[str, str], raw: str) -> AggregationSpec:
    """Parses a --method spec with a name= key (a pre-established
    aggregation name, optionally with extra key=value params for a grid
    search - see NAMED_METHOD_PARAMS for what each method accepts)."""
    method = fields["name"]
    if method not in VALID_AGGREGATION_METHODS:
        raise CommandError(
            f"{raw!r}: unknown method {method!r}. Valid choices: "
            f"{', '.join(VALID_AGGREGATION_METHODS)}"
        )
    allowed = NAMED_METHOD_PARAMS.get(method, frozenset())
    unsupported = set(fields) - {"name", "label"} - allowed
    if unsupported:
        raise CommandError(
            f"{raw!r}: {method!r} doesn't accept "
            f"{', '.join(sorted(unsupported))} - valid extra param(s): "
            f"{', '.join(sorted(allowed)) or 'none'}"
        )
    a = _parse_param_value("a", fields["a"], raw) if "a" in fields else None
    b = _parse_param_value("b", fields["b"], raw) if "b" in fields else None
    b_spot = (
        _parse_param_value("b_spot", fields["b_spot"], raw)
        if "b_spot" in fields
        else None
    )
    time_decay = (
        _parse_param_value("time_decay", fields["time_decay"], raw)
        if "time_decay" in fields
        else None
    )
    joined_before = (
        _parse_param_value("joined_before", fields["joined_before"], raw)
        if "joined_before" in fields
        else None
    )
    pre_spot_decay = (
        _parse_param_value("pre_spot_decay", fields["pre_spot_decay"], raw)
        if "pre_spot_decay" in fields
        else False
    )
    if pre_spot_decay and b_spot is None:
        raise CommandError(
            f"{raw!r}: pre_spot_decay=true requires b_spot"
        )
    return AggregationSpec(
        method=method,
        label=fields.get("label", raw),
        a=a,
        b=b,
        b_spot=b_spot,
        joined_before=joined_before,
        time_decay=time_decay,
        pre_spot_decay=pre_spot_decay,
    )


def _parse_weight_token(raw_value: str, raw: str) -> WeightClassUse:
    """Parses one weight=<value> field, e.g.
    "DecayReputationWeighted:reputation_type=peer_threshold_-20_coverage_50,
    a=0.7,b=10.0,pre_spot_decay=true,b_spot=9.5,time_decay=old_metaculus" or
    a bare "RecencyWeighted" (no params). reputation_type is required
    whenever the class needs one (see _weight_class_needs_reputation_type) -
    it's scoped to this weight-class instance rather than the whole spec, so
    a single composed spec can combine several DecayReputationWeighted
    instances each reading a different Reputation type.

    The class name is split from its params on the first ':' or ';'
    (interchangeable), and params are split on any run of ','/whitespace -
    so a long --method value can be spread across multiple lines/indented
    for readability (one param per line, with or without a trailing comma)
    without changing its meaning. No valid value in this grammar (numbers,
    dates, enum-like type/class names) legitimately contains whitespace, so
    treating it as an interchangeable separator is unambiguous."""
    split = re.split(r"[:;]", raw_value, maxsplit=1)
    class_name = split[0].strip()
    param_str = split[1] if len(split) > 1 else ""
    if class_name not in WEIGHT_CLASS_REGISTRY:
        raise CommandError(
            f"{raw!r}: unknown weight class {class_name!r}. Valid choices: "
            f"{', '.join(sorted(WEIGHT_CLASS_REGISTRY))}"
        )
    allowed = WEIGHT_CLASS_PARAMS[class_name]
    params: dict[str, float | datetime | str | bool | None] = {}
    for pair in re.split(r"[,\s]+", param_str):
        pair = pair.strip()
        if not pair:
            continue
        if "=" not in pair:
            raise CommandError(
                f"{raw!r}: malformed weight param {pair!r} in {raw_value!r} "
                "- expected key=value"
            )
        raw_key, raw_param_value = (s.strip() for s in pair.split("=", 1))
        key = _resolve_key(raw_key, raw)
        if key not in allowed:
            raise CommandError(
                f"{raw!r}: {class_name!r} doesn't accept {key!r} - valid "
                f"param(s): {', '.join(sorted(allowed)) or 'none'}"
            )
        if key in params:
            raise CommandError(f"{raw!r}: {class_name!r}'s {key!r} given more than once")
        params[key] = _parse_param_value(key, raw_param_value, raw)
    if params.get("pre_spot_decay") and params.get("b_spot") is None:
        raise CommandError(
            f"{raw!r}: {class_name!r}: pre_spot_decay=true requires b_spot"
        )
    if _weight_class_needs_reputation_type(class_name) and "reputation_type" not in params:
        raise CommandError(
            f"{raw!r}: {class_name!r} requires reputation_type (r=<type>) - "
            f"valid choices: {', '.join(VALID_REPUTATION_TYPES)}"
        )
    return WeightClassUse(name=class_name, params=params)


def _parse_composed_spec(
    fields: dict[str, str], weight_tokens: list[str], raw: str
) -> ComposedMethodSpec:
    """Parses a --method spec with weight= keys - composing an ad hoc
    aggregation from an aggregator + a list of weight classes, rather than
    referencing a pre-established name. reputation_type isn't a top-level
    key here - it's scoped to whichever weight= token needs one (see
    _parse_weight_token)."""
    if not weight_tokens:
        raise CommandError(
            f"{raw!r}: a composed spec needs at least one weight=<class> entry"
        )
    aggregator_key = fields.get("aggregator", "mean")
    aggregator = AGGREGATOR_ALIASES.get(aggregator_key)
    if aggregator is None:
        raise CommandError(
            f"{raw!r}: unknown aggregator {aggregator_key!r}. Valid choices: "
            f"{', '.join(sorted(AGGREGATOR_ALIASES))}"
        )
    unsupported = set(fields) - {"aggregator", "label"}
    if unsupported:
        raise CommandError(
            f"{raw!r}: composed specs don't accept top-level "
            f"{', '.join(sorted(unsupported))} - attach per-weight-class "
            "params to a weight=<class>:key=value,... entry instead"
        )
    weight_classes = [_parse_weight_token(token, raw) for token in weight_tokens]
    return ComposedMethodSpec(
        label=fields.get("label", raw),
        aggregator=aggregator,
        weight_classes=weight_classes,
    )


def _parse_method_spec(raw: str) -> MethodSpec:
    """Parses one --method value: "key=value|key=value|..." (aliases
    allowed for every key - see KEY_ALIASES), or a bare pre-established
    method name as shorthand for "name=<that>" (e.g. plain 'unweighted').
    A spec is "named" if it has a name= key, "composed" if it has
    reputation_type=/weight= - see --method's help text for the full
    grammar."""
    raw = raw.strip()
    if "|" not in raw and "=" not in raw:
        return _parse_named_spec({"name": raw}, raw)

    fields, weight_tokens = _split_fields(raw)
    has_name = "name" in fields
    has_composed = "reputation_type" in fields or bool(weight_tokens)
    if has_name and has_composed:
        raise CommandError(
            f"{raw!r}: can't combine name= (a pre-established method) with "
            "reputation_type=/weight= (a composed spec) - use one or the other"
        )
    if not has_name and not has_composed:
        raise CommandError(
            f"{raw!r}: needs either name=<method> or reputation_type=/"
            "weight=<class> - see --method's help text"
        )
    if has_name:
        return _parse_named_spec(fields, raw)
    return _parse_composed_spec(fields, weight_tokens, raw)


def _weight_class_needs_reputation_type(name: str) -> bool:
    return issubclass(WEIGHT_CLASS_REGISTRY[name], DecayReputationWeighted)


def _weight_class_needs_class_reputation(name: str) -> bool:
    cls = WEIGHT_CLASS_REGISTRY[name]
    return issubclass(cls, ReputationWeighted) and not issubclass(
        cls, DecayReputationWeighted
    )


def _weight_class_needs_static_filter(name: str) -> bool:
    return issubclass(WEIGHT_CLASS_REGISTRY[name], Filtered)


def _composed_specs(specs: list[MethodSpec]) -> list[ComposedMethodSpec]:
    return [spec for spec in specs if isinstance(spec, ComposedMethodSpec)]


def _resolve_composed_spec(
    spec: ComposedMethodSpec,
    default_joined_before: datetime | None,
) -> ComposedMethodSpec:
    """Fills in each weight class's joined_before from the global
    --joined-before default wherever it didn't attach its own date -
    mirrors AggregationSpec's resolution for named specs.

    a/b/b_spot/time_decay are deliberately *not* defaulted here: they're only
    ever meaningful attached to a specific weight-class token (see
    _parse_weight_token), and each one's own class-level default (0.5, 6.0,
    b, "exponential_lifetime" respectively) already applies via
    compute_weight_class_array's `params.get(...)` calls whenever a spec
    leaves it unset - there is no separate, run-wide default to resolve
    against."""
    resolved = []
    for wc in spec.weight_classes:
        params = dict(wc.params)
        if "joined_before" in WEIGHT_CLASS_PARAMS[wc.name] and "joined_before" not in params:
            params["joined_before"] = default_joined_before
        resolved.append(WeightClassUse(name=wc.name, params=params))
    return replace(spec, weight_classes=resolved)


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
    specs: list[MethodSpec],
    totals: dict[str, dict],
    rebuild_cache: bool,
    sample_timesteps: bool,
    reputation_histories: dict[str, ReputationArrays],
    static_filters: dict[StaticFilterKey, set[int]],
    reputation_by_type: dict[str, ReputationArrays],
    class_reputations: dict[str, ReputationArrays],
    composed_static_filters: dict[StaticFilterKey, set[int]],
) -> None:
    """Scores one question against every requested method spec,
    accumulating into `totals` (keyed by spec.label) in place. Module-level
    (not a Command method) so it can run identically in-process (--workers
    1) or inside a worker process (--workers > 1, via _score_question_worker
    below)."""
    if question_score_type in SPOT_SCORE_TYPES:
        for spec in specs:
            if isinstance(spec, ComposedMethodSpec):
                raise NotImplementedError(
                    f"Spot scoring isn't implemented for composed --method "
                    f"specs ({spec.label!r}) - use interval (peer/baseline) "
                    "scoring for these instead."
                )
            score, _coverage = compute_spot_scores(
                question,
                spec.method,
                question_score_type,
                a=spec.a,
                b=spec.b,
                time_decay=spec.time_decay,
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
        if isinstance(spec, ComposedMethodSpec):
            weight_class_tuples = [(wc.name, wc.params) for wc in spec.weight_classes]
            spec_static_filters = {
                wc.name: composed_static_filters.get(
                    (wc.name, wc.params.get("joined_before"))
                )
                for wc in spec.weight_classes
            }
            series = compute_composed_aggregation_series(
                data,
                question,
                spec.aggregator,
                weight_class_tuples,
                reputation_by_type=reputation_by_type,
                class_reputations=class_reputations,
                static_filter_members=spec_static_filters,
            )
        elif spec.method in MEAN_BASED_METHODS:
            series = compute_aggregation_series(
                data,
                question,
                spec.method,
                a=spec.a,
                b=spec.b,
                b_spot=spec.b_spot,
                time_decay=spec.time_decay,
                pre_spot_decay=spec.pre_spot_decay,
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
# particular the preloaded reputation dicts, which can be large) is sent
# once via the pool's initializer/initargs (pickled once per *worker
# process*), not via per-task arguments (which would re-pickle it on every
# single question).

_worker_config: dict | None = None


def _init_worker(
    score_type: str,
    specs: list[MethodSpec],
    rebuild_cache: bool,
    sample_timesteps: bool,
    reputation_histories: dict[str, ReputationArrays],
    static_filters: dict[StaticFilterKey, set[int]],
    reputation_by_type: dict[str, ReputationArrays],
    class_reputations: dict[str, ReputationArrays],
    composed_static_filters: dict[StaticFilterKey, set[int]],
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
        "reputation_by_type": reputation_by_type,
        "class_reputations": class_reputations,
        "composed_static_filters": composed_static_filters,
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
            config["reputation_by_type"],
            config["class_reputations"],
            config["composed_static_filters"],
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
        # --method's help text below relies on real newlines/indentation to
        # stay readable (it documents a small grammar) - the default
        # formatter re-wraps and collapses all of that to fit the terminal
        # width, which is what made it unreadable in the first place.
        parser.formatter_class = _MethodHelpFormatter
        parser.add_argument(
            "--seed",
            type=int,
            default=None,
            help=_help(
                "Random seed used when --question-count samples a subset of "
                "eligible questions, for repeatable runs."
            ),
        )
        parser.add_argument(
            "--question-count",
            type=int,
            default=None,
            help=_help(
                "If set, randomly sample this many eligible questions instead "
                "of using all of them - for fast iteration. Default: use all "
                "eligible questions."
            ),
        )
        parser.add_argument(
            "--method",
            dest="methods",
            action="append",
            default=None,
            help=(
                "Aggregation method to evaluate (repeatable).\n"
                "\n"
                "Grammar: key=value|key=value|... - or a bare pre-established\n"
                "method name as shorthand for name=<that> (e.g. plain\n"
                "'unweighted'). Every key also accepts a short alias:\n"
                f"{_wrapped_choices(VALID_KEYS_HELP.split(', '))}\n"
                "Whitespace/newlines around any key=value or '|' are ignored, and\n"
                "a weight=<class> token's own params (see form 2 below) may be\n"
                "separated by whitespace/newlines instead of ',' - so a long spec\n"
                "can be spread across multiple indented lines for readability,\n"
                "e.g. quoted with one key per line. A weight=<class>'s params\n"
                "start after a ':' or ';' (interchangeable).\n"
                "\n"
                "There are no global a/b/time_decay defaults - each falls back\n"
                "to its own class-level default (a=0.5, b=6.0,\n"
                "time_decay=exponential_lifetime - DecayReputationWeighted's\n"
                "own defaults) whenever left unset.\n"
                "\n"
                "Two spec kinds:\n"
                "\n"
                "  1) name=<method> - a pre-established name.\n"
                "     Valid choices:\n"
                f"{_wrapped_choices(VALID_AGGREGATION_METHODS)}\n"
                "     Extra params accepted for a grid search (single_aggregation\n"
                "     only - every other decay/reputation-blend combination is\n"
                "     reached via a composed spec, form 2 below):\n"
                "       a, b            - the decay/reputation blend exponents\n"
                "       time_decay      - the tau_i formula. Valid choices:\n"
                f"{_wrapped_choices(sorted(TIME_DECAY_REGISTRY), indent=' ' * 25)}\n"
                "       pre_spot_decay  - spot-sensitive mode (default false):\n"
                "                         for any timestep strictly before the\n"
                "                         question's spot scoring time, uses a\n"
                "                         flat a=0 and b_spot instead of a/b.\n"
                "                         Requires b_spot when true.\n"
                "       b_spot          - required iff pre_spot_decay=true\n"
                "       joined_before   - joined_before_date only\n"
                "                         (an ISO-8601 date/datetime)\n"
                "     Examples:\n"
                "       name=single_aggregation|a=0.5|b=6.0|t=linear\n"
                "       name=single_aggregation|psd=true|b_spot=7.0\n"
                "\n"
                "  2) [aggregator=<agg>]|weight=<class>[|weight=<class>...]\n"
                "     - a composed spec built from scratch.\n"
                "     aggregator:      'mean' (default) or 'median'\n"
                "     weight:          repeats (one per class, combined\n"
                "                      multiplicatively). Class name from:\n"
                f"{_wrapped_choices(sorted(WEIGHT_CLASS_REGISTRY), indent=' ' * 23)}\n"
                "                      optionally suffixed\n"
                "                      ':key=value,key=value,...' for that\n"
                "                      class's own params (restricted to what\n"
                "                      the class supports). DecayReputationWeighted\n"
                "                      requires reputation_type (r=<type>) here -\n"
                "                      it's scoped to this weight-class instance,\n"
                "                      not the whole spec, so one composed spec\n"
                "                      can combine several DecayReputationWeighted\n"
                "                      instances each reading a different type -\n"
                "                      plus a, b, time_decay, pre_spot_decay,\n"
                "                      b_spot (same meaning as form 1 above).\n"
                "                      reputation_type valid choices:\n"
                f"{_wrapped_choices(VALID_REPUTATION_TYPES, indent=' ' * 25)}\n"
                "     Examples:\n"
                "       w=DecayReputationWeighted:r=peer_threshold_-20_coverage_50,"
                "a=0.7,b=10.0,td=linear,psd=true,bs=7.0|ag=mean\n"
                "       w=RecencyWeighted|w=DecayReputationWeighted:"
                "r=average_peer_score,a=0.5,t=linear|ag=median\n"
                "       w=DecayReputationWeighted:r=average_peer_score,a=0.5|"
                "w=DecayReputationWeighted:r=year_performance,a=0.5|ag=mean\n"
                "\n"
                "Both kinds accept an optional label= to override the\n"
                "report/totals-key name (defaults to the raw spec string).\n"
                "\n"
                f"Default: {', '.join(DEFAULT_AGGREGATION_METHODS)}"
            ),
        )
        parser.add_argument(
            "--exclude-question-type",
            dest="exclude_question_types",
            action="append",
            default=None,
            help=_help(
                "Question type to exclude from the eligible pool (repeatable). "
                f"Valid choices: {', '.join(VALID_QUESTION_TYPES)}. Median-based "
                "aggregation methods (e.g. recency_weighted, unweighted, or a "
                "composed spec using MedianAggregatorMixin) require "
                "multiple_choice to be excluded - their median renormalization "
                "needs the full PMF, which this fast path doesn't retain."
            ),
        )
        parser.add_argument(
            "--score-type",
            default="default",
            choices=[c.value for c in ScoreTypes] + ["default"],
            help=_help(
                "Score type to compute. 'default' (the default) scores each "
                "question using its own default_score_type field instead of one "
                "fixed type for every question."
            ),
        )
        parser.add_argument(
            "--min-forecasters",
            type=int,
            default=8,
            help=_help(
                "Minimum number of forecasters a question must have to be "
                "included (default: 8)."
            ),
        )
        parser.add_argument(
            "--rebuild-cache",
            action="store_true",
            default=False,
            help=_help(
                "Ignore any cached per-question data and rebuild it from the "
                "database (use after changing the PMF-reduction logic itself, or "
                "if a question's forecasts have changed). Also forces a fresh "
                "fetch of any disk-cached reputation_type history (use after "
                "running populate_reputations, or if Reputation rows changed)."
            ),
        )
        parser.add_argument(
            "--sample-timesteps",
            action="store_true",
            default=False,
            help=_help(
                "For questions with a dense timestep grid (many forecast "
                "starts/ends), evenly subsample it down to at most "
                f"{MAX_SAMPLED_TIMESTEPS} points before scoring - trades score "
                "precision for speed, similar in spirit to how minimize_history "
                "subsamples a display timeline. Has no effect on spot scoring "
                "(already a single point). Default: use the full grid."
            ),
        )
        parser.add_argument(
            "--joined-before",
            type=str,
            default=None,
            help=_help(
                "ISO-8601 date/datetime cutoff (e.g. 2024-01-01) for the "
                "joined_before_date aggregation method / JoinedBeforeFiltered "
                "weight class - only forecasters who joined before this are "
                "included. Default for any spec that doesn't attach its own "
                "date; required if none do."
            ),
        )
        parser.add_argument(
            "--workers",
            type=int,
            default=None,
            help=_help(
                "Number of worker processes to score questions in parallel. "
                "Each question is scored independently, so this scales close to "
                "linearly with core count - useful for large runs. Each worker "
                "opens its own DB connection. Pass 1 to force sequential. "
                "Default: auto-detect and use all available CPU cores."
            ),
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
        default_joined_before = _parse_joined_before(options["joined_before"])
        raw_specs = options["methods"] or DEFAULT_AGGREGATION_METHODS
        specs = [_parse_method_spec(raw) for raw in raw_specs]
        # Fill in each spec's joined_before from the global --joined-before
        # default wherever it didn't attach its own date - after this, every
        # spec is fully self-contained and downstream code never needs to
        # know about the global default again. a/b/b_spot/time_decay are
        # deliberately left alone here: each is only ever meaningful
        # attached to a specific method/weight-class token (see
        # AggregationSpec's docstring and _resolve_composed_spec), so an
        # unset one is passed through as None and resolved against its own
        # method/class-level default downstream (fast_scoring.py /
        # DecayReputationWeighted), not a separate run-wide default.
        resolved_specs: list[MethodSpec] = []
        for spec in specs:
            if isinstance(spec, ComposedMethodSpec):
                resolved_specs.append(
                    _resolve_composed_spec(spec, default_joined_before)
                )
                continue
            resolved_specs.append(
                replace(
                    spec,
                    joined_before=(
                        spec.joined_before
                        if spec.joined_before is not None
                        else default_joined_before
                    ),
                )
            )
        specs = resolved_specs

        self._validate_options(specs, raw_specs, exclude_question_types)

        question_ids = self._select_question_ids(
            min_forecasters=min_forecasters,
            question_count=question_count,
            seed=seed,
            exclude_question_types=exclude_question_types,
        )

        reputation_histories = self._preload_reputation_histories(
            question_ids, specs, rebuild_cache
        )
        static_filters = self._preload_static_filters(question_ids, specs)
        reputation_by_type = self._preload_composed_reputation_by_type(
            question_ids, specs, rebuild_cache
        )
        class_reputations = self._preload_composed_class_reputations(
            question_ids, specs
        )
        composed_static_filters = self._preload_composed_static_filters(
            question_ids, specs
        )

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
            reputation_by_type,
            class_reputations,
            composed_static_filters,
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
            default_joined_before=default_joined_before,
        )
        elapsed = time.perf_counter() - eval_start
        self._print_results(totals, elapsed, total_questions, score_type)

    def _run_sequential(
        self,
        question_ids: list[int],
        score_type: str,
        specs: list[MethodSpec],
        rebuild_cache: bool,
        sample_timesteps: bool,
        reputation_histories: dict[str, ReputationArrays],
        static_filters: dict[StaticFilterKey, set[int]],
        reputation_by_type: dict[str, ReputationArrays],
        class_reputations: dict[str, ReputationArrays],
        composed_static_filters: dict[StaticFilterKey, set[int]],
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
                    reputation_by_type,
                    class_reputations,
                    composed_static_filters,
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
        specs: list[MethodSpec],
        rebuild_cache: bool,
        sample_timesteps: bool,
        reputation_histories: dict[str, ReputationArrays],
        static_filters: dict[StaticFilterKey, set[int]],
        reputation_by_type: dict[str, ReputationArrays],
        class_reputations: dict[str, ReputationArrays],
        composed_static_filters: dict[StaticFilterKey, set[int]],
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
                reputation_by_type,
                class_reputations,
                composed_static_filters,
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
        specs: list[MethodSpec],
        raw_specs: list[str],
        exclude_question_types: list[str],
    ) -> None:
        named_specs = [s for s in specs if isinstance(s, AggregationSpec)]
        composed_specs = _composed_specs(specs)
        methods = {spec.method for spec in named_specs}

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
        composed_median_labels = sorted(
            s.label for s in composed_specs if s.aggregator == "MedianAggregatorMixin"
        )
        if (
            (median_methods or composed_median_labels)
            and Question.QuestionType.MULTIPLE_CHOICE not in exclude_question_types
        ):
            raise CommandError(
                f"Median-based method(s)/spec(s) "
                f"{', '.join(median_methods + composed_median_labels)} requested, "
                "but multiple_choice questions aren't excluded. Median "
                "aggregation's renormalization for multiple_choice needs the "
                "full PMF, which this fast path doesn't retain - add "
                "--exclude-question-type multiple_choice, or drop these specs."
            )

        missing_joined_before = any(
            spec.method == "joined_before_date" and spec.joined_before is None
            for spec in named_specs
        ) or any(
            wc.name == "JoinedBeforeFiltered" and wc.params.get("joined_before") is None
            for spec in composed_specs
            for wc in spec.weight_classes
        )
        if missing_joined_before:
            raise CommandError(
                "joined_before_date/JoinedBeforeFiltered requires "
                "--joined-before <ISO date/datetime>, or a per-spec date."
            )

        unsupported_methods = sorted(methods - MEAN_BASED_METHODS - MEDIAN_BASED_METHODS)
        if unsupported_methods:
            raise CommandError(
                f"Aggregation method(s) {', '.join(unsupported_methods)} aren't "
                "supported by this fast scoring path yet."
            )

        # Keyed by label (spec.label - an explicit label=/l=, or the raw
        # spec string itself when none was given) rather than by the spec's
        # params: `totals` is keyed by label, so two specs sharing one
        # collide there regardless of whether their underlying params
        # actually differ. Reporting the raw --method strings that collided
        # (not just the shared label) matters specifically because an
        # explicit label= is free-text the user typed themselves - a typo
        # there (e.g. copy-pasting a label across a grid search and missing
        # one digit) produces exactly this: two spec strings with genuinely
        # different params, but an accidentally identical label.
        labels_to_raw: dict[str, list[str]] = {}
        for spec, raw in zip(specs, raw_specs):
            labels_to_raw.setdefault(spec.label, []).append(raw)
        duplicates = {
            label: raws for label, raws in labels_to_raw.items() if len(raws) > 1
        }
        if duplicates:
            lines = [
                f"  {label!r} used by:\n" + "\n".join(f"    - {r}" for r in raws)
                for label, raws in sorted(duplicates.items())
            ]
            raise CommandError(
                "Duplicate --method label(s) - totals are keyed by label, so "
                "specs sharing one can't be told apart in the report:\n"
                + "\n".join(lines)
                + "\nIf the --method strings above actually differ, the "
                "params aren't the problem - check for a typo in the "
                "label=/l= text itself (or drop label= to fall back to the "
                "full spec string, which is unique whenever the params are)."
            )

    def _gather_batch_forecaster_ids(self, question_ids: list[int]) -> list[int]:
        return list(
            Forecast.objects.filter(question_id__in=question_ids)
            .values_list("author_id", flat=True)
            .distinct()
        )

    def _batch_end_time(self, question_ids: list[int]):
        # Bound preloads to what this batch actually needs - the latest
        # close time among its questions - rather than "now", which would
        # fetch a decade of irrelevant future scores for a batch of old
        # questions.
        return Question.objects.filter(id__in=question_ids).aggregate(
            Max("scheduled_close_time")
        )["scheduled_close_time__max"]

    def _preload_reputation_histories(
        self,
        question_ids: list[int],
        specs: list[MethodSpec],
        rebuild_cache: bool = False,
    ) -> dict[str, ReputationArrays]:
        """Fetches every reputation-weighted named method's full
        user-reputation history once for the whole batch of questions,
        instead of once per question - the dominant cost otherwise, since
        the same active forecasters reappear across most questions. Keyed
        by base method (not spec label): the reputation values a/b blend
        into a weight don't depend on a/b themselves, so grid-search specs
        of the same method share one preloaded history.

        DECAYED_REPUTATION_CLASSES methods (single_aggregation) additionally
        persist to disk across *runs* (see preload_reputation_history /
        _get_or_build_full_reputation_history in fast_scoring.py) - pass
        --rebuild-cache after populate_reputations adds new rows."""
        methods_needing_reputation = sorted(
            {
                spec.method
                for spec in specs
                if isinstance(spec, AggregationSpec)
                and spec.method in REPUTATION_WEIGHTED_CLASSES
            }
        )
        if not methods_needing_reputation:
            return {}

        user_ids = self._gather_batch_forecaster_ids(question_ids)
        end_time = self._batch_end_time(question_ids)
        self.stdout.write(
            f"Preloading reputation history for {len(user_ids)} forecasters "
            f"({', '.join(methods_needing_reputation)})..."
        )

        # Methods that pull from the exact same underlying Reputation
        # records (i.e. share a DecayReputationWeighted subclass's
        # reputation_type - none of the current named methods do, since
        # single_aggregation is the only one left in DECAYED_REPUTATION_
        # CLASSES, but this stays correct if more are added) share one
        # preload instead of redundantly querying/holding the same data once
        # per method - each preload can be millions of Reputation rows for a
        # large batch, and duplicating that per method (then again per
        # --workers process) is exactly what OOM-killed a run requesting
        # several such methods at once.
        cache: dict[str, ReputationArrays] = {}
        result: dict[str, ReputationArrays] = {}
        for method in methods_needing_reputation:
            weighted_class = REPUTATION_WEIGHTED_CLASSES[method]
            cache_key = getattr(weighted_class, "reputation_type", None) or method
            if cache_key not in cache:
                cache[cache_key] = preload_reputation_history(
                    method, user_ids, end_time=end_time, rebuild_cache=rebuild_cache
                )
            result[method] = cache[cache_key]
        return result

    def _preload_static_filters(
        self, question_ids: list[int], specs: list[MethodSpec]
    ) -> dict[StaticFilterKey, set[int]]:
        """Fetches every static-filter named method's full qualifying
        user_id set once for the whole batch of questions, instead of once
        per question. Keyed by (method, joined_before): unlike reputation
        histories, a joined_before_date spec's *result* depends on its own
        date, so distinct dates from a grid search each need their own
        preload - metaculus_pros ignores joined_before entirely, so it
        always collapses to a single key regardless of how many specs use
        it."""
        filter_keys = sorted(
            {
                (spec.method, spec.joined_before)
                for spec in specs
                if isinstance(spec, AggregationSpec)
                and spec.method in STATIC_FILTER_CLASSES
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

    def _preload_composed_reputation_by_type(
        self,
        question_ids: list[int],
        specs: list[MethodSpec],
        rebuild_cache: bool = False,
    ) -> dict[str, ReputationArrays]:
        """Like _preload_reputation_histories, but for composed specs'
        weight classes' own reputation_type param, keyed by the
        reputation_type string itself (shared across every weight class -
        in the same spec or a different one - using the same type,
        regardless of a/b/b_spot). reputation_type is required whenever a
        weight class needs one (see _parse_weight_token), so a single spec
        combining several DecayReputationWeighted instances each contributes
        its own type here. Each type also persists to disk across *runs* -
        see preload_reputation_history_by_type; pass --rebuild-cache after
        populate_reputations adds new rows."""
        reputation_types = sorted(
            {
                wc.params["reputation_type"]
                for spec in _composed_specs(specs)
                for wc in spec.weight_classes
                if _weight_class_needs_reputation_type(wc.name)
            }
        )
        if not reputation_types:
            return {}
        user_ids = self._gather_batch_forecaster_ids(question_ids)
        end_time = self._batch_end_time(question_ids)
        self.stdout.write(
            f"Preloading composed reputation types for {len(user_ids)} "
            f"forecasters ({', '.join(reputation_types)})..."
        )
        return {
            reputation_type: preload_reputation_history_by_type(
                reputation_type,
                user_ids,
                end_time=end_time,
                rebuild_cache=rebuild_cache,
            )
            for reputation_type in reputation_types
        }

    def _preload_composed_class_reputations(
        self, question_ids: list[int], specs: list[MethodSpec]
    ) -> dict[str, ReputationArrays]:
        """Like _preload_reputation_histories, but for composed specs' medal
        -family weight classes (whose reputation source is intrinsic to the
        class, not the outer reputation_type), keyed by class name."""
        class_names = sorted(
            {
                wc.name
                for spec in _composed_specs(specs)
                for wc in spec.weight_classes
                if _weight_class_needs_class_reputation(wc.name)
            }
        )
        if not class_names:
            return {}
        user_ids = self._gather_batch_forecaster_ids(question_ids)
        end_time = self._batch_end_time(question_ids)
        self.stdout.write(
            f"Preloading composed class reputations for {len(user_ids)} "
            f"forecasters ({', '.join(class_names)})..."
        )
        return {
            class_name: preload_class_reputation_history(
                class_name, user_ids, end_time=end_time
            )
            for class_name in class_names
        }

    def _preload_composed_static_filters(
        self, question_ids: list[int], specs: list[MethodSpec]
    ) -> dict[StaticFilterKey, set[int]]:
        """Like _preload_static_filters, but for composed specs' filter
        weight classes, keyed by (class name, joined_before)."""
        filter_keys = sorted(
            {
                (wc.name, wc.params.get("joined_before"))
                for spec in _composed_specs(specs)
                for wc in spec.weight_classes
                if _weight_class_needs_static_filter(wc.name)
            },
            key=lambda k: (k[0], k[1] or datetime.min.replace(tzinfo=dt_timezone.utc)),
        )
        if not filter_keys:
            return {}
        user_ids = self._gather_batch_forecaster_ids(question_ids)
        self.stdout.write(
            f"Preloading composed static filters for {len(user_ids)} "
            f"forecasters ({', '.join(sorted({name for name, _ in filter_keys}))})..."
        )
        return {
            (class_name, joined_before): preload_static_filter_by_class(
                class_name, user_ids, joined_before=joined_before
            )
            for class_name, joined_before in filter_keys
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
        specs: list[MethodSpec],
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
        self.stdout.write(f"  methods ({len(specs)}):")
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
