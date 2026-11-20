import { isNil, round } from "lodash";

import { Question, QuestionType } from "@/types/question";
import { scaleInternalLocation, unscaleNominalLocation } from "@/utils/math";

// Nudge functions take a signed number of steps: ±1 for a regular nudge,
// more with Shift held (see nudgeSteps in components/ui/nudge_buttons).

/** Roughly how much of the range one nudge moves a value */
const VALUE_NUDGE_FRACTION = 0.01;

/** 1, 2 or 5 times a power of ten, closest to `x` */
function niceStep(x: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(x));
  const mantissa = x / magnitude;
  const nice =
    mantissa < 1.5 ? 1 : mantissa < 3.5 ? 2 : mantissa < 7.5 ? 5 : 10;
  return nice * magnitude;
}

/**
 * A value (in the question's units) nudged by `steps` times about 1% of the
 * range:
 * - linear scales: a round step near range / 100;
 * - log scales: 1% of the (log) axis, rounded to the step's magnitude;
 * - discrete questions: whole outcomes, snapped onto the outcomes.
 * An unfilled value starts at the middle of the range.
 */
export function nudgeNominalValue(
  value: number | null | undefined,
  steps: number,
  question: Question
): number | undefined {
  const { range_min, range_max, zero_point } = question.scaling;
  if (isNil(range_min) || isNil(range_max) || range_max <= range_min) {
    return undefined;
  }
  const range = range_max - range_min;

  if (
    question.type === QuestionType.Discrete &&
    question.inbound_outcome_count
  ) {
    // Outcomes sit at the centers of inbound_outcome_count equal buckets
    const spacing = range / question.inbound_outcome_count;
    const step = Math.max(
      1,
      Math.round((range * VALUE_NUDGE_FRACTION) / spacing)
    );
    const index = isNil(value)
      ? Math.floor(question.inbound_outcome_count / 2)
      : Math.round((value - range_min) / spacing - 0.5) + steps * step;
    return round(range_min + (index + 0.5) * spacing, 10);
  }

  if (isNil(value)) {
    return scaleInternalLocation(0.5, question.scaling);
  }
  if (!isNil(zero_point)) {
    const location = unscaleNominalLocation(value, question.scaling);
    const next = scaleInternalLocation(
      location + steps * VALUE_NUDGE_FRACTION,
      question.scaling
    );
    // Round to the step's leading digit, so the result stays readable but
    // always moves by roughly one step in the intended direction
    const magnitude = 10 ** Math.floor(Math.log10(Math.abs(next - value)));
    return round(Math.round(next / magnitude) * magnitude, 10);
  }
  return round(value + steps * niceStep(range * VALUE_NUDGE_FRACTION), 10);
}

// Out-of-bounds probabilities an open bound allows (percent), as validated
// by validateQuantileInput
const OPEN_BOUND_PROBABILITY_MIN = 0.1;
const OPEN_BOUND_PROBABILITY_MAX = 99.9;
const BOUND_NUDGE = 1;
// Within this many points of either limit, nudges use finer steps so small
// out-of-bounds probabilities (e.g. 0.5%) stay reachable
const FINE_BOUND_ZONE = 1;
const FINE_BOUND_NUDGE = 0.1;

/**
 * An out-of-bounds probability (percent) nudged by `steps` points, or by
 * `steps` tenths within 1 point of either limit (0.1%-1% and 99%-99.9%).
 * A step never crosses the edge of a fine zone in one go: it stops on it.
 * Clamped to what an open bound allows; an unfilled one starts at 1%.
 */
export function nudgeBoundProbability(
  probability: number | null | undefined,
  steps: number
): number {
  if (isNil(probability)) return 1;
  const up = steps > 0;
  const lowEdge = FINE_BOUND_ZONE;
  const highEdge = 100 - FINE_BOUND_ZONE;
  // Fine steps when inside a fine zone, or on its edge heading into it
  const inFineZone = up
    ? probability < lowEdge || probability >= highEdge
    : probability <= lowEdge || probability > highEdge;
  let next =
    probability + steps * (inFineZone ? FINE_BOUND_NUDGE : BOUND_NUDGE);
  // Stop on a zone edge rather than crossing it
  for (const edge of [lowEdge, highEdge]) {
    if (
      (up && probability < edge && next > edge) ||
      (!up && probability > edge && next < edge)
    ) {
      next = edge;
    }
  }
  return round(
    Math.min(
      Math.max(next, OPEN_BOUND_PROBABILITY_MIN),
      OPEN_BOUND_PROBABILITY_MAX
    ),
    10
  );
}
