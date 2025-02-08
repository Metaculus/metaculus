import { format, fromUnixTime } from "date-fns";
import { isNil, round } from "lodash";
import * as math from "mathjs";

import { ForecastInputType } from "@/types/charts";
import {
  CurveChoiceOption,
  CurveQuestionLabels,
  DistributionQuantile,
  DistributionQuantileComponent,
  DistributionQuantileComponentWithState,
  DistributionSlider,
  DistributionSliderComponent,
  Question,
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
  Scaling,
  UserForecast,
} from "@/types/question";
import {
  cdfFromSliders,
  cdfToPmf,
  computeQuartilesFromCDF,
} from "@/utils/math";
import { abbreviatedNumber } from "@/utils/number_formatters";
import { scaleInternalLocation } from "./charts";

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

export function getForecastDateDisplayValue(value: number) {
  return format(fromUnixTime(value), "d MMM yyyy");
}

export function formatPrediction(
  prediction: number,
  questionType: QuestionType
) {
  switch (questionType) {
    case QuestionType.Numeric:
      return getForecastNumericDisplayValue(prediction);
    case QuestionType.Binary:
      return getForecastPctDisplayValue(prediction);
    case QuestionType.Date:
      return getForecastDateDisplayValue(prediction);
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
  prevForecast: DistributionSlider | DistributionQuantile | undefined
): DistributionSlider | DistributionQuantile | undefined {
  if (typeof prevForecast !== "object" || prevForecast === null) {
    return undefined;
  }

  if ("type" in prevForecast && "components" in prevForecast) {
    return prevForecast;
  }
}

export function getNumericForecastDataset(
  components: DistributionSliderComponent[],
  lowerOpen: boolean,
  upperOpen: boolean
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
          upperOpen
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
        (location - range_min) / (derivRatio - 1) + (range_max - range_min)
      ) -
        Math.log(range_max - range_min)) /
      Math.log(derivRatio)
    );
  }
  return (location - range_min) / (range_max - range_min);
}

export function generateContinuousCdf(
  percentiles: { percentile: number; value: number }[],
  probBelowLower: number,
  probAboveUpper: number,
  question: Question
) {
  const { range_min, range_max } = question.scaling;
  if (range_min === null || range_max === null) {
    throw new Error("range_min and range_max must be defined");
  }

  // create a sorted list of known points
  const scaledPercentiles: { percentile: number; value: number }[] = [];
  percentiles.forEach(({ percentile, value }) => {
    const scaledValue = nominalLocationToCdfLocation(value, question);
    scaledPercentiles.push({
      percentile: percentile,
      value: scaledValue,
    });
  });
  scaledPercentiles.push({ percentile: probBelowLower, value: 0 });
  scaledPercentiles.push({ percentile: 1 - probAboveUpper, value: 1 });
  scaledPercentiles.sort((a, b) => a.value - b.value);

  // check validity
  const firstPoint = scaledPercentiles[0];
  const lastPoint = scaledPercentiles[scaledPercentiles.length - 1];
  if (
    !firstPoint ||
    firstPoint.value > 0 ||
    !lastPoint ||
    lastPoint.value < 1
  ) {
    // TODO: present some error: e.g. "The given percentiles must emcompass upper and lower bounds"
    return [];
  }

  function getCdfAt(location: number) {
    let previous = scaledPercentiles[0]!;
    for (let i = 1; i < scaledPercentiles.length; i++) {
      const current = scaledPercentiles[i]!;
      if (previous.value <= location && location <= current.value) {
        return (
          previous.percentile +
          ((current.percentile - previous.percentile) *
            (location - previous.value)) /
            (current.value - previous.value)
        );
      }
      previous = current;
    }
  }

  const cdf = [];
  for (let i = 0; i < 201; i++) {
    cdf.push(getCdfAt(i / 200));
  }
  console.log({ cdf });
  return cdf;
}

export function standardizeCdf(cdf: number[], question: Question) {
  if (cdf.length === 0) {
    return [];
  }
  const { open_upper_bound, open_lower_bound } = question;
  const scaleLowerTo = (open_lower_bound ? 0 : cdf[0])!;
  const scaleUpperTo = (open_upper_bound ? 1 : cdf[cdf.length - 1])!;
  const rescaledInboundMass = scaleUpperTo - scaleLowerTo;

  function standardize(F: number, location: number) {
    // rescale
    const rescaledF = (F - scaleLowerTo) / rescaledInboundMass;
    // offset
    if (open_lower_bound && open_upper_bound) {
      return 0.988 * rescaledF + 0.01 * location + 0.001;
    } else if (open_lower_bound) {
      return 0.989 * rescaledF + 0.01 * location + 0.001;
    } else if (open_upper_bound) {
      return 0.989 * rescaledF + 0.01 * location;
    } else {
      return 0.99 * rescaledF + 0.01 * location;
    }
  }

  const standardizedCdf: number[] = [];
  for (let i = 0; i < cdf.length; i++) {
    const standardizedF = standardize(cdf[i]!, i / (cdf.length - 1));
    standardizedCdf.push(Math.round(standardizedF * 1e10) / 1e10);
  }
  return standardizedCdf;
}

// get chart data from quantiles input
export function getQuantileNumericForecastDataset(
  components:
    | DistributionQuantileComponentWithState[]
    | DistributionQuantileComponent[],
  question: Question
) {
  const componentData = components[0];
  if (
    !componentData ||
    Object.values(componentData).some((quartile) => isNil(quartile.value))
  ) {
    return {
      cdf: [],
      pmf: [],
    };
  }

  const cdf = generateContinuousCdf(
    [
      { percentile: 0.25, value: componentData.q1.value },
      { percentile: 0.5, value: componentData.q2.value },
      { percentile: 0.75, value: componentData.q3.value },
    ],
    componentData.p0.value,
    componentData.p4.value,
    question
  );

  const standardizedCdf = standardizeCdf(cdf, question);

  return {
    cdf: standardizedCdf,
    pmf: cdfToPmf(standardizedCdf),
  };
}

// TODO: Implement this funcion
// if user already have table forecast and want to switch to slider forecast tab
export function getSliderDistributionFromQuantiles(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  components:
    | DistributionQuantileComponentWithState[]
    | DistributionQuantileComponent[],
  question: Question
): DistributionSliderComponent[] {
  const component = components[0];
  return [
    {
      left: nominalLocationToCdfLocation(
        component.q1.value ?? component.q1,
        question
      ),
      center: nominalLocationToCdfLocation(
        component.q2.value ?? component.q2,
        question
      ),
      right: nominalLocationToCdfLocation(
        component.q3.value ?? component.q3,
        question
      ),
      weight: 1,
    },
  ];
}

// if user have slider forecast and want to switch to table forecast tab
// /questions/31701/97th-academy-awards-winners-average-duration/ numeric question
// /questions/3479/date-weakly-general-ai-is-publicly-known/ date question
export function getQuantilesDistributionFromSlider(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  components: DistributionSliderComponent[],
  question: QuestionWithNumericForecasts
): DistributionQuantileComponentWithState[] {
  const cdf = getNumericForecastDataset(
    components,
    question.open_lower_bound,
    question.open_upper_bound
  ).cdf;
  const quartiles = computeQuartilesFromCDF(cdf);
  const p0 = cdf[0];
  const p4 = 1 - cdf[cdf.length - 1];
  return [
    {
      p0: { value: p0, isDirty: false },
      q1: {
        value: scaleInternalLocation(quartiles.lower25, question.scaling),
        isDirty: true,
      },
      q2: {
        value: scaleInternalLocation(quartiles.median, question.scaling),
        isDirty: true,
      },
      q3: {
        value: scaleInternalLocation(quartiles.upper75, question.scaling),
        isDirty: true,
      },
      p4: { value: p4, isDirty: false },
    },
  ];
}

export function populateQuantileComponents(
  components: DistributionQuantileComponent[]
): DistributionQuantileComponentWithState[] {
  return components.map((component) => ({
    p0: {
      value: component.p0 * 100,
      isDirty: false,
    },

    q1: { value: component.q1, isDirty: false },
    q2: { value: component.q2, isDirty: false },
    q3: { value: component.q3, isDirty: false },
    p4: {
      value: component.p4 * 100,
      isDirty: false,
    },
  }));
}

export function clearQuantileComponents(
  components: DistributionQuantileComponentWithState[]
): DistributionQuantileComponent[] {
  return components.map((component) => ({
    p0: component.p0.value ? component.p0.value / 100 : 0,
    q1: component.q1.value ?? 0,
    q2: component.q2.value ?? 0,
    q3: component.q3.value ?? 0,
    p4: component.p4.value ? component.p4.value / 100 : 1,
  }));
}

export function getInitialQuantileDistributionComponents(
  activeForecast: UserForecast | undefined,
  activeForecastValues: DistributionSlider | DistributionQuantile | undefined,
  question: QuestionWithNumericForecasts
) {
  return activeForecast
    ? activeForecast.distribution_input.type === ForecastInputType.Quantile
      ? populateQuantileComponents(
          activeForecastValues?.components as DistributionQuantileComponent[]
        )
      : getQuantilesDistributionFromSlider(
          activeForecastValues?.components as DistributionSliderComponent[],
          question
        )
    : [
        {
          p0: {
            value: question.open_lower_bound ? undefined : 0,
            isDirty: false,
          },
          q1: { value: undefined, isDirty: false },
          q2: { value: undefined, isDirty: false },
          q3: { value: undefined, isDirty: false },
          p4: {
            value: question.open_upper_bound ? undefined : 1,
            isDirty: false,
          },
        },
      ];
}

export function getInitialSliderDistributionComponents(
  activeForecast: UserForecast | undefined,
  activeForecastValues: DistributionSlider | DistributionQuantile | undefined,
  question: Question
) {
  return !activeForecast ||
    activeForecast.distribution_input.type === ForecastInputType.Slider
    ? getNormalizedContinuousForecast(
        activeForecastValues?.components as DistributionSliderComponent[]
      )
    : getSliderDistributionFromQuantiles(
        activeForecastValues?.components as DistributionQuantileComponent[],
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
  openLower?: boolean,
  openUpper?: boolean
) {
  if (
    !components ||
    !components.length ||
    typeof openLower === "undefined" ||
    typeof openUpper === "undefined"
  ) {
    return null;
  }

  const dataset = getNumericForecastDataset(components, openLower, openUpper);
  return computeQuartilesFromCDF(dataset.cdf);
}
