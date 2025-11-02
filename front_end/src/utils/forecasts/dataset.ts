import { isNil } from "lodash";

import {
  DefaultInboundOutcomeCount,
  DistributionQuantileComponent,
  DistributionSliderComponent,
  Quantile,
  Question,
  QuestionType,
} from "@/types/question";
import { TranslationKey } from "@/types/translations";
import {
  cdfFromSliders,
  cdfToPmf,
  nominalLocationToCdfLocation,
} from "@/utils/math";

function standardizeCdf(
  cdf: number[],
  lowerOpen: boolean,
  upperOpen: boolean,
  inboundOutcomeCount: number
): number[] {
  if (cdf.length === 0) {
    return [];
  }

  // apply lower bound
  const scaleLowerTo = lowerOpen ? 0 : cdf[0] ?? 0;
  const scaleUpperTo = upperOpen ? 1 : cdf[cdf.length - 1] ?? 1;
  const rescaledInboundMass = scaleUpperTo - scaleLowerTo || 1;
  const applyMinimum = (F: number, location: number) => {
    const rescaledF = (F - scaleLowerTo) / rescaledInboundMass;
    if (lowerOpen && upperOpen) {
      return 0.988 * rescaledF + 0.01 * location + 0.001;
    }
    if (lowerOpen) {
      return 0.989 * rescaledF + 0.01 * location + 0.001;
    }
    if (upperOpen) {
      return 0.989 * rescaledF + 0.01 * location;
    }
    return 0.99 * rescaledF + 0.01 * location;
  };
  cdf = cdf.map((F, index) => applyMinimum(F, index / cdf.length));

  // apply upper bound
  let pmf: number[] = [];
  pmf.push(cdf[0] ?? 0);
  for (let i = 1; i < cdf.length; i++) {
    pmf.push((cdf[i] ?? 0) - (cdf[i - 1] ?? 0));
  }
  pmf.push(1 - (cdf[cdf.length - 1] ?? 1));
  // cap depends on cdf_size (0.2 if size is the default 201)
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
    if (s == 1) {
      hi = scale;
      break;
    } else if (cappedSum(scale) < 1) {
      lo = scale;
    } else {
      hi = scale;
    }
    if (hi - lo < 2e-5) {
      break;
    }
  }
  // apply scale and renormalize
  pmf = capPmf(hi);
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

  return cdf;
}

/**
 * Get chart data from slider input
 */
export function getSliderNumericForecastDataset(
  components: DistributionSliderComponent[],
  question: Question
) {
  const weights = components.map(({ weight }) => weight);
  const normalizedWeights = weights.map(
    (x) => x / weights.reduce((a, b) => a + b)
  );
  const lowerOpen = question.open_lower_bound || false;
  const upperOpen = question.open_upper_bound || false;
  const inboundOutcomeCount =
    question.inbound_outcome_count || DefaultInboundOutcomeCount;

  const componentCdfs = components.map((component, index) => {
    const cdf = cdfFromSliders(
      component.left,
      component.center,
      component.right,
      lowerOpen,
      upperOpen,
      inboundOutcomeCount
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const result = cdf.map((x) => x * normalizedWeights[index]!);
    return result;
  });
  let cdf = componentCdfs.reduce((acc, componentCdf) => {
    return acc.map((x, i) => x + componentCdf[i]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  }, Array(componentCdfs[0]!.length).fill(0));
  cdf = cdf.map((F) => Number(F));

  cdf = standardizeCdf(cdf, lowerOpen, upperOpen, inboundOutcomeCount);

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
  if (
    !components ||
    Object.values(components).some((quartile) => isNil(quartile.value))
  ) {
    return {
      cdf: [],
      pmf: [],
    };
  }

  const cdf = generateQuantileContinuousCdf({
    quantiles: [
      {
        quantile: Number(Quantile.q1),
        value: components.find((c) => c.quantile === Quantile.q1)?.value ?? 0,
      },
      {
        quantile: Number(Quantile.q2),
        value: components.find((c) => c.quantile === Quantile.q2)?.value ?? 0,
      },
      {
        quantile: Number(Quantile.q3),
        value: components.find((c) => c.quantile === Quantile.q3)?.value ?? 0,
      },
    ],
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
