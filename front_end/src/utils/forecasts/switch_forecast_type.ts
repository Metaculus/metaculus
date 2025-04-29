import { uncmin } from "numeric";

import {
  DefaultInboundOutcomeCount,
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

  const initialParams = [0.4, 0.5, 0.6];

  const costFunc = (params: number[]) => {
    const quartiles = getUserContinuousQuartiles(
      [
        {
          left: params.at(0) ?? 0.4,
          center: params.at(1) ?? 0.5,
          right: params.at(2) ?? 0.6,
          weight: 1,
        },
      ],
      question
    );

    if (!quartiles) {
      return 1e10;
    }
    const leftCost =
      quartiles.lower25 >= 0
        ? quartiles.lower25 < 1
          ? (quartiles.lower25 - q1) ** 2
          : quartiles.lower25
        : 1 - quartiles.lower25;
    const centerCost =
      quartiles.median >= 0
        ? quartiles.median < 1
          ? (quartiles.median - q2) ** 2
          : quartiles.median
        : 1 - quartiles.median;
    const rightCost =
      quartiles.upper75 >= 0
        ? quartiles.upper75 < 1
          ? (quartiles.upper75 - q3) ** 2
          : quartiles.upper75
        : 1 - quartiles.upper75;

    return leftCost + centerCost + rightCost;
  };

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
  const cdf = getSliderNumericForecastDataset(
    components,
    question.open_lower_bound,
    question.open_upper_bound,
    question.inbound_outcome_count ?? DefaultInboundOutcomeCount
  ).cdf;
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
