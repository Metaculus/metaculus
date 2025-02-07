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

import { getQuestionDateFormatString } from "./charts";

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

export function getForecastDateDisplayValue(value: number, scaling?: Scaling) {
  return format(
    fromUnixTime(value),
    scaling ? getQuestionDateFormatString(scaling) : "d MMM yyyy"
  );
}

export function formatPrediction(
  prediction: number,
  questionType: QuestionType,
  scaling?: Scaling
) {
  switch (questionType) {
    case QuestionType.Numeric:
      return getForecastNumericDisplayValue(prediction);
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

// TODO: Implement this funcion
// get chart data from quantiles input (BE data)
export function getQuintileNumericForecastDataset(
  components:
    | DistributionQuantileComponentWithState[]
    | DistributionQuantileComponent[],
  lowerOpen: boolean,
  upperOpen: boolean
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

  const cdf = [
    lowerOpen ? 0.0010297699 : 0,
    0.0010840266,
    0.001138892,
    0.001194453,
    0.0012508091,
    0.001308074,
    0.0013663775,
    0.0014258683,
    0.0014867159,
    0.0015491143,
    0.0016132853,
    0.0016794821,
    0.0017479942,
    0.0018191526,
    0.0018933354,
    0.0019709747,
    0.0020525642,
    0.0021386684,
    0.0022299319,
    0.0023270916,
    0.0024309893,
    0.0025425866,
    0.0026629825,
    0.0027934322,
    0.0029353695,
    0.0030904321,
    0.0032604905,
    0.0034476805,
    0.003654441,
    0.003883556,
    0.0041382034,
    0.0044220098,
    0.004739113,
    0.0050942327,
    0.0054927509,
    0.0059408028,
    0.0064453792,
    0.0070144427,
    0.0076570583,
    0.0083835396,
    0.0092056132,
    0.0101366026,
    0.0111916323,
    0.012387854,
    0.0137446968,
    0.0152841404,
    0.0170310132,
    0.0190133134,
    0.0212625514,
    0.0238141107,
    0.02670762,
    0.0299873301,
    0.033702482,
    0.0379076511,
    0.0426630457,
    0.0480347313,
    0.0540947483,
    0.0609210775,
    0.0685974053,
    0.0772126273,
    0.0868600267,
    0.0976360558,
    0.1096386499,
    0.122965012,
    0.1377088159,
    0.1539568094,
    0.1717848341,
    0.1912533371,
    0.2124025179,
    0.2352473326,
    0.2597726605,
    0.2859290116,
    0.3136292024,
    0.3427464409,
    0.3731142196,
    0.404528314,
    0.4367510219,
    0.4695175711,
    0.5025443965,
    0.5355387718,
    0.5682091189,
    0.6002752313,
    0.6314776608,
    0.6615856184,
    0.6904029219,
    0.7177717382,
    0.7435740988,
    0.7677313637,
    0.7902019583,
    0.8109777977,
    0.8300798386,
    0.84755318,
    0.8634620757,
    0.8778851456,
    0.8909109893,
    0.9026343311,
    0.9131527552,
    0.9225640408,
    0.930964068,
    0.938445241,
    0.9450953635,
    0.9509968946,
    0.9562265158,
    0.9608549451,
    0.9649469404,
    0.9685614437,
    0.971751825,
    0.9745661928,
    0.977047745,
    0.9792351407,
    0.9811628763,
    0.9828616564,
    0.9843587504,
    0.9856783311,
    0.9868417901,
    0.9878680309,
    0.9887737371,
    0.9895736167,
    0.9902806238,
    0.990906158,
    0.9914602438,
    0.9919516905,
    0.9923882356,
    0.9927766716,
    0.9931229588,
    0.9934323256,
    0.9937093567,
    0.9939580712,
    0.9941819915,
    0.9943842041,
    0.9945674129,
    0.9947339863,
    0.9948859986,
    0.9950252661,
    0.9951533792,
    0.9952717302,
    0.995381538,
    0.9954838696,
    0.9955796589,
    0.9956697233,
    0.9957547782,
    0.9958354496,
    0.9959122855,
    0.9959857653,
    0.9960563086,
    0.9961242826,
    0.9961900085,
    0.9962537675,
    0.9963158055,
    0.9963763377,
    0.9964355525,
    0.9964936146,
    0.9965506683,
    0.9966068396,
    0.9966622389,
    0.9967169628,
    0.9967710957,
    0.9968247117,
    0.9968778752,
    0.9969306431,
    0.9969830646,
    0.9970351833,
    0.9970870369,
    0.9971386586,
    0.9971900774,
    0.9972413188,
    0.9972924048,
    0.997343355,
    0.9973941863,
    0.9974449136,
    0.9974955499,
    0.9975461066,
    0.9975965937,
    0.9976470199,
    0.9976973927,
    0.9977477189,
    0.9977980042,
    0.9978482539,
    0.9978984724,
    0.9979486635,
    0.9979988307,
    0.998048977,
    0.9980991049,
    0.9981492169,
    0.9981993149,
    0.9982494006,
    0.9982994756,
    0.9983495412,
    0.9983995986,
    0.9984496488,
    0.9984996927,
    0.9985497312,
    0.9985997648,
    0.9986497942,
    0.99869982,
    0.9987498425,
    0.9987998622,
    0.9988498794,
    0.9988998945,
    0.9989499077,
    upperOpen ? 0.9989999193 : 1,
  ];

  return {
    cdf: cdf,
    pmf: cdfToPmf(cdf),
  };
}

// TODO: Implement this funcion
// if user already have table forecast and want to switch to slider forecast tab
export function getSliderDistributionFromQuantiles(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  components:
    | DistributionQuantileComponentWithState[]
    | DistributionQuantileComponent[]
): DistributionSliderComponent[] {
  return [
    {
      left: 0.7,
      center: 0.8,
      right: 0.9,
      weight: 1,
    },
  ];
}

// TODO: Implement this function
// if user have slider forecast and want to switch to table forecast tab
// /questions/31701/97th-academy-awards-winners-average-duration/ numeric question
// /questions/3479/date-weakly-general-ai-is-publicly-known/ date question
export function getQuantilesDistributionFromSlider(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  components: DistributionSliderComponent[],
  question: QuestionWithNumericForecasts
): DistributionQuantileComponentWithState[] {
  if (question.type === QuestionType.Numeric) {
    return [
      {
        p0: { value: question.open_lower_bound ? 30 : 0, isDirty: true },
        q1: { value: 80, isDirty: true },
        q2: { value: 110, isDirty: true },
        q3: { value: 150, isDirty: true },
        p4: { value: question.open_upper_bound ? 20 : 100, isDirty: true },
      },
    ];
  }
  if (question.type === QuestionType.Date) {
    return [
      {
        p0: { value: question.open_lower_bound ? 1 : 0, isDirty: true },
        q1: { value: 1585267800, isDirty: true },
        q2: { value: 1738757520, isDirty: true },
        q3: { value: 1738843920, isDirty: true },
        p4: { value: question.open_upper_bound ? 2 : 100, isDirty: true },
      },
    ];
  }
  return [];
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
  activeForecastValues: DistributionSlider | DistributionQuantile | undefined
) {
  return !activeForecast ||
    activeForecast.distribution_input.type === ForecastInputType.Slider
    ? getNormalizedContinuousForecast(
        activeForecastValues?.components as DistributionSliderComponent[]
      )
    : getSliderDistributionFromQuantiles(
        activeForecastValues?.components as DistributionQuantileComponent[]
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
