import {
  DistributionQuantileComponent,
  DistributionSliderComponent,
  Quantile,
  Question,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getSliderNumericForecastDataset } from "@/utils/forecasts/dataset";
import { getUserContinuousQuartiles } from "@/utils/forecasts/helpers";
import {
  computeQuartilesFromCDF,
  nominalLocationToCdfLocation,
  scaleInternalLocation,
} from "@/utils/math";

const LEFT_MIN = -0.15;
const RIGHT_MAX = 1.15;
const MIN_SLIDER_SPACING = 0.05;
const SEARCH_RADII = [0.35, 0.18, 0.08, 0.03, 0.01];

type NormalizedSliderParams = {
  left: number;
  center: number;
  right: number;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function buildSliderParams({
  left,
  center,
  right,
}: NormalizedSliderParams): DistributionSliderComponent {
  const leftValue =
    LEFT_MIN + left * (RIGHT_MAX - LEFT_MIN - 2 * MIN_SLIDER_SPACING);
  const centerValue =
    leftValue +
    MIN_SLIDER_SPACING +
    center * (RIGHT_MAX - leftValue - 2 * MIN_SLIDER_SPACING);
  const rightValue =
    centerValue +
    MIN_SLIDER_SPACING +
    right * (RIGHT_MAX - centerValue - MIN_SLIDER_SPACING);

  return {
    left: leftValue,
    center: centerValue,
    right: rightValue,
    weight: 1,
  };
}

function scoreSliderParams(
  candidate: NormalizedSliderParams,
  question: Question,
  q1: number,
  q2: number,
  q3: number
): number {
  const { left, center, right } = buildSliderParams(candidate);
  const quartiles = getUserContinuousQuartiles(
    [{ left, center, right, weight: 1 }],
    question
  );
  if (!quartiles) {
    return Number.POSITIVE_INFINITY;
  }

  const leftCost =
    quartiles.lower25 <= 0 && 0 < q1
      ? 1e6
      : q1 < 1 && 1 <= quartiles.lower25
        ? 1e6
        : (quartiles.lower25 - q1) ** 2;
  const centerCost =
    quartiles.median <= 0 && 0 < q2
      ? 1e6
      : q2 < 1 && 1 <= quartiles.median
        ? 1e6
        : (quartiles.median - q2) ** 2;
  const rightCost =
    quartiles.upper75 <= 0 && 0 < q3
      ? 1e6
      : q3 < 1 && 1 <= quartiles.upper75
        ? 1e6
        : (quartiles.upper75 - q3) ** 2;

  return leftCost + centerCost + rightCost;
}

function searchSliderParams(
  q1: number,
  q2: number,
  q3: number,
  question: Question
): NormalizedSliderParams {
  let best: NormalizedSliderParams = {
    left: clamp01(q1),
    center: clamp01(q2),
    right: clamp01(q3),
  };
  let bestScore = scoreSliderParams(best, question, q1, q2, q3);

  for (const radius of SEARCH_RADII) {
    const offsets = [-radius, -radius / 2, 0, radius / 2, radius];

    for (const leftOffset of offsets) {
      for (const centerOffset of offsets) {
        for (const rightOffset of offsets) {
          const candidate = {
            left: clamp01(best.left + leftOffset),
            center: clamp01(best.center + centerOffset),
            right: clamp01(best.right + rightOffset),
          };
          const score = scoreSliderParams(candidate, question, q1, q2, q3);
          if (score < bestScore) {
            best = candidate;
            bestScore = score;
          }
        }
      }
    }
  }

  return best;
}

/**
 * if user already have table forecast and want to switch to slider forecast tab
 */
export function getSliderDistributionFromQuantiles(
  component: DistributionQuantileComponent,
  question: Question
): DistributionSliderComponent[] {
  const q1 = nominalLocationToCdfLocation(
    component.find((c) => c.quantile === Quantile.q1)?.value ?? 0,
    question
  );
  const q2 = nominalLocationToCdfLocation(
    component.find((c) => c.quantile === Quantile.q2)?.value ?? 0,
    question
  );
  const q3 = nominalLocationToCdfLocation(
    component.find((c) => c.quantile === Quantile.q3)?.value ?? 0,
    question
  );

  const result = buildSliderParams(searchSliderParams(q1, q2, q3, question));
  return [
    {
      ...result,
    },
  ];
}

/**
 * if user have slider forecast and want to switch to table forecast tab
 */
export function getQuantilesDistributionFromSlider(
  components: DistributionSliderComponent[],
  question: QuestionWithNumericForecasts,
  isDirty: boolean = false
): DistributionQuantileComponent {
  const cdf = getSliderNumericForecastDataset(components, question).cdf;
  const quartiles = computeQuartilesFromCDF(cdf);
  const firstCdfValue = cdf[0] ?? 0;
  const p0 = Number((firstCdfValue * 100).toFixed(2));
  const lastCdfValue = cdf[cdf.length - 1] ?? 1;
  const p4 = Number(((1 - lastCdfValue) * 100).toFixed(2));
  return [
    {
      quantile: Quantile.lower,
      value: p0,
      isDirty: isDirty,
    },
    {
      quantile: Quantile.q1,
      value: Number(
        scaleInternalLocation(quartiles.lower25, question.scaling).toFixed(2)
      ),
      isDirty: isDirty,
    },
    {
      quantile: Quantile.q2,
      value: Number(
        scaleInternalLocation(quartiles.median, question.scaling).toFixed(2)
      ),
      isDirty: isDirty,
    },
    {
      quantile: Quantile.q3,
      value: Number(
        scaleInternalLocation(quartiles.upper75, question.scaling).toFixed(2)
      ),
      isDirty: isDirty,
    },
    {
      quantile: Quantile.upper,
      value: p4,
      isDirty: isDirty,
    },
  ];
}
