import { DomainTuple, VictoryThemeDefinition } from "victory";

import {
  Area,
  BaseChartData,
  Line,
  LinePoint,
  Scale,
  ScaleDirection,
  TimelineChartZoomOption,
  TimelineYDomainOptions,
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
  widenDomainToTicks,
} from "@/utils/charts/axis";
import {
  reduceStepAreaSegments,
  reduceStepLineSegments,
} from "@/utils/charts/step_reducer";
export type ChartData = BaseChartData & {
  line: Line;
  area: Area;
  points: Line;
  yDomain: DomainTuple;
  xDomain: DomainTuple;
};

type TimestampedYValue = {
  timestamp: number;
  y: number | null | undefined;
};

export function getTickCoverageDomain({
  minValues,
  maxValues,
  minTimestamp,
  maxTimestamp,
  useFullYDomain,
}: {
  minValues: TimestampedYValue[];
  maxValues: TimestampedYValue[];
  minTimestamp: number;
  maxTimestamp?: number;
  useFullYDomain?: boolean;
}): [number, number] | undefined {
  const shouldIncludeValue = (timestamp: number) =>
    useFullYDomain ||
    (timestamp >= minTimestamp &&
      (maxTimestamp === undefined || timestamp <= maxTimestamp));
  const finiteValues = (values: TimestampedYValue[]) =>
    values
      .filter(({ timestamp }) => shouldIncludeValue(timestamp))
      .map(({ y }) => y)
      .filter(
        (value): value is number =>
          typeof value === "number" && Number.isFinite(value)
      );
  const coverageMinValues = finiteValues(minValues);
  const coverageMaxValues = finiteValues(maxValues);

  return coverageMinValues.length && coverageMaxValues.length
    ? [Math.min(...coverageMinValues), Math.max(...coverageMaxValues)]
    : undefined;
}

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
  resolutionPoint,
  reduceStepData,
  yDomainOptions,
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
  resolutionPoint?: LinePoint | null;
  reduceStepData?: boolean;
  yDomainOptions?: TimelineYDomainOptions;
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
    ? Math.min(actualCloseTime / 1000, Date.now() / 1000)
    : Date.now() / 1000;
  if (aggregation.latest?.end_time === null) {
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

  const resolutionValues = resolutionPoint
    ? [{ timestamp: resolutionPoint.x, y: resolutionPoint.y }]
    : [];
  const centerValues = [
    ...line.map((d) => ({ timestamp: d.x, y: d.y })),
    ...points.map((d) => ({ timestamp: d.x, y: d.y })),
    ...resolutionValues,
  ];
  const intervalMinValues = [
    ...area.map((d) => ({ timestamp: d.x, y: d.y0 })),
    ...points.map((d) => ({ timestamp: d.x, y: d.y1 ?? d.y })),
    ...resolutionValues,
  ];
  const intervalMaxValues = [
    ...area.map((d) => ({ timestamp: d.x, y: d.y })),
    ...points.map((d) => ({ timestamp: d.x, y: d.y2 ?? d.y })),
    ...resolutionValues,
  ];
  const useCenterValues = yDomainOptions?.source === "centers";
  const minValues = useCenterValues ? centerValues : intervalMinValues;
  const maxValues = useCenterValues ? centerValues : intervalMaxValues;
  const useFullYDomain = yDomainOptions
    ? yDomainOptions.scope === "fullHistory"
    : questionType === QuestionType.Numeric ||
      questionType === QuestionType.Date;
  const { originalYDomain, zoomedYDomain } = generateTimeSeriesYDomain({
    zoom,
    minTimestamp: xDomain[0],
    isChartEmpty: !domainTimestamps.length,
    minValues,
    maxValues,
    includeClosestBoundOnZoom: questionType === QuestionType.Binary,
    forceAutoZoom: !!yDomainOptions,
    useFullYDomain,
    paddingRatio: yDomainOptions?.paddingRatio,
  });
  const tickCoverageDomain = getTickCoverageDomain({
    minValues,
    maxValues,
    minTimestamp: xDomain[0],
    useFullYDomain,
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
    tickCoverageDomain,
  });
  const yDomain = widenDomainToTicks(zoomedYDomain, yScale.ticks);

  return {
    line: reduceStepData ? reduceStepLineSegments(line) : line,
    area: reduceStepData ? reduceStepAreaSegments(area) : area,
    yDomain,
    xDomain,
    xScale,
    yScale,
    points,
  };
}
