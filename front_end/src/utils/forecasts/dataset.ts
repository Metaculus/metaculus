import { isNil } from "lodash";

import {
  DamperSliderComponent,
  DefaultInboundOutcomeCount,
  DistributionQuantileComponent,
  DistributionSliderComponent,
  PinnedOutOfBounds,
  Quantile,
  Question,
  QuestionType,
} from "@/types/question";
import { TranslationKey } from "@/types/translations";
import { isPercentileRow } from "@/utils/forecasts/quantile_components";
import {
  isDamperComponent,
  isUniformComponent,
} from "@/utils/forecasts/slider_components";
import {
  cdfFromSliders,
  cdfToPmf,
  nominalLocationToCdfLocation,
  segmentBucketCoverage,
} from "@/utils/math";

// Share of the mass standardization spreads uniformly over the inbound
// range, guaranteeing a minimum density in every inbound bucket
const INBOUND_FLOOR_MASS = 0.01;

function standardizeCdf(
  cdf: number[],
  lowerOpen: boolean,
  upperOpen: boolean,
  inboundOutcomeCount: number,
  pinnedOutOfBounds?: PinnedOutOfBounds | null
): number[] {
  if (cdf.length === 0) {
    return [];
  }

  if (pinnedOutOfBounds) {
    // Out-of-bounds mass is exactly the pinned values (the capping below
    // never changes it); the inbound mass keeps the shape of `cdf`, plus
    // the floor. Callers guarantee there is inbound mass to shape.
    const below = pinnedOutOfBounds.below_lower_bound;
    const inboundMass = 1 - below - pinnedOutOfBounds.above_upper_bound;
    const first = cdf[0] ?? 0;
    const rawInboundMass = (cdf[cdf.length - 1] ?? 1) - first;
    cdf = cdf.map((F, index) => {
      const x = index / (cdf.length - 1);
      const shape = (F - first) / rawInboundMass;
      return (
        below +
        (inboundMass - INBOUND_FLOOR_MASS) * shape +
        INBOUND_FLOOR_MASS * x
      );
    });
  } else {
    // apply lower bound
    const cdfOffset =
      lowerOpen && upperOpen
        ? (F: number, x: number) => 0.988 * F + 0.01 * x + 0.001
        : lowerOpen
          ? (F: number, x: number) => 0.989 * F + 0.01 * x + 0.001
          : upperOpen
            ? (F: number, x: number) => 0.989 * F + 0.01 * x
            : (F: number, x: number) => 0.99 * F + 0.01 * x;
    cdf = cdf.map((F, index) => cdfOffset(F, index / (cdf.length - 1)));
  }

  // apply upper bound
  let pmf: number[] = [];
  pmf.push(cdf[0] ?? 0);
  for (let i = 1; i < cdf.length; i++) {
    pmf.push((cdf[i] ?? 0) - (cdf[i - 1] ?? 0));
  }
  pmf.push(1 - (cdf[cdf.length - 1] ?? 1));
  // cap depends on inboundOutcomeCount (0.2 if it is the default 200)
  const cap = 0.2 * (DefaultInboundOutcomeCount / inboundOutcomeCount);
  const capPmf = (scale: number) =>
    pmf.map((value, i) =>
      i == 0 || i == pmf.length - 1 ? value : Math.min(cap, scale * value)
    );
  const cappedSum = (scale: number) =>
    capPmf(scale).reduce((acc, value) => acc + value, 0);

  // find the appropriate scale search space
  let lo = 1;
  let hi = 1;
  let scale = 1;
  while (cappedSum(hi) < 1) hi *= 1.2;
  // hone in on scale value that makes capped sum 1
  for (let i = 0; i < 100; i++) {
    scale = 0.5 * (lo + hi);
    const s = cappedSum(scale);
    if (s < 1) {
      lo = scale;
    } else {
      hi = scale;
    }
    if (s === 1 || hi - lo < 2e-5) {
      break;
    }
  }
  // apply scale and renormalize
  pmf = capPmf(scale);
  const inboundScaleFactor =
    ((cdf[cdf.length - 1] ?? 1) - (cdf[0] ?? 0)) /
    pmf.slice(1, pmf.length - 1).reduce((acc, value) => acc + value, 0);
  pmf = pmf.map((value, i) =>
    i == 0 || i == pmf.length - 1 ? value : value * inboundScaleFactor
  );
  // back to CDF space
  cdf = [];
  let cumulative = 0;
  for (let i = 0; i < pmf.length - 1; i++) {
    cumulative += pmf[i] ?? 0;
    cdf.push(cumulative);
  }

  // finally round to 10 decimal places
  cdf = cdf.map((value) => Math.round(value * 1e10) / 1e10);
  return cdf;
}

/**
 * Get chart data from slider input
 */
// Below this much remaining probability, a distribution can't be
// meaningfully renormalized
const MIN_RENORMALIZABLE_MASS = 1e-9;

export type SliderDatasetError =
  | "sliderNoPositiveComponentsError"
  | "sliderDamperRemovesAllError"
  | "sliderNoInboundMassError";

export type SliderNumericForecastDataset = {
  cdf: number[];
  pmf: number[];
  componentCdfs: number[][];
  // Set when no valid distribution can be built; cdf and pmf are then empty
  // and the forecast can't be submitted
  error?: SliderDatasetError;
};

/**
 * Get chart data from slider input
 */
export function getSliderNumericForecastDataset(
  components: DistributionSliderComponent[],
  question: Question,
  pinnedOutOfBounds?: PinnedOutOfBounds | null
): SliderNumericForecastDataset {
  const fail = (error: SliderDatasetError) => ({
    cdf: [],
    pmf: [],
    componentCdfs: [],
    error,
  });
  const lowerOpen = question.open_lower_bound || false;
  const upperOpen = question.open_upper_bound || false;
  const inboundOutcomeCount =
    question.inbound_outcome_count || DefaultInboundOutcomeCount;

  const dampers = components.filter(isDamperComponent);
  // Each mixture component's mass per bucket (summing to 1): lower
  // out-of-bounds, inbound buckets, upper out-of-bounds (as in
  // segmentBucketCoverage)
  const mixture = components
    .filter(
      (c): c is Exclude<DistributionSliderComponent, DamperSliderComponent> =>
        !isDamperComponent(c)
    )
    .flatMap((component) => {
      if (isUniformComponent(component)) {
        const coverage = segmentBucketCoverage(
          component.left,
          component.right,
          lowerOpen,
          upperOpen,
          inboundOutcomeCount
        );
        const covered = coverage.reduce((acc, c) => acc + c, 0);
        // A segment covering no bucket (only possible in pasted data) has
        // no mass to contribute
        return covered > 0
          ? [
              {
                weight: component.weight,
                pmf: coverage.map((c) => c / covered),
              },
            ]
          : [];
      }
      const cdf = cdfFromSliders(
        component.left,
        component.center,
        component.right,
        lowerOpen,
        upperOpen,
        inboundOutcomeCount
      );
      const pmf = [
        cdf[0] ?? 0,
        ...cdf.slice(1).map((F, i) => F - (cdf[i] ?? 0)),
        1 - (cdf[cdf.length - 1] ?? 1),
      ];
      return [{ weight: component.weight, pmf }];
    });
  const totalWeight = mixture.reduce((acc, c) => acc + c.weight, 0);
  if (!(totalWeight > 0)) {
    return fail("sliderNoPositiveComponentsError");
  }
  let componentPmfs = mixture.map(({ weight, pmf }) =>
    pmf.map((p) => (p * weight) / totalWeight)
  );

  if (dampers.length) {
    // Per-bucket multiplier from all dampers (overlapping dampers compound;
    // a partially covered bucket is scaled by the covered fraction), applied
    // to every component, then everything renormalized together
    const multipliers = Array<number>(inboundOutcomeCount + 2).fill(1);
    for (const damper of dampers) {
      // Clamped, as pasted data could hold anything; outside [0, 1] a
      // multiplier could go negative
      const strength = Math.min(Math.max(damper.strength, 0), 1);
      segmentBucketCoverage(
        damper.left,
        damper.right,
        lowerOpen,
        upperOpen,
        inboundOutcomeCount
      ).forEach((coverage, j) => {
        multipliers[j] = (multipliers[j] ?? 1) * (1 - strength * coverage);
      });
    }
    componentPmfs = componentPmfs.map((pmf) =>
      pmf.map((p, j) => p * (multipliers[j] ?? 1))
    );
    const remainingMass = componentPmfs.flat().reduce((acc, p) => acc + p, 0);
    if (!(remainingMass > MIN_RENORMALIZABLE_MASS)) {
      return fail("sliderDamperRemovesAllError");
    }
    componentPmfs = componentPmfs.map((pmf) =>
      pmf.map((p) => p / remainingMass)
    );
  }

  // Back to CDF space; the upper out-of-bounds bucket is implied by the last
  // CDF value
  const componentCdfs = componentPmfs.map((pmf) => {
    let cumulative = 0;
    return pmf.slice(0, -1).map((p) => (cumulative += p));
  });
  let cdf = componentCdfs.reduce(
    (acc, componentCdf) => acc.map((x, i) => x + (componentCdf[i] ?? 0)),
    Array<number>(inboundOutcomeCount + 1).fill(0)
  );

  // Pinning replaces the out-of-bounds mass, so it needs mass inside the
  // range to shape the rest of the distribution with
  if (
    pinnedOutOfBounds &&
    !((cdf[cdf.length - 1] ?? 0) - (cdf[0] ?? 0) > MIN_RENORMALIZABLE_MASS)
  ) {
    return fail(
      dampers.length
        ? "sliderDamperRemovesAllError"
        : "sliderNoInboundMassError"
    );
  }

  cdf = standardizeCdf(
    cdf,
    lowerOpen,
    upperOpen,
    inboundOutcomeCount,
    pinnedOutOfBounds
  );

  return {
    cdf: cdf,
    pmf: cdfToPmf(cdf),
    componentCdfs: componentCdfs,
  };
}

/**
 * Get chart data from quantiles input
 */
export function getQuantileNumericForecastDataset(
  components: DistributionQuantileComponent,
  question: Question
) {
  // Every row needs a value, and every percentile row a percentile
  if (
    !components ||
    components.some(
      (c) => isNil(c.value) || (isPercentileRow(c) && isNil(c.quantile))
    )
  ) {
    return {
      cdf: [],
      pmf: [],
    };
  }

  const cdf = generateQuantileContinuousCdf({
    quantiles: components
      .filter(isPercentileRow)
      .map((c) => ({ quantile: Number(c.quantile), value: c.value ?? 0 }))
      .sort((a, b) => a.quantile - b.quantile),
    probBelowLower:
      components.find((c) => c.quantile === Quantile.lower)?.value ?? 0,
    probAboveUpper:
      components.find((c) => c.quantile === Quantile.upper)?.value ?? 0,
    question,
  });
  if (typeof cdf === "string") {
    return {
      cdf: [],
      pmf: [],
      error: cdf as TranslationKey,
    };
  }
  return {
    cdf: cdf,
    pmf: cdfToPmf(cdf),
  };
}

function hydrateQuantiles(
  quantiles: { quantile: number; value: number }[],
  cdfEvalLocs: number[]
) {
  // returns an altered set of data that replaces any points that don't lie
  // exactly on one of the eval locations with the 2 closest points with
  // slope of the average slope of the two adjacent segments and crosses
  // exactly through the original point. This guarantees that evaluating
  // specific percentiles that were inputs will return the exact
  // intended value.
  // Note: all points must be within x range
  const new_quantiles: { quantile: number; value: number }[] = [];
  for (let i = 0; i < quantiles.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const point = quantiles[i]!;
    if (cdfEvalLocs.includes(point.value)) {
      new_quantiles.push(point);
    } else {
      if (i === 0 || i === quantiles.length - 1) {
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { value: x0, quantile: y0 } = quantiles[i - 1]!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { value: x1, quantile: y1 } = point!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { value: x2, quantile: y2 } = quantiles[i + 1]!;
      const m01 = (y1 - y0) / (x1 - x0);
      const m12 = (y2 - y1) / (x2 - x1);
      const m1 = (m01 + m12) / 2;
      const b1 = y1 - m1 * x1;

      // find the closest eval points
      const xe0 =
        cdfEvalLocs
          .slice()
          .reverse()
          .find((x) => x < x1) ?? 0;
      const xe1 = cdfEvalLocs.find((x) => x > x1) ?? 0;
      const ye0 = m1 * xe0 + b1;
      const ye1 = m1 * xe1 + b1;

      new_quantiles.push({ quantile: ye0, value: xe0 });
      new_quantiles.push({ quantile: ye1, value: xe1 });
    }
  }

  return new_quantiles;
}

function generateQuantileContinuousCdf({
  quantiles,
  probBelowLower,
  probAboveUpper,
  question,
}: {
  quantiles: { quantile: number; value: number }[];
  probBelowLower: number;
  probAboveUpper: number;
  question: Question;
}): number[] | TranslationKey {
  const { range_min, range_max } = question.scaling;
  if (range_min === null || range_max === null) {
    return "questionRangeError";
  }

  // create a sorted list of known points
  const scaledQuantiles: { quantile: number; value: number }[] = [];
  quantiles.forEach(({ quantile, value }) => {
    const scaledValue = nominalLocationToCdfLocation(value, question);
    // TODO: support for quantiles on boundaries
    if (0 < scaledValue && scaledValue < 1) {
      scaledQuantiles.push({
        quantile: quantile,
        value: scaledValue,
      });
    }
  });

  scaledQuantiles.push({ quantile: probBelowLower, value: 0 });
  scaledQuantiles.push({ quantile: 100 - probAboveUpper, value: 1 });
  scaledQuantiles.sort((a, b) => a.value - b.value);

  const cdfEvalLocs: number[] = [];
  const inboundOutcomeCount =
    question.inbound_outcome_count ?? DefaultInboundOutcomeCount;
  for (let i = 0; i < inboundOutcomeCount + 1; i++) {
    cdfEvalLocs.push(i / inboundOutcomeCount);
  }

  // TODO: figure out better hydration that also works for Discrete
  const hydratedQuantiles =
    question.type !== QuestionType.Discrete
      ? hydrateQuantiles(scaledQuantiles, cdfEvalLocs)
      : scaledQuantiles;
  if (hydratedQuantiles.length < 2) {
    // TODO: adjust error message
    return "chartDataError";
  }

  // check validity
  const firstPoint = hydratedQuantiles[0];
  const lastPoint = hydratedQuantiles[hydratedQuantiles.length - 1];
  if (
    !firstPoint ||
    firstPoint.value > 0 ||
    !lastPoint ||
    lastPoint.value < 1
  ) {
    return "percentileBoundsError";
  }

  function getCdfAt(location: number) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let previous = hydratedQuantiles[0]!;
    for (let i = 1; i < hydratedQuantiles.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const current = hydratedQuantiles[i]!;
      if (previous.value <= location && location <= current.value) {
        return (
          (previous.quantile +
            ((current.quantile - previous.quantile) *
              (location - previous.value)) /
              (current.value - previous.value)) /
          100
        );
      }
      previous = current;
    }
  }

  const cdf = [];
  for (let i = 0; i < inboundOutcomeCount + 1; i++) {
    const cdfValue = getCdfAt(i / inboundOutcomeCount);
    !isNil(cdfValue) ? cdf.push(cdfValue) : undefined;
  }

  return cdf;
}
