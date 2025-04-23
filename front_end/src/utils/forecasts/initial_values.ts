import { round } from "lodash";

import { ContinuousForecastInputType } from "@/types/charts";
import {
  DistributionQuantile,
  DistributionQuantileComponent,
  DistributionSlider,
  DistributionSliderComponent,
  Quantile,
  Question,
  QuestionWithNumericForecasts,
  UserForecast,
} from "@/types/question";
import {
  getNormalizedContinuousForecast,
  populateQuantileComponents,
} from "@/utils/forecasts/helpers";
import {
  getQuantilesDistributionFromSlider,
  getSliderDistributionFromQuantiles,
} from "@/utils/forecasts/switch_forecast_type";

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
