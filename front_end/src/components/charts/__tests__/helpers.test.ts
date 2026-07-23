import { TimelineChartZoomOption } from "@/types/charts";
import {
  AggregateForecastHistory,
  AggregationMethod,
  QuestionType,
} from "@/types/question";

import { buildNumericChartData } from "../helpers";

describe("buildNumericChartData", () => {
  it("renders the same nice boundary ticks as group and fan timelines", () => {
    const forecast = {
      question_id: 1,
      start_time: 100,
      end_time: null,
      forecast_values: [],
      interval_lower_bounds: [0.0042],
      centers: [0.08],
      interval_upper_bounds: [0.1314],
      method: AggregationMethod.recency_weighted,
      forecaster_count: 10,
      means: null,
      histogram: null,
    };
    const aggregation: AggregateForecastHistory = {
      history: [forecast],
      latest: forecast,
    };

    const chart = buildNumericChartData({
      questionType: QuestionType.Numeric,
      actualCloseTime: 200_000,
      scaling: {
        range_min: 1899,
        range_max: 120000,
        zero_point: null,
      },
      height: 216,
      aggregation,
      aggregationIndex: 0,
      width: 516,
      zoom: TimelineChartZoomOption.All,
      forceYTickCount: 5,
      alwaysShowYTicks: true,
    });

    expect({
      labels: chart.yScale.ticks.map((tick) => chart.yScale.tickFormat(tick)),
      yDomain: chart.yDomain,
    }).toEqual({
      labels: ["2500", "5000", "10k", "15k", "20k", "25k"],
      yDomain: [0, 0.195604],
    });
  });

  it("uses timeline y-domain options for numeric timelines", () => {
    const forecast = {
      question_id: 1,
      start_time: 100,
      end_time: null,
      forecast_values: [],
      interval_lower_bounds: [0.1],
      centers: [0.5],
      interval_upper_bounds: [0.9],
      method: AggregationMethod.recency_weighted,
      forecaster_count: 10,
      means: null,
      histogram: null,
    };
    const aggregation: AggregateForecastHistory = {
      history: [forecast],
      latest: forecast,
    };

    const chart = buildNumericChartData({
      questionType: QuestionType.Numeric,
      actualCloseTime: 200_000,
      scaling: {
        range_min: 0,
        range_max: 100,
        zero_point: null,
      },
      height: 216,
      aggregation,
      aggregationIndex: 0,
      width: 516,
      zoom: TimelineChartZoomOption.All,
      forceYTickCount: 5,
      alwaysShowYTicks: true,
      yDomainOptions: {
        scope: "fullHistory",
        source: "centers",
        paddingRatio: 0.1,
      },
    });

    expect({
      labels: chart.yScale.ticks.map((tick) => chart.yScale.tickFormat(tick)),
      yDomain: chart.yDomain,
    }).toEqual({
      labels: ["45", "47.5", "50", "52.5", "55"],
      yDomain: [0.45, 0.55],
    });
  });
});
