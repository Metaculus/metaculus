import { TimelineChartZoomOption } from "@/types/charts";
import {
  AggregateForecastHistory,
  AggregationMethod,
  QuestionType,
} from "@/types/question";

import { buildNumericChartData } from "../helpers";

describe("buildNumericChartData", () => {
  it("uses uncertainty intervals with no span padding by default", () => {
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
      labels: ["5000", "10k", "15k", "20k"],
      yDomain: [0.0042, 0.153267],
    });
  });

  it("rescales the default y-domain to the selected time window", () => {
    const earlierForecast = {
      question_id: 1,
      start_time: 100,
      end_time: 200_000,
      forecast_values: [],
      interval_lower_bounds: [0.1],
      centers: [0.4],
      interval_upper_bounds: [0.5],
      method: AggregationMethod.recency_weighted,
      forecaster_count: 10,
      means: null,
      histogram: null,
    };
    const latestForecast = {
      ...earlierForecast,
      start_time: 200_000,
      end_time: null,
      interval_lower_bounds: [0.5],
      centers: [0.6],
      interval_upper_bounds: [0.7],
    };
    const aggregation: AggregateForecastHistory = {
      history: [earlierForecast, latestForecast],
      latest: latestForecast,
    };
    const buildChart = (zoom: TimelineChartZoomOption) =>
      buildNumericChartData({
        questionType: QuestionType.Numeric,
        actualCloseTime: 300_000_000,
        scaling: {
          range_min: 0,
          range_max: 100,
          zero_point: null,
        },
        height: 216,
        aggregation,
        aggregationIndex: 0,
        width: 516,
        zoom,
        forceYTickCount: 5,
        alwaysShowYTicks: true,
      });

    const allHistoryChart = buildChart(TimelineChartZoomOption.All);
    const oneDayChart = buildChart(TimelineChartZoomOption.OneDay);

    expect(allHistoryChart.yDomain).toEqual([0, 0.8]);
    expect(oneDayChart.yDomain).toEqual([0.5, 0.7]);
  });

  it("keeps binary timelines fixed at 0–100 for every zoom", () => {
    const forecast = {
      question_id: 1,
      start_time: 100,
      end_time: null,
      forecast_values: [],
      interval_lower_bounds: [0.45],
      centers: [0.5],
      interval_upper_bounds: [0.55],
      method: AggregationMethod.recency_weighted,
      forecaster_count: 10,
      means: null,
      histogram: null,
    };
    const aggregation: AggregateForecastHistory = {
      history: [forecast],
      latest: forecast,
    };
    const buildChart = (zoom: TimelineChartZoomOption) =>
      buildNumericChartData({
        questionType: QuestionType.Binary,
        actualCloseTime: 200_000,
        scaling: {
          range_min: null,
          range_max: null,
          zero_point: null,
        },
        height: 216,
        aggregation,
        aggregationIndex: 0,
        width: 516,
        zoom,
        forceYTickCount: 5,
        alwaysShowYTicks: true,
      });

    expect(buildChart(TimelineChartZoomOption.All).yDomain).toEqual([0, 1]);
    expect(buildChart(TimelineChartZoomOption.OneDay).yDomain).toEqual([0, 1]);
  });

  it("falls back to center values when uncertainty intervals are missing", () => {
    const forecast = {
      question_id: 1,
      start_time: 100,
      end_time: null,
      forecast_values: [],
      interval_lower_bounds: null,
      centers: [0.5],
      interval_upper_bounds: null,
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
    });

    expect(chart.yDomain).toEqual([0.49, 0.51]);
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
      labels: ["49", "49.5", "50", "50.5", "51"],
      yDomain: [0.49, 0.51],
    });
  });
});
