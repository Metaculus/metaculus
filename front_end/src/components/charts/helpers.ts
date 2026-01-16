import { isNil } from "lodash";
import { DomainTuple, VictoryThemeDefinition } from "victory";

import {
  Area,
  BaseChartData,
  Line,
  Scale,
  ScaleDirection,
  TimelineChartZoomOption,
} from "@/types/charts";
import {
  AggregateForecastHistory,
  QuestionType,
  Scaling,
  UserForecastHistory,
} from "@/types/question";
import {
  generateNumericXDomain,
  generateScale,
  generateTimestampXScale,
  generateTimeSeriesYDomain,
  getTickLabelFontSize,
} from "@/utils/charts/axis";

export type ChartData = BaseChartData & {
  line: Line;
  area: Area;
  points: Line;
  yDomain: DomainTuple;
  xDomain: DomainTuple;
};

export function buildNumericChartData({
  questionType,
  actualCloseTime,
  scaling,
  height,
  aggregation,
  aggregationIndex,
  myForecasts,
  width,
  zoom,
  extraTheme,
  isAggregationsEmpty,
  openTime,
  unit,
  forceYTickCount,
  inboundOutcomeCount,
  alwaysShowYTicks,
}: {
  questionType: QuestionType;
  actualCloseTime?: number | null;
  scaling: Scaling;
  height: number;
  aggregation: AggregateForecastHistory;
  aggregationIndex: number;
  myForecasts?: UserForecastHistory;
  width: number;
  zoom: TimelineChartZoomOption;
  extraTheme?: VictoryThemeDefinition;
  isAggregationsEmpty?: boolean;
  openTime?: number;
  unit?: string;
  forceYTickCount?: number;
  inboundOutcomeCount?: number | null;
  alwaysShowYTicks?: boolean;
}): ChartData {
  const line: Line = [];
  const area: Area = [];

  aggregation.history.forEach((forecast) => {
    if (!line.length) {
      line.push({
        x: forecast.start_time,
        y: forecast.centers?.[aggregationIndex] ?? 0,
      });
      area.push({
        x: forecast.start_time,
        y0: forecast.interval_lower_bounds?.[aggregationIndex] ?? 0,
        y: forecast.interval_upper_bounds?.[aggregationIndex] ?? 0,
      });
    } else if (
      line.length &&
      line[line.length - 1]?.x === forecast.start_time
    ) {
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      line[line.length - 1]!.y = forecast.centers?.[aggregationIndex] ?? 0;
      area[area.length - 1]!.y0 =
        forecast.interval_lower_bounds?.[aggregationIndex] ?? 0;
      area[area.length - 1]!.y =
        forecast.interval_upper_bounds?.[aggregationIndex] ?? 0;
      /* eslint-enable @typescript-eslint/no-non-null-assertion */
    } else {
      // pushing null data terminates previous point (if any)
      line.push({
        x: forecast.start_time,
        y: null,
      });
      area.push({
        x: forecast.start_time,
        y0: null,
        y: null,
      });
      line.push({
        x: forecast.start_time,
        y: forecast.centers?.[aggregationIndex] ?? 0,
      });
      area.push({
        x: forecast.start_time,
        y0: forecast.interval_lower_bounds?.[aggregationIndex] ?? 0,
        y: forecast.interval_upper_bounds?.[aggregationIndex] ?? 0,
      });
    }

    if (!!forecast.end_time) {
      line.push({
        x: forecast.end_time,
        y: forecast.centers?.[aggregationIndex] ?? 0,
      });
      area.push({
        x: forecast.end_time,
        y0: forecast.interval_lower_bounds?.[aggregationIndex] ?? 0,
        y: forecast.interval_upper_bounds?.[aggregationIndex] ?? 0,
      });
    }
  });

  const latestTimestamp = actualCloseTime
    ? Math.max(
        Math.min(actualCloseTime / 1000, Date.now() / 1000),
        myForecasts?.latest ? myForecasts.latest.start_time : 0
      )
    : Date.now() / 1000;
  if (isNil(actualCloseTime) && aggregation.latest?.end_time === null) {
    // we don't have an actual close time and last aggregation hasn't ended,
    // so put a point at the end of the timeline
    line.push({
      x: latestTimestamp,
      y: aggregation.latest.centers?.[aggregationIndex] ?? 0,
    });
    area.push({
      x: latestTimestamp,
      y0: aggregation.latest.interval_lower_bounds?.[aggregationIndex] ?? 0,
      y: aggregation.latest.interval_upper_bounds?.[aggregationIndex] ?? 0,
    });
  } else if (
    actualCloseTime &&
    (aggregation.latest?.end_time === null ||
      (aggregation.latest?.end_time &&
        aggregation.latest.end_time >= actualCloseTime))
  ) {
    // we have an actual close time and the aggregation outlives it,
    // trucate it to the actualCloseTime
    line[line.length - 1] = {
      x: actualCloseTime / 1000,
      y: aggregation.latest.centers?.[aggregationIndex] ?? 0,
    };
    area[area.length - 1] = {
      x: actualCloseTime / 1000,
      y0: aggregation.latest.interval_lower_bounds?.[aggregationIndex] ?? 0,
      y: aggregation.latest.interval_upper_bounds?.[aggregationIndex] ?? 0,
    };
  } else if (
    aggregation.latest?.end_time &&
    aggregation.latest.end_time >= latestTimestamp
  ) {
    line[line.length - 1] = {
      x: latestTimestamp,
      y: aggregation.latest.centers?.[aggregationIndex] ?? 0,
    };
    area[area.length - 1] = {
      x: latestTimestamp,
      y0: aggregation.latest.interval_lower_bounds?.[aggregationIndex] ?? 0,
      y: aggregation.latest.interval_upper_bounds?.[aggregationIndex] ?? 0,
    };
  }

  const points: Line = [];
  if (myForecasts?.history.length) {
    myForecasts.history.forEach((forecast) => {
      const newPoint = {
        x: forecast.start_time,
        y:
          questionType === "binary"
            ? forecast.forecast_values[1] ?? null
            : forecast.centers?.[aggregationIndex] ?? 0,
        y1:
          questionType === "binary"
            ? undefined
            : forecast.interval_lower_bounds?.[aggregationIndex],
        y2:
          questionType === "binary"
            ? undefined
            : forecast.interval_upper_bounds?.[aggregationIndex],
        symbol: "circle",
      };

      if (points.length > 0) {
        // if the last forecasts terminates at the new
        // forecast's start time, replace the end point record
        // with the new point
        const lastPoint = points[points.length - 1];
        if (lastPoint?.x === newPoint.x) {
          points.pop();
        }
      }

      points.push(newPoint);
      if (!!forecast.end_time) {
        points.push({
          x: forecast.end_time,
          y: newPoint.y,
          symbol: "x",
        });
      }
    });
  }
  // TODO: add quartiles if continuous

  const domainTimestamps =
    isAggregationsEmpty && openTime
      ? [openTime / 1000, latestTimestamp]
      : [
          ...aggregation.history.map((f) => f.start_time),
          ...(myForecasts?.history
            ? myForecasts.history.map((f) => f.start_time)
            : []),
          latestTimestamp,
        ];

  const xDomain = generateNumericXDomain(domainTimestamps, zoom);
  const fontSize = extraTheme ? getTickLabelFontSize(extraTheme) : undefined;
  const xScale = generateTimestampXScale(xDomain, width, fontSize);
  // TODO: implement general scaling:
  // const xScale: Scale = generateScale({
  //   displayType: QuestionType.Date,
  //   axisLength: width,
  //   direction: "horizontal",
  //   domain: xDomain,
  // });

  const { originalYDomain, zoomedYDomain } = generateTimeSeriesYDomain({
    zoom,
    minTimestamp: xDomain[0],
    isChartEmpty: !domainTimestamps.length,
    minValues: area.map((d) => ({ timestamp: d.x, y: d.y0 })),
    maxValues: area.map((d) => ({ timestamp: d.x, y: d.y })),
    includeClosestBoundOnZoom: questionType === QuestionType.Binary,
  });
  const yScale: Scale = generateScale({
    displayType: questionType,
    axisLength: height,
    direction: ScaleDirection.Vertical,
    domain: originalYDomain,
    zoomedDomain: zoomedYDomain,
    scaling,
    unit,
    forceTickCount: forceYTickCount,
    inboundOutcomeCount,
    alwaysShowTicks: alwaysShowYTicks,
  });

  return {
    line,
    area,
    yDomain: zoomedYDomain,
    xDomain,
    xScale,
    yScale,
    points,
  };
}
