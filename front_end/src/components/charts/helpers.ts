import { DomainTuple, VictoryThemeDefinition } from "victory";

import {
  Area,
  BaseChartData,
  DEFAULT_TIMELINE_Y_DOMAIN_OPTIONS,
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
  restrictScaleTicksToDomain,
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
    const center = forecast.centers?.[aggregationIndex] ?? 0;
    const lowerBound =
      forecast.interval_lower_bounds?.[aggregationIndex] ?? center;
    const upperBound =
      forecast.interval_upper_bounds?.[aggregationIndex] ?? center;

    if (!line.length) {
      line.push({
        x: forecast.start_time,
        y: center,
      });
      area.push({
        x: forecast.start_time,
        y0: lowerBound,
        y: upperBound,
      });
    } else if (
      line.length &&
      line[line.length - 1]?.x === forecast.start_time
    ) {
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      line[line.length - 1]!.y = center;
      area[area.length - 1]!.y0 = lowerBound;
      area[area.length - 1]!.y = upperBound;
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
        y: center,
      });
      area.push({
        x: forecast.start_time,
        y0: lowerBound,
        y: upperBound,
      });
    }

    if (!!forecast.end_time) {
      line.push({
        x: forecast.end_time,
        y: center,
      });
      area.push({
        x: forecast.end_time,
        y0: lowerBound,
        y: upperBound,
      });
    }
  });

  const latestTimestamp = actualCloseTime
    ? Math.min(actualCloseTime / 1000, Date.now() / 1000)
    : Date.now() / 1000;
  const latestForecast = aggregation.latest;
  const latestCenter = latestForecast?.centers?.[aggregationIndex] ?? 0;
  const latestLowerBound =
    latestForecast?.interval_lower_bounds?.[aggregationIndex] ?? latestCenter;
  const latestUpperBound =
    latestForecast?.interval_upper_bounds?.[aggregationIndex] ?? latestCenter;
  if (latestForecast?.end_time === null) {
    line.push({
      x: latestTimestamp,
      y: latestCenter,
    });
    area.push({
      x: latestTimestamp,
      y0: latestLowerBound,
      y: latestUpperBound,
    });
  } else if (
    latestForecast?.end_time &&
    latestForecast.end_time >= latestTimestamp
  ) {
    line[line.length - 1] = {
      x: latestTimestamp,
      y: latestCenter,
    };
    area[area.length - 1] = {
      x: latestTimestamp,
      y0: latestLowerBound,
      y: latestUpperBound,
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
  const communityCenterValues = line.map((d) => ({
    timestamp: d.x,
    y: d.y,
  }));
  const communityIntervalMinValues = area.map((d) => ({
    timestamp: d.x,
    y: d.y0,
  }));
  const communityIntervalMaxValues = area.map((d) => ({
    timestamp: d.x,
    y: d.y,
  }));
  const scatterCenterValues = points.map((d) => ({
    timestamp: d.x,
    y: d.y,
  }));
  const communityCenterSource = {
    minValues: communityCenterValues,
    maxValues: communityCenterValues,
    carryForward: true,
  };
  const scatterCenterSource = {
    minValues: scatterCenterValues,
    maxValues: scatterCenterValues,
  };
  const resolutionSource = {
    minValues: resolutionValues,
    maxValues: resolutionValues,
  };
  const centerSources = [
    communityCenterSource,
    scatterCenterSource,
    resolutionSource,
  ];
  const intervalSources = [
    {
      minValues: communityIntervalMinValues,
      maxValues: communityIntervalMaxValues,
      carryForward: true,
    },
    // Keep medians as a fallback for histories without interval bounds.
    communityCenterSource,
    {
      minValues: points.map((d) => ({
        timestamp: d.x,
        y: d.y1 ?? d.y,
      })),
      maxValues: points.map((d) => ({
        timestamp: d.x,
        y: d.y2 ?? d.y,
      })),
    },
    resolutionSource,
  ];
  const effectiveYDomainOptions =
    yDomainOptions ?? DEFAULT_TIMELINE_Y_DOMAIN_OPTIONS;
  const useCenterValues = effectiveYDomainOptions.source === "centers";
  const useFullYDomain = effectiveYDomainOptions.scope === "fullHistory";
  const generatedYDomain = generateTimeSeriesYDomain({
    sources: useCenterValues ? centerSources : intervalSources,
    timeRange: xDomain,
    isChartEmpty: !domainTimestamps.length,
    useFullYDomain,
    paddingRatio: effectiveYDomainOptions.paddingRatio,
  });
  const { originalYDomain, tickCoverageDomain } = generatedYDomain;
  const zoomedYDomain =
    questionType === QuestionType.Binary
      ? originalYDomain
      : generatedYDomain.zoomedYDomain;
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
  const visibleYScale = restrictScaleTicksToDomain(yScale, yDomain);

  return {
    line: reduceStepData ? reduceStepLineSegments(line) : line,
    area: reduceStepData ? reduceStepAreaSegments(area) : area,
    yDomain,
    xDomain,
    xScale,
    yScale: visibleYScale,
    points,
  };
}
