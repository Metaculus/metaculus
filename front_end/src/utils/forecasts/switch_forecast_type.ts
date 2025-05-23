import { uncmin } from "numeric";

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

  const costFunc = (params: number[]) => {
    const BIG = 1e6;
    const leftMin = -0.15;
    const rightMax = 1.15;
    const minSliderSpacing = 0.05;

    const left = params.at(0) ?? 0.4;
    const center = params.at(1) ?? 0.5;
    const right = params.at(2) ?? 0.6;

    // ---- hard-bounds & spacing penalties ------------------------------------
    let P = 0;
    if (left < leftMin) P += BIG * (leftMin - left) ** 2;
    if (center < leftMin) P += BIG * (leftMin - center) ** 2;
    if (right < leftMin) P += BIG * (leftMin - right) ** 2;
    if (left > rightMax) P += BIG * (left - rightMax) ** 2;
    if (center > rightMax) P += BIG * (center - rightMax) ** 2;
    if (right > rightMax) P += BIG * (right - rightMax) ** 2;
    if (center - left < minSliderSpacing)
      P += BIG * (minSliderSpacing - (center - left)) ** 2;
    if (right - center < minSliderSpacing)
      P += BIG * (minSliderSpacing - (right - center)) ** 2;

    // ---- quartile error -----------------------------------------------------
    const quartiles = getUserContinuousQuartiles(
      [{ left, right, center, weight: 1 }],
      question
    );
    if (!quartiles) {
      return 1e10;
    }
    const leftCost =
      quartiles.lower25 <= 0 && 0 < q1
        ? BIG
        : q1 < 1 && 1 <= quartiles.lower25
          ? BIG
          : (quartiles.lower25 - q1) ** 2;
    const centerCost =
      quartiles.median <= 0 && 0 < q2
        ? BIG
        : q2 < 1 && 1 <= quartiles.median
          ? BIG
          : (quartiles.median - q2) ** 2;
    const rightCost =
      quartiles.upper75 <= 0 && 0 < q3
        ? BIG
        : q3 < 1 && 1 <= quartiles.upper75
          ? BIG
          : (quartiles.upper75 - q3) ** 2;

    const E = leftCost + centerCost + rightCost;
    return E + P;
  };

  const initialParams = [0.4, 0.5, 0.6];
  const result = uncmin(costFunc, initialParams);
  return [
    {
      left: result.solution.at(0) ?? 0.4,
      center: result.solution.at(1) ?? 0.5,
      right: result.solution.at(2) ?? 0.6,
      weight: 1,
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
