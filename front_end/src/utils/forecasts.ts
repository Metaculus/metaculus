import { format, fromUnixTime } from "date-fns";
import { isNil, round } from "lodash";
import * as math from "mathjs";
import { uncmin } from "numeric";

import { ValidationErrorKey } from "@/app/(main)/questions/[id]/components/forecast_maker/helpers";
import { ContinuousForecastInputType } from "@/types/charts";
import {
  CurveChoiceOption,
  CurveQuestionLabels,
  DefaultInboundOutcomeCount,
  DistributionQuantile,
  DistributionQuantileComponent,
  DistributionSlider,
  DistributionSliderComponent,
  Quantile,
  Question,
  QuestionType,
  QuestionWithForecasts,
  Scaling,
  QuestionWithNumericForecasts,
  UserForecast,
} from "@/types/question";
import {
  cdfFromSliders,
  cdfToPmf,
  computeQuartilesFromCDF,
} from "@/utils/math";
import { abbreviatedNumber } from "@/utils/number_formatters";
import { formatValueUnit } from "@/utils/questions";

import { getQuestionDateFormatString, scaleInternalLocation } from "./charts";

export function getForecastPctDisplayValue(
  value: number | string | null | undefined
) {
  if (isNil(value)) {
    return "?";
  }
  return `${Math.round(Number(value) * 100 * 100) / 100}%`;
}

export function getForecastNumericDisplayValue(value: number | string) {
  return abbreviatedNumber(value);
}

export function getForecastDateDisplayValue(
  value: number,
  scaling?: Scaling,
  actual_resolve_time?: string | null
) {
  return format(
    fromUnixTime(value),
    scaling
      ? getQuestionDateFormatString({
          scaling,
          actual_resolve_time: actual_resolve_time ?? null,
          valueTimestamp: value,
        })
      : "d MMM yyyy"
  );
}

export function formatPrediction(
  prediction: number,
  questionType: QuestionType,
  scaling?: Scaling,
  unit?: string | undefined
) {
  switch (questionType) {
    case QuestionType.Numeric:
    case QuestionType.Discrete:
      return formatValueUnit(getForecastNumericDisplayValue(prediction), unit);
    case QuestionType.Binary:
      return getForecastPctDisplayValue(prediction);
    case QuestionType.Date:
      return getForecastDateDisplayValue(prediction, scaling);
    default:
      return prediction.toString();
  }
}

export function extractPrevBinaryForecastValue(
  prevForecast: unknown
): number | null {
  return typeof prevForecast === "number" ? round(prevForecast * 100, 1) : null;
}

export function extractPrevNumericForecastValue(
  prevForecast: DistributionSlider | DistributionQuantile | null | undefined
): DistributionSlider | DistributionQuantile | undefined {
  if (typeof prevForecast !== "object" || prevForecast === null) {
    return undefined;
  }

  if ("type" in prevForecast && "components" in prevForecast) {
    return prevForecast;
  }
}

export function getSliderNumericForecastDataset(
  components: DistributionSliderComponent[],
  lowerOpen: boolean,
  upperOpen: boolean,
  inboundOutcomeCount: number
) {
  const weights = components.map(({ weight }) => weight);
  const normalizedWeights = weights.map(
    (x) => x / weights.reduce((a, b) => a + b)
  );

  const componentCdfs = components.map(
    (component, index) =>
      math.multiply(
        cdfFromSliders(
          component.left,
          component.center,
          component.right,
          lowerOpen,
          upperOpen,
          inboundOutcomeCount
        ),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        normalizedWeights[index]!
      ) as unknown as number[]
  );
  let cdf = componentCdfs.reduce((acc, componentCdf) =>
    math.add(acc, componentCdf)
  );
  cdf = cdf.map((F) => Number(F));

  // standardize cdf
  const cdfOffset =
    lowerOpen && upperOpen
      ? (F: number, x: number) => 0.988 * F + 0.01 * x + 0.001
      : lowerOpen
        ? (F: number, x: number) => 0.989 * F + 0.01 * x + 0.001
        : upperOpen
          ? (F: number, x: number) => 0.989 * F + 0.01 * x
          : (F: number, x: number) => 0.99 * F + 0.01 * x;
  cdf = cdf.map(
    (F, index) =>
      Math.round(cdfOffset(F, index / (cdf.length - 1)) * 1e10) / 1e10
  );

  return {
    cdf: cdf,
    pmf: cdfToPmf(cdf),
    componentCdfs: componentCdfs,
  };
}

export function nominalLocationToCdfLocation(
  location: number,
  question: Question
) {
  const { range_min, range_max, zero_point } = question.scaling;
  if (range_min === null || range_max === null) {
    throw new Error("range_min and range_max must be defined");
  }
  if (zero_point !== null) {
    const derivRatio = (range_max - zero_point) / (range_min - zero_point);
    return (
      (Math.log(
        (location - range_min) * (derivRatio - 1) + (range_max - range_min)
      ) -
        Math.log(range_max - range_min)) /
      Math.log(derivRatio)
    );
  }
  return (location - range_min) / (range_max - range_min);
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

export function generateQuantileContinuousCdf({
  quantiles,
  probBelowLower,
  probAboveUpper,
  question,
}: {
  quantiles: { quantile: number; value: number }[];
  probBelowLower: number;
  probAboveUpper: number;
  question: Question;
}): number[] | string {
  console.log({ quantiles, probBelowLower, probAboveUpper, question });
  const { range_min, range_max } = question.scaling;
  if (range_min === null || range_max === null) {
    return "questionRangeError";
  }
  let value_at_lower = range_min;
  let value_at_upper = range_max;
  if (
    question.type === QuestionType.Discrete &&
    !isNil(question.inbound_outcome_count)
  ) {
    const step_size = (range_max - range_min) / question.inbound_outcome_count;
    value_at_lower = Math.round(1e10 * (range_min + 0.5 * step_size)) / 1e10;
    value_at_upper = Math.round(1e10 * (range_max - 0.5 * step_size)) / 1e10;
  }

  // create a sorted list of known points
  const scaledQuantiles: { quantile: number; value: number }[] = [];
  quantiles.forEach(({ quantile, value }) => {
    const scaledValue = nominalLocationToCdfLocation(
      value <= value_at_lower
        ? range_min
        : value >= value_at_upper
          ? range_max
          : value,
      question
    );
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
  const inBoundOutcomeCount =
    question.inbound_outcome_count || DefaultInboundOutcomeCount;
  for (let i = 0; i < inBoundOutcomeCount + 1; i++) {
    cdfEvalLocs.push(i / inBoundOutcomeCount);
  }

  const hydratedQuantiles = hydrateQuantiles(scaledQuantiles, cdfEvalLocs);
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

  const cdf: number[] = [];
  cdfEvalLocs.forEach((location) => {
    const cdfValue = getCdfAt(location);
    !isNil(cdfValue) ? cdf.push(cdfValue) : undefined;
  });

  return cdf;
}

// get chart data from quantiles input
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
      error: cdf as ValidationErrorKey,
    };
  }
  return {
    cdf: cdf,
    pmf: cdfToPmf(cdf),
  };
}

// if user already have table forecast and want to switch to slider forecast tab
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

// if user have slider forecast and want to switch to table forecast tab
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

export function isAllQuantileComponentsDirty(
  components: DistributionQuantileComponent
): boolean {
  return components.every((component) => {
    if (
      (component.quantile === Quantile.lower ||
        component.quantile === Quantile.upper) &&
      component.value === 0
    ) {
      return true;
    }
    return component.isDirty;
  });
}

export function populateQuantileComponents(
  components: DistributionQuantileComponent
): DistributionQuantileComponent {
  return components.map((component) => ({
    ...component,
    isDirty: false,
  }));
}

export function clearQuantileComponents(
  components: DistributionQuantileComponent
): DistributionQuantileComponent {
  return components.map((component) => ({
    quantile: component.quantile,
    value: component.value,
  }));
}

export function getInitialQuantileDistributionComponents(
  activeForecast: UserForecast | undefined,
  activeForecastValues: DistributionSlider | DistributionQuantile | undefined,
  question: QuestionWithNumericForecasts
): DistributionQuantileComponent {
  return activeForecast && activeForecastValues
    ? activeForecast.distribution_input?.type ===
      ContinuousForecastInputType.Quantile
      ? populateQuantileComponents(
          activeForecastValues.components as DistributionQuantileComponent
        )
      : getQuantilesDistributionFromSlider(
          activeForecastValues.components as DistributionSliderComponent[],
          question
        )
    : [
        {
          quantile: Quantile.lower,
          value: question.open_lower_bound ? undefined : 0,
          isDirty: false,
        },
        {
          quantile: Quantile.q1,
          value: undefined,
          isDirty: false,
        },
        {
          quantile: Quantile.q2,
          value: undefined,
          isDirty: false,
        },
        {
          quantile: Quantile.q3,
          value: undefined,
          isDirty: false,
        },
        {
          quantile: Quantile.upper,
          value: question.open_upper_bound ? undefined : 0,
          isDirty: false,
        },
      ];
}

export function getInitialSliderDistributionComponents(
  activeForecast: UserForecast | undefined,
  activeForecastValues: DistributionSlider | DistributionQuantile | undefined,
  question: Question
) {
  return !activeForecast ||
    !activeForecastValues ||
    activeForecast.distribution_input?.type ===
      ContinuousForecastInputType.Slider
    ? getNormalizedContinuousForecast(
        activeForecastValues?.components as DistributionSliderComponent[]
      )
    : getSliderDistributionFromQuantiles(
        activeForecastValues?.components as DistributionQuantileComponent,
        question
      );
}

export function generateCurveChoiceOptions(
  questions: QuestionWithForecasts[]
): CurveChoiceOption[] {
  return questions
    .map((q) => ({
      id: q.id,
      forecast: q.my_forecasts?.latest?.forecast_values[1] ?? null,
      status: q.status,
      label: q.label,
      isDirty: false,
    }))
    .sort((a, b) => {
      if (a.label.toLowerCase() === CurveQuestionLabels.question) return -1;
      if (b.label.toLowerCase() === CurveQuestionLabels.question) return 1;

      if (a.label.toLowerCase() === CurveQuestionLabels.crowdMedian) return -1;
      if (b.label.toLowerCase() === CurveQuestionLabels.crowdMedian) return 1;

      return 0;
    });
}

export const getNormalizedContinuousForecast = (
  forecast: DistributionSliderComponent[] | null | undefined
): DistributionSliderComponent[] =>
  forecast ?? [
    {
      left: 0.4,
      center: 0.5,
      right: 0.6,
      weight: 1,
    },
  ];

export function getUserContinuousQuartiles(
  components?: DistributionSliderComponent[],
  question?: Question
) {
  if (
    !components?.length ||
    typeof question?.open_lower_bound === "undefined" ||
    typeof question?.open_upper_bound === "undefined"
  ) {
    return null;
  }

  const dataset = getSliderNumericForecastDataset(
    components,
    !!question.open_lower_bound,
    !!question.open_upper_bound,
    question.inbound_outcome_count ?? DefaultInboundOutcomeCount
  );

  return computeQuartilesFromCDF(dataset.cdf);
}

export const isSliderForecast = (
  input: DistributionSlider | DistributionQuantile | null | undefined
): input is DistributionSlider =>
  input?.type === ContinuousForecastInputType.Slider;

export const isQuantileForecast = (
  input: DistributionSlider | DistributionQuantile | null | undefined
): input is DistributionQuantile =>
  input?.type === ContinuousForecastInputType.Quantile;
