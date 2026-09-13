import {
  AggregationMethod,
  DistributionQuantileComponent,
  Quantile,
  QuestionType,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getSliderNumericForecastDataset } from "@/utils/forecasts/dataset";
import { getSliderDistributionFromQuantiles } from "@/utils/forecasts/switch_forecast_type";
import { computeQuartilesFromCDF } from "@/utils/math";

function makeQuestion(): QuestionWithNumericForecasts {
  return {
    id: 1,
    title: "Test question",
    description: "",
    created_at: "",
    updated_at: "",
    scheduled_close_time: "",
    scheduled_resolve_time: "",
    type: QuestionType.Numeric,
    scaling: {
      range_min: 0,
      range_max: 100,
      zero_point: null,
    },
    open_lower_bound: false,
    open_upper_bound: false,
    inbound_outcome_count: 200,
    resolution: null,
    include_bots_in_aggregates: false,
    question_weight: 1,
    default_score_type: "peer",
    default_aggregation_method: AggregationMethod.recency_weighted,
    fine_print: null,
    resolution_criteria: null,
    label: "",
    unit: "",
    author_username: "",
    post_id: 1,
    aggregations: {
      recency_weighted: { history: [], latest: undefined },
      unweighted: { history: [], latest: undefined },
      single_aggregation: { history: [], latest: undefined },
      metaculus_prediction: { history: [], latest: undefined },
    },
    my_forecasts: undefined,
    my_forecast: undefined,
  };
}

function makeQuantiles(q1: number, q2: number, q3: number) {
  return [
    { quantile: Quantile.lower, value: 0, isDirty: false },
    { quantile: Quantile.q1, value: q1, isDirty: false },
    { quantile: Quantile.q2, value: q2, isDirty: false },
    { quantile: Quantile.q3, value: q3, isDirty: false },
    { quantile: Quantile.upper, value: 0, isDirty: false },
  ] satisfies DistributionQuantileComponent;
}

function convertToSliderQuartiles(q1: number, q2: number, q3: number) {
  const question = makeQuestion();
  const slider = getSliderDistributionFromQuantiles(
    makeQuantiles(q1, q2, q3),
    question
  );

  expect(slider).toHaveLength(1);
  const component = slider[0];
  expect(component).toBeDefined();
  if (!component) {
    throw new Error("Expected slider component");
  }
  expect(component.left).toBeLessThan(component.center);
  expect(component.center).toBeLessThan(component.right);

  const { cdf } = getSliderNumericForecastDataset(slider, question);
  return computeQuartilesFromCDF(cdf);
}

describe("getSliderDistributionFromQuantiles", () => {
  it.each([
    { label: "balanced", q1: 25, q2: 50, q3: 75, maxError: 0.05 },
    { label: "narrow cluster", q1: 25, q2: 30, q3: 35, maxError: 0.05 },
    { label: "moderately left-skewed", q1: 15, q2: 30, q3: 70, maxError: 0.1 },
    { label: "very left-skewed", q1: 10, q2: 20, q3: 80, maxError: 0.25 },
    { label: "very wide uncertainty", q1: 5, q2: 50, q3: 95, maxError: 0.25 },
  ])(
    "returns a valid slider distribution near the input quartiles for $label",
    ({ q1, q2, q3, maxError }) => {
      const quartiles = convertToSliderQuartiles(q1, q2, q3);

      expect(quartiles.lower25).toBeLessThan(quartiles.median);
      expect(quartiles.median).toBeLessThan(quartiles.upper75);
      expect(Math.abs(quartiles.lower25 - q1 / 100)).toBeLessThanOrEqual(
        maxError
      );
      expect(Math.abs(quartiles.median - q2 / 100)).toBeLessThanOrEqual(
        maxError
      );
      expect(Math.abs(quartiles.upper75 - q3 / 100)).toBeLessThanOrEqual(
        maxError
      );
    }
  );
});
