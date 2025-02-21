import { format, fromUnixTime } from "date-fns";
import { isNil, round } from "lodash";
import * as math from "mathjs";

import { ForecastInputType } from "@/types/charts";
import {
  CurveChoiceOption,
  CurveQuestionLabels,
  DistributionQuantile,
  DistributionQuantileComponent,
  DistributionSlider,
  DistributionSliderComponent,
  Quantile,
  Question,
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
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
        (location - range_min) * (derivRatio - 1) + (range_max - range_min)
      ) -
        Math.log(range_max - range_min)) /
      Math.log(derivRatio)
    );
  }
  return (location - range_min) / (range_max - range_min);
}

export function generateQuantileContinuousCdf(
  quantiles: { quantile: number; value: number }[],
  probBelowLower: number,
  probAboveUpper: number,
  question: Question
) {
  const { range_min, range_max } = question.scaling;
  if (range_min === null || range_max === null) {
    throw new Error("range_min and range_max must be defined");
  }

  // create a sorted list of known points
  const scaledQuantiles: { quantile: number; value: number }[] = [];
  quantiles.forEach(({ quantile, value }) => {
    const scaledValue = nominalLocationToCdfLocation(value, question);
    scaledQuantiles.push({
      quantile: quantile,
      value: scaledValue,
    });
  });

  // TODO: change values and types for quantiles
  // QUESTION: dissapointed about boundaries values and quantile values usage
  scaledQuantiles.push({ quantile: probBelowLower, value: 0 });
  scaledQuantiles.push({ quantile: 100 - probAboveUpper, value: 1 });
  scaledQuantiles.sort((a, b) => a.value - b.value);

  // check validity
  // QUESTION: why do we do this check in that way
  const firstPoint = scaledQuantiles[0];
  const lastPoint = scaledQuantiles[scaledQuantiles.length - 1];
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let previous = scaledQuantiles[0]!;
    for (let i = 1; i < scaledQuantiles.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const current = scaledQuantiles[i]!;
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
  for (let i = 0; i < 201; i++) {
    const cdfValue = getCdfAt(i / 200);
    !isNil(cdfValue) ? cdf.push(cdfValue) : undefined;
  }

  return cdf;
}

export function standardizeCdf(cdf: number[], question: Question) {
  if (cdf.length === 0) {
    return [];
  }
  const { open_upper_bound, open_lower_bound } = question;
  const scaleLowerTo = open_lower_bound ? 0 : cdf[0] ?? 0;
  const scaleUpperTo = open_upper_bound ? 1 : cdf[cdf.length - 1] ?? 1;
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
    const cdfValue = cdf[i];
    if (typeof cdfValue !== "number") continue;

    const standardizedF = standardize(cdfValue, i / (cdf.length - 1));
    standardizedCdf.push(Math.round(standardizedF * 1e10) / 1e10);
  }
  return standardizedCdf;
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

  // find() should always return a value
  const cdf = generateQuantileContinuousCdf(
    [
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
    components.find((c) => c.quantile === Quantile.lower)?.value ?? 0,
    components.find((c) => c.quantile === Quantile.upper)?.value ?? 0,
    question
  );

  const standardizedCdf = standardizeCdf(cdf, question);

  return {
    cdf: standardizedCdf,
    pmf: cdfToPmf(standardizedCdf),
  };
}

// if user already have table forecast and want to switch to slider forecast tab
export function getSliderDistributionFromQuantiles(
  component: DistributionQuantileComponent,
  question: Question
): DistributionSliderComponent[] {
  return [
    {
      left: nominalLocationToCdfLocation(
        component.find((c) => c.quantile === Quantile.q1)?.value ?? 0,
        question
      ),
      center: nominalLocationToCdfLocation(
        component.find((c) => c.quantile === Quantile.q2)?.value ?? 0,
        question
      ),
      right: nominalLocationToCdfLocation(
        component.find((c) => c.quantile === Quantile.q3)?.value ?? 0,
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
  components: DistributionSliderComponent[],
  question: QuestionWithNumericForecasts
): DistributionQuantileComponent {
  const cdf = getNumericForecastDataset(
    components,
    question.open_lower_bound,
    question.open_upper_bound
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
      isDirty: true,
    },
    {
      quantile: Quantile.q1,
      value: Number(
        scaleInternalLocation(quartiles.lower25, question.scaling).toFixed(2)
      ),
      isDirty: true,
    },
    {
      quantile: Quantile.q2,
      value: Number(
        scaleInternalLocation(quartiles.median, question.scaling).toFixed(2)
      ),
      isDirty: true,
    },
    {
      quantile: Quantile.q3,
      value: Number(
        scaleInternalLocation(quartiles.upper75, question.scaling).toFixed(2)
      ),
      isDirty: true,
    },
    {
      quantile: Quantile.upper,
      value: p4,
      isDirty: true,
    },
  ];
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
  return activeForecast
    ? activeForecast.distribution_input.type === ForecastInputType.Quantile
      ? populateQuantileComponents(
          activeForecastValues?.components as DistributionQuantileComponent
        )
      : getQuantilesDistributionFromSlider(
          activeForecastValues?.components as DistributionSliderComponent[],
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
    activeForecast.distribution_input.type === ForecastInputType.Slider
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

  const dataset = getNumericForecastDataset(
    components,
    !!question.open_lower_bound,
    !!question.open_upper_bound
  );

  return computeQuartilesFromCDF(dataset.cdf);
}
