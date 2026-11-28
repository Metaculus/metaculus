import { isNil, round } from "lodash";

import { Question, QuestionType } from "@/types/question";
import { scaleInternalLocation, unscaleNominalLocation } from "@/utils/math";

const VALUE_NUDGE_FRACTION = 0.01;

function niceStep(x: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(x));
  const mantissa = x / magnitude;
  const nice =
    mantissa < 1.5 ? 1 : mantissa < 3.5 ? 2 : mantissa < 7.5 ? 5 : 10;
  return nice * magnitude;
}

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
    const middle = scaleInternalLocation(0.5, question.scaling);
    const step =
      scaleInternalLocation(0.5 + VALUE_NUDGE_FRACTION, question.scaling) -
      middle;
    const magnitude = 10 ** Math.floor(Math.log10(step));
    return round(Math.round(middle / magnitude) * magnitude, 10);
  }
  if (!isNil(zero_point)) {
    const location = unscaleNominalLocation(value, question.scaling);
    // At or beyond the zero point, a value has no place on a log axis
    if (!Number.isFinite(location)) return undefined;
    const next = scaleInternalLocation(
      location + steps * VALUE_NUDGE_FRACTION,
      question.scaling
    );
    // Rounding to the step's leading digit still always moves the value
    const magnitude = 10 ** Math.floor(Math.log10(Math.abs(next - value)));
    return round(Math.round(next / magnitude) * magnitude, 10);
  }
  return round(value + steps * niceStep(range * VALUE_NUDGE_FRACTION), 10);
}

// Must match validateQuantileInput
const OPEN_BOUND_PROBABILITY_MIN = 0.1;
const OPEN_BOUND_PROBABILITY_MAX = 99.9;
const BOUND_NUDGE = 1;
// Finer steps near either limit, so e.g. 0.5% stays reachable
const FINE_BOUND_ZONE = 1;
const FINE_BOUND_NUDGE = 0.1;

export function nudgeBoundProbability(
  probability: number | null | undefined,
  steps: number
): number {
  if (isNil(probability)) return 1;
  const up = steps > 0;
  const lowEdge = FINE_BOUND_ZONE;
  const highEdge = 100 - FINE_BOUND_ZONE;
  const inFineZone = up
    ? probability < lowEdge || probability >= highEdge
    : probability <= lowEdge || probability > highEdge;
  let next =
    probability + steps * (inFineZone ? FINE_BOUND_NUDGE : BOUND_NUDGE);
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
