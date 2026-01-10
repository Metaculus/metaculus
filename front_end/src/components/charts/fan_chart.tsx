"use client";

import { isNil, merge } from "lodash";
import { FC, useCallback, useMemo, useState } from "react";
import {
  Tuple,
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryContainer,
  VictoryLabel,
  VictoryLine,
  VictoryPortal,
  VictoryScatter,
  VictoryThemeDefinition,
  VictoryVoronoiContainer,
} from "victory";

import ChartFanTooltip from "@/components/charts/primitives/chart_fan_tooltip";
import FanPoint from "@/components/charts/primitives/fan_point";
import PredictionWithRange from "@/components/charts/primitives/prediction_with_range";
import ResolutionDiamond from "@/components/charts/primitives/resolution_diamond";
import ForecastAvailabilityChartOverflow from "@/components/post_card/chart_overflow";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import {
  Area,
  ContinuousForecastInputType,
  FanDatum,
  GroupFanDatum,
  Line,
  ScaleDirection,
  YDomain,
} from "@/types/charts";
import { PostGroupOfQuestions } from "@/types/post";
import {
  Bounds,
  Quartiles,
  QuestionType,
  QuestionWithNumericForecasts,
  Scaling,
} from "@/types/question";
import {
  generateScale,
  generateYDomain,
  getAxisLeftPadding,
  getAxisRightPadding,
  getTickLabelFontSize,
} from "@/utils/charts/axis";
import {
  calculateCharWidth,
  getLineGraphTypeFromQuestion,
} from "@/utils/charts/helpers";
import { getResolutionPosition } from "@/utils/charts/resolution";
import {
  getQuantileNumericForecastDataset,
  getSliderNumericForecastDataset,
} from "@/utils/forecasts/dataset";
import { isForecastActive } from "@/utils/forecasts/helpers";
import {
  extractPrevBinaryForecastValue,
  extractPrevNumericForecastValue,
} from "@/utils/forecasts/initial_values";
import {
  computeQuartilesFromCDF,
  getCdfBounds,
  scaleInternalLocation,
  unscaleNominalLocation,
} from "@/utils/math";
import {
  getGroupForecastAvailability,
  getQuestionForecastAvailability,
} from "@/utils/questions/forecastAvailability";
import { sortGroupPredictionOptions } from "@/utils/questions/groupOrdering";
import { isUnsuccessfullyResolved } from "@/utils/questions/resolution";

import { FanChartVariant, fanVariants } from "./fan_chart_variants";
import IndexValueTooltip from "./primitives/index_value_tooltip";

type Props = {
  group?: PostGroupOfQuestions<QuestionWithNumericForecasts>;
  options?: FanDatum[];
  height?: number;
  yLabel?: string;
  withTooltip?: boolean;
  extraTheme?: VictoryThemeDefinition;
  pointSize?: number;
  hideCP?: boolean;
  variant?: FanChartVariant;
  fixedYDomain?: [number, number];
  isEmbedded?: boolean;
  optionsLimit?: number;
  forFeedPage?: boolean;
};

type NormalizedFanDatum = {
  name: string;
  communityQuartiles: Quartiles | null;
  userQuartiles: Quartiles | null;
  communityBounds: Bounds | null;
  userBounds: Bounds | null;
  resolved: boolean;
  resolvedValue?: number | null;
  optionScaling: Scaling | null;
  question?: QuestionWithNumericForecasts;
  type: QuestionType.Binary | QuestionType.Numeric | QuestionType.Date;
};

const FanChart: FC<Props> = ({
  group,
  options,
  height = 220,
  yLabel,
  withTooltip = false,
  extraTheme,
  pointSize = 10,
  hideCP,
  variant,
  fixedYDomain,
  isEmbedded = false,
  optionsLimit,
  forFeedPage,
}) => {
  const effectiveVariant: FanChartVariant = variant ?? "default";

  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const actualTheme = extraTheme
    ? merge({}, chartTheme, extraTheme)
    : chartTheme;
  const tickLabelFontSize = getTickLabelFontSize(actualTheme);

  const [activePoint, setActivePoint] = useState<string | null>(null);

  const forecastAvailability = useMemo(() => {
    if (group) return getGroupForecastAvailability(group.questions);
    return { isEmpty: false, cpRevealsOn: null };
  }, [group]);

  const normOptions: NormalizedFanDatum[] = useMemo(() => {
    if (options?.length) {
      const firstType = options[0]?.type ?? QuestionType.Numeric;
      return options.map((o) => ({
        name: o.name,
        communityQuartiles: o.communityQuartiles ?? null,
        userQuartiles: o.userQuartiles ?? null,
        communityBounds: null,
        userBounds: null,
        resolved: Number.isFinite(o.resolvedValue ?? null),
        resolvedValue: o.resolvedValue ?? null,
        optionScaling: o.optionScaling ?? null,
        type: o.type ?? firstType,
      }));
    }
    if (!group) return [];
    const legacy = getFanOptions(group);
    const mapped = legacy.map((opt) => ({
      name: opt.name,
      communityQuartiles: opt.communityQuartiles,
      userQuartiles: opt.userQuartiles,
      communityBounds: opt.communityBounds,
      userBounds: opt.userBounds,
      resolved: opt.resolved,
      optionScaling: opt.question?.scaling ?? null,
      question: opt.question,
      type: (opt.question?.type === QuestionType.Binary
        ? QuestionType.Binary
        : opt.question?.type === QuestionType.Date
          ? QuestionType.Date
          : QuestionType.Numeric) as
        | QuestionType.Binary
        | QuestionType.Numeric
        | QuestionType.Date,
    }));
    return typeof optionsLimit === "number"
      ? mapped.slice(0, optionsLimit)
      : mapped;
  }, [group, options, optionsLimit]);

  const {
    communityLines,
    communityAreas,
    communityPoints,
    userPoints,
    resolutionPoints,
    emptyPoints,
    yScale,
    yDomain,
  } = useMemo(
    () =>
      buildChartData({
        options: normOptions,
        height,
        forceTickCount: fanVariants[effectiveVariant].forceTickCount,
        fixedYDomain,
        forFeedPage,
      }),
    [normOptions, height, effectiveVariant, fixedYDomain, forFeedPage]
  );

  const labels = adjustLabelsForDisplay(
    normOptions.map((o) => ({ name: o.name })),
    chartWidth,
    actualTheme
  );

  const { leftPadding, MIN_LEFT_PADDING } = useMemo(() => {
    return getAxisLeftPadding(yScale, tickLabelFontSize as number, yLabel);
  }, [yScale, tickLabelFontSize, yLabel]);
  const { rightPadding, MIN_RIGHT_PADDING } = useMemo(() => {
    return getAxisRightPadding(yScale, tickLabelFontSize as number, yLabel);
  }, [yScale, tickLabelFontSize, yLabel]);

  const maxLeftPadding = Math.max(leftPadding, MIN_LEFT_PADDING);
  const maxRightPadding = Math.max(rightPadding, MIN_RIGHT_PADDING);

  const v = fanVariants[effectiveVariant];
  const palette = v.palette({ getThemeColor });

  const shouldDisplayChart = !!chartWidth;

  const variantArgs = {
    chartWidth,
    yLabel,
    tickLabelFontSize,
    maxLeftPadding: isEmbedded ? maxLeftPadding : maxLeftPadding,
    maxRightPadding: isEmbedded
      ? Math.max(10, maxRightPadding)
      : maxRightPadding,
    getThemeColor,
  };

  const bottomPadForPoints = v.padding(variantArgs).bottom;

  const tooltipOptions: GroupFanDatum[] = useMemo(
    () =>
      normOptions
        .filter(
          (
            o
          ): o is NormalizedFanDatum & {
            question: QuestionWithNumericForecasts;
          } => Boolean(o.question)
        )
        .map((o) => ({
          name: o.name,
          communityQuartiles: o.communityQuartiles,
          communityBounds: o.communityBounds,
          userQuartiles: o.userQuartiles,
          userBounds: o.userBounds,
          resolved: o.resolved,
          question: o.question,
        })),
    [normOptions]
  );

  const formatValue = useCallback(
    (v: number) => yScale.tickFormat(v),
    [yScale]
  );
  const getIndexValueForX = useMemo(() => {
    const map: Record<string, number | null> = {};
    for (const o of normOptions) {
      const val =
        o.resolved && typeof o.resolvedValue === "number"
          ? o.resolvedValue
          : o.communityQuartiles?.median ?? null;
      map[o.name] = Number.isFinite(val as number) ? (val as number) : null;
    }
    return (xName: string) => map[xName] ?? null;
  }, [normOptions]);

  const tooltipConfig = useMemo(() => {
    if (effectiveVariant === "index") {
      return {
        labels: () => " ",
        voronoiDimension: "x" as const,
        labelComponent: (
          <IndexValueTooltip
            chartHeight={height}
            formatValue={formatValue}
            getValueForX={getIndexValueForX}
          />
        ),
      } as const;
    }
    return {
      labels: ({ datum }: { datum: { x: string } }) => datum.x,
      voronoiDimension: undefined,
      labelComponent: (
        <ChartFanTooltip
          chartHeight={height}
          options={tooltipOptions}
          hideCp={hideCP}
          forecastAvailability={forecastAvailability}
        />
      ),
    } as const;
  }, [
    effectiveVariant,
    height,
    formatValue,
    getIndexValueForX,
    tooltipOptions,
    hideCP,
    forecastAvailability,
  ]);

  const containerWithTooltip = (
    <VictoryVoronoiContainer
      voronoiBlacklist={[
        "communityFanArea",
        "userFanArea",
        "communityFanLine",
        "userFanLine",
      ]}
      style={{ touchAction: "pan-y" }}
      {...tooltipConfig}
      onActivated={(points: { x: string }[]) => {
        const x = points[0]?.x;
        if (!isNil(x)) setActivePoint(x);
      }}
    />
  );

  return (
    <div
      id="fan-graph-container"
      ref={chartContainerRef}
      className="relative w-full"
      style={{ height }}
    >
      {shouldDisplayChart && (
        <VictoryChart
          width={chartWidth}
          height={height}
          theme={actualTheme}
          domain={{ y: yDomain }}
          domainPadding={v.domainPadding(variantArgs)}
          padding={v.padding(variantArgs)}
          containerComponent={
            withTooltip ? (
              containerWithTooltip
            ) : (
              <VictoryContainer
                style={{
                  pointerEvents: "auto",
                  userSelect: "auto",
                  touchAction: "auto",
                }}
              />
            )
          }
          events={[
            {
              target: "parent",
              eventHandlers: {
                onMouseOutCapture: () => setActivePoint(null),
              },
            },
          ]}
        >
          <VictoryAxis
            dependentAxis
            label={yLabel}
            tickValues={yScale.ticks}
            tickFormat={yScale.tickFormat}
            style={v.yAxisStyle({
              tickLabelFontSize,
              maxLeftPadding,
              maxRightPadding,
              getThemeColor,
            })}
            offsetX={v.axisLabelOffsetX(variantArgs)}
            axisLabelComponent={<VictoryLabel x={chartWidth} />}
          />

          <VictoryPortal>
            <VictoryAxis
              tickValues={normOptions.map((o) => o.name)}
              tickFormat={hideCP ? () => "" : (_, i) => labels[i] ?? ""}
              style={v.xAxisStyle({
                tickLabelFontSize,
                maxLeftPadding,
                maxRightPadding,
                getThemeColor,
              })}
            />
          </VictoryPortal>

          {!hideCP &&
            communityAreas.map((area, idx) => (
              <VictoryArea
                key={`c-area-${idx}`}
                name={`communityFanArea-${idx}`}
                data={area ?? []}
                style={{
                  data: {
                    opacity: 0.3,
                    fill: ({ datum }) =>
                      datum?.resolved
                        ? getThemeColor(METAC_COLORS.purple["500"])
                        : palette.communityArea,
                  },
                }}
              />
            ))}
          {!hideCP &&
            communityLines.map((line, idx) => (
              <VictoryLine
                key={`c-line-${idx}`}
                name={`communityFanLine-${idx}`}
                data={line ?? []}
                style={{
                  data: {
                    stroke: ({ datum }) =>
                      datum?.resolved
                        ? getThemeColor(METAC_COLORS.purple["700"])
                        : palette.communityLine,
                  },
                }}
              />
            ))}

          <VictoryScatter
            data={userPoints}
            dataComponent={<PredictionWithRange />}
          />

          {!hideCP && !forecastAvailability?.cpRevealsOn && (
            <VictoryScatter
              data={communityPoints.map((p) => ({
                ...p,
                resolved: false,
                symbol: "square",
              }))}
              style={{
                data: {
                  fill: () => palette.communityPoint,
                  stroke: () => palette.communityPoint,
                  strokeWidth: 6,
                  strokeOpacity: ({ datum }) =>
                    activePoint === datum.x ? 0.3 : 0,
                },
              }}
              dataComponent={
                <FanPoint
                  activePoint={activePoint}
                  pointSize={pointSize}
                  pointColor={palette.communityPoint}
                  bottomPadding={bottomPadForPoints}
                />
              }
            />
          )}

          {resolutionPoints.map((point) => {
            if (
              point.placement &&
              ["below", "above"].includes(point.placement)
            ) {
              return (
                <VictoryPortal key={`res-portal-${point.x}`}>
                  <VictoryScatter
                    key={`res-${point.x}`}
                    data={[
                      {
                        ...point,
                        y: point.placement === "below" ? 0 : 1,
                      },
                    ]}
                    dataComponent={<ResolutionDiamond hoverable={false} />}
                  />
                </VictoryPortal>
              );
            }
            return (
              <VictoryScatter
                key={`res-${point.x}`}
                data={[{ ...point, symbol: "diamond" }]}
                style={{
                  data: {
                    fill: v.resolutionPoint.fill({ getThemeColor }),
                    stroke: () => palette.resolutionStroke,
                    strokeWidth: 2,
                    strokeOpacity: 1,
                  },
                }}
                dataComponent={
                  <FanPoint
                    activePoint={null}
                    pointSize={v.resolutionPoint.size}
                    strokeWidth={v.resolutionPoint.strokeWidth}
                  />
                }
              />
            );
          })}
          {emptyPoints.map((point) => (
            <VictoryScatter
              key={`empty-${point.x}`}
              data={[{ ...point, symbol: "diamond" }]}
              dataComponent={
                <FanPoint
                  activePoint={activePoint}
                  pointSize={v.resolutionPoint.size}
                  strokeWidth={v.resolutionPoint.strokeWidth}
                  unsuccessfullyResolved={point.unsuccessfullyResolved}
                  bgColor={v.resolutionPoint.fill({ getThemeColor })}
                  bottomPadding={bottomPadForPoints}
                  isClosed
                />
              }
            />
          ))}
        </VictoryChart>
      )}

      {!withTooltip && (
        <ForecastAvailabilityChartOverflow
          forecastAvailability={forecastAvailability}
          className="text-xs lg:text-sm"
          textClassName="!max-w-[300px]"
        />
      )}
    </div>
  );
};

type FanGraphPoint = {
  x: string;
  y: number;
  resolved?: boolean;
  unsuccessfullyResolved?: boolean;
  placement?: "in" | "below" | "above";
};

function buildChartData({
  options,
  height,
  forceTickCount,
  fixedYDomain,
  forFeedPage,
}: {
  options: NormalizedFanDatum[];
  height: number;
  forceTickCount?: number;
  fixedYDomain?: [number, number];
  forFeedPage?: boolean;
}) {
  if (!options.length) {
    return {
      communityLines: [] as (Line<string> | null)[],
      communityAreas: [] as (Area<string> | null)[],
      communityPoints: [] as FanGraphPoint[],
      userPoints: [] as FanGraphPoint[],
      resolutionPoints: [] as FanGraphPoint[],
      emptyPoints: [] as FanGraphPoint[],
      yScale: { ticks: [], tickFormat: (v: number) => String(v) },
      yDomain: [0, 1] as Tuple<number>,
    };
  }

  const groupType: QuestionType = options[0]?.type ?? QuestionType.Numeric;
  const isBinaryGroup = groupType === QuestionType.Binary;

  const communityLines: (Line<string> | null)[] = [];
  const communityAreas: (Area<string> | null)[] = [];
  const userArea: Area<string> = [];
  const communityPoints: FanGraphPoint[] = [];
  const userPoints: FanGraphPoint[] = [];
  const resolutionPoints: FanGraphPoint[] = [];
  const emptyPoints: FanGraphPoint[] = [];

  const scaling = getFanGraphScaling(options);

  let fixedInternal: [number, number] | undefined;
  if (fixedYDomain && scaling.range_min != null && scaling.range_max != null) {
    const [a, b] = fixedYDomain;
    fixedInternal = [
      unscaleNominalLocation(a, scaling),
      unscaleNominalLocation(b, scaling),
    ] as [number, number];
    const lo = Math.max(0, Math.min(fixedInternal[0], fixedInternal[1]));
    const hi = Math.min(1, Math.max(fixedInternal[0], fixedInternal[1]));
    fixedInternal = [lo, hi];
  }

  let lastPointResolved = false;

  for (const option of options) {
    const unsuccessfullyResolved = option.question
      ? isUnsuccessfullyResolved(option.question.resolution)
      : false;

    const questionForecastAvailability = option.question
      ? getQuestionForecastAvailability(option.question)
      : { isEmpty: false, cpRevealsOn: null as number | null };

    const isResolved = !!option.resolved && !unsuccessfullyResolved;

    if (unsuccessfullyResolved) {
      emptyPoints.push({ x: option.name, y: 0, unsuccessfullyResolved: true });
      continue;
    }

    if (option.resolved) {
      const yVal =
        Number.isFinite(option.resolvedValue) && option.resolvedValue != null
          ? (option.resolvedValue as number)
          : option.question
            ? getResolutionPosition({ question: option.question, scaling })
            : NaN;

      const isAboveUpperBound =
        option.question?.resolution === "above_upper_bound" || yVal > 1;
      const isBelowLowerBound =
        option.question?.resolution === "below_lower_bound" || yVal < 0;

      resolutionPoints.push({
        x: option.name,
        y: yVal,
        unsuccessfullyResolved: false,
        resolved: true,
        placement: isAboveUpperBound
          ? "above"
          : isBelowLowerBound
            ? "below"
            : "in",
      });
    }

    if (
      questionForecastAvailability.isEmpty ||
      questionForecastAvailability.cpRevealsOn
    ) {
      emptyPoints.push({ x: option.name, y: 0, unsuccessfullyResolved: false });
      continue;
    }

    if (option.communityQuartiles) {
      const {
        linePoint: communityLinePoint,
        areaPoint: communityAreaPoint,
        point: communityPoint,
      } = getOptionGraphData({
        name: option.name,
        quartiles: option.communityQuartiles,
        optionScaling: option.optionScaling,
        scaling,
        withoutScaling: isBinaryGroup,
        resolved: isResolved,
      });

      if (!unsuccessfullyResolved) {
        if (communityLines.length === 0) {
          communityLines.push([
            { ...communityLinePoint, resolved: isResolved },
          ]);
          communityAreas.push([
            { ...communityAreaPoint, resolved: isResolved },
          ]);
        } else {
          communityLines.push([
            {
              ...(communityLines.at(-1)?.at(-1) ?? communityLinePoint),
              resolved: lastPointResolved,
            },
            { ...communityLinePoint, resolved: isResolved },
          ]);
          communityAreas.push([
            {
              ...(communityAreas.at(-1)?.at(-1) ?? communityAreaPoint),
              resolved: lastPointResolved,
            },
            { ...communityAreaPoint, resolved: isResolved },
          ]);
        }
        communityPoints.push(communityPoint);
        lastPointResolved = isResolved;
      } else {
        communityLines.push(null);
        communityAreas.push(null);
      }
    }

    if (option.userQuartiles) {
      const { areaPoint: userAreaPoint, point: userPoint } = getOptionGraphData(
        {
          name: option.name,
          quartiles: option.userQuartiles,
          optionScaling: option.optionScaling,
          scaling,
          withoutScaling: isBinaryGroup,
          resolved: option.resolved ?? false,
        }
      );
      if (!isBinaryGroup) userArea.push(userAreaPoint);
      userPoints.push(userPoint);
    }
  }

  const { originalYDomain, zoomedYDomain } = generateFanGraphYDomain({
    communityAreas,
    userArea,
    resolutionPoints: isBinaryGroup ? [] : resolutionPoints,
    includeClosestBoundOnZoom: isBinaryGroup,
  });

  const finalOriginal = fixedInternal ?? originalYDomain;
  const finalZoom = fixedInternal ?? zoomedYDomain;

  const yScale = generateScale({
    displayType: groupType,
    axisLength: height,
    direction: ScaleDirection.Vertical,
    scaling,
    domain: finalOriginal,
    zoomedDomain: finalZoom,
    forceTickCount: forceTickCount ?? (forFeedPage ? 3 : 5),
    alwaysShowTicks: true,
  });

  resolutionPoints.forEach((pt) => {
    if (pt.unsuccessfullyResolved) {
      pt.y = Math.round(((finalZoom[0] + finalZoom[1]) / 2) * 100) / 100;
    } else if (isBinaryGroup) {
      pt.y = pt.y === 0 ? finalZoom[0] : finalZoom[1];
    }
  });
  emptyPoints.forEach((pt) => {
    pt.y = Math.round(((finalZoom[0] + finalZoom[1]) / 2) * 100) / 100;
  });

  const [lo, hi] = finalZoom as Tuple<number>;
  userPoints.forEach((pt) => {
    if (Number.isFinite(pt.y)) {
      pt.y = Math.max(lo, Math.min(hi, pt.y));
    }
  });

  return {
    communityLines,
    communityAreas,
    communityPoints,
    userPoints,
    resolutionPoints,
    emptyPoints,
    yScale,
    yDomain: finalZoom,
  };
}

function getFanGraphScaling(options: NormalizedFanDatum[]): Scaling {
  const zeroPoints: number[] = [];
  const rangeMaxValues: number[] = [];
  const rangeMinValues: number[] = [];
  for (const option of options) {
    const sc = option.optionScaling;
    if (sc && typeof sc.zero_point === "number" && option.communityQuartiles) {
      zeroPoints.push(sc.zero_point);
    }
    if (sc && typeof sc.range_max === "number") {
      rangeMaxValues.push(sc.range_max);
    }
    if (sc && typeof sc.range_min === "number") {
      rangeMinValues.push(sc.range_min);
    }
  }

  const scaling: Scaling = {
    range_max: rangeMaxValues.length > 0 ? Math.max(...rangeMaxValues) : null,
    range_min: rangeMinValues.length > 0 ? Math.min(...rangeMinValues) : null,
    zero_point: zeroPoints.length > 0 ? Math.min(...zeroPoints) : null,
  };
  if (scaling.range_max === scaling.range_min && scaling.range_max === 0) {
    scaling.range_max = 1;
  }

  // we can have mixes of log and linear scaled options
  // which leads to a derived zero point inside the range which is invalid
  // so just ignore the log scaling in this case
  if (
    scaling.zero_point !== null &&
    !isNil(scaling.range_min) &&
    !isNil(scaling.range_max) &&
    scaling.range_min <= scaling.zero_point &&
    scaling.zero_point <= scaling.range_max
  ) {
    scaling.zero_point = null;
  }

  return scaling;
}

function generateFanGraphYDomain({
  communityAreas,
  resolutionPoints,
  userArea,
  includeClosestBoundOnZoom,
}: {
  communityAreas: Array<Area<string> | null>;
  userArea: Area<string>;
  resolutionPoints: Array<FanGraphPoint>;
  includeClosestBoundOnZoom?: boolean;
}): YDomain {
  const originalYDomain: Tuple<number> = [0, 1];
  const fallback = { originalYDomain, zoomedYDomain: originalYDomain };

  const combinedAreaData = [
    ...communityAreas.map((a) => (a ? a : [])),
    ...userArea,
  ];
  const minValues: number[] = [];
  const maxValues: number[] = [];
  for (const areaPoint of combinedAreaData.flat()) {
    if (!isNil(areaPoint.y0)) minValues.push(areaPoint.y0);
    if (!isNil(areaPoint.y)) maxValues.push(areaPoint.y);
  }
  for (const rp of resolutionPoints) {
    if (!isNil(rp.y)) {
      minValues.push(rp.y);
      maxValues.push(rp.y);
    }
  }
  const minValue = minValues.length ? Math.min(...minValues) : null;
  const maxValue = maxValues.length ? Math.max(...maxValues) : null;

  if (isNil(minValue) || isNil(maxValue)) return fallback;

  return generateYDomain({ minValue, maxValue, includeClosestBoundOnZoom });
}

function getOptionGraphData({
  name,
  quartiles,
  scaling,
  optionScaling,
  withoutScaling,
  resolved,
}: {
  name: string;
  quartiles: Quartiles;
  optionScaling: Scaling | null;
  scaling: Scaling;
  withoutScaling: boolean;
  resolved: boolean;
}) {
  if (withoutScaling || !optionScaling) {
    return {
      linePoint: {
        x: name,
        y: quartiles.median,
      },
      areaPoint: {
        x: name,
        y0: quartiles.lower25,
        y: quartiles.upper75,
      },
      point: {
        x: name,
        y: quartiles.median,
        resolved,
      },
    };
  }

  // scale up the values to nominal values
  // then unscale by the derived scaling
  const median = unscaleNominalLocation(
    scaleInternalLocation(quartiles.median, optionScaling),
    scaling
  );
  const lower25 = unscaleNominalLocation(
    scaleInternalLocation(quartiles.lower25, optionScaling),
    scaling
  );
  const upper75 = unscaleNominalLocation(
    scaleInternalLocation(quartiles.upper75, optionScaling),
    scaling
  );

  return {
    linePoint: {
      x: name,
      y: median,
    },
    areaPoint: {
      x: name,
      y0: lower25,
      y: upper75,
    },
    point: {
      x: name,
      y: median,
      resolved: false,
    },
  };
}

function adjustLabelsForDisplay(
  options: { name: string }[],
  chartWidth: number,
  theme: VictoryThemeDefinition
) {
  const labelMargin = 5;

  let charWidth: number;
  const tickLabelStyle = theme.axis?.style?.tickLabels;
  if (
    !Array.isArray(tickLabelStyle) &&
    typeof tickLabelStyle?.fontSize === "number"
  ) {
    charWidth = calculateCharWidth(tickLabelStyle.fontSize);
  } else {
    charWidth = calculateCharWidth(9);
  }

  const labels = options.map((o) => o.name);
  if (!charWidth) return labels;

  const maxLabelLength = Math.max(...labels.map((l) => l.length));
  const maxLabelWidth = maxLabelLength * charWidth + labelMargin;
  const averageChartPaddingXAxis = 100;
  let availableSpacePerLabel =
    (chartWidth - averageChartPaddingXAxis) / labels.length;

  if (maxLabelWidth < availableSpacePerLabel) {
    return labels;
  }

  let step = 1;
  let visibleLabelsCount = labels.length;

  while (maxLabelWidth >= availableSpacePerLabel && step < labels.length) {
    visibleLabelsCount = Math.ceil(labels.length / step);
    availableSpacePerLabel = chartWidth / visibleLabelsCount;
    step++;
  }

  return options.map((option, index) =>
    index % step === 0 ? option.name : ""
  );
}

function getFanOptions(
  group: PostGroupOfQuestions<QuestionWithNumericForecasts>
): GroupFanDatum[] {
  const { questions } = group;

  const groupType = questions.at(0)?.type;
  if (!groupType) {
    console.warn("Can't generate fan options. Group type is not defined.");
    return [];
  }

  const graphType = getLineGraphTypeFromQuestion(groupType);
  if (!graphType) {
    console.warn("Can't generate fan options. Graph type is not supported.");
    return [];
  }

  const sortedQuestions = sortGroupPredictionOptions(questions, group);

  return graphType === "binary"
    ? getFanOptionsFromBinaryGroup(sortedQuestions)
    : getFanOptionsFromContinuousGroup(sortedQuestions);
}

function getFanOptionsFromContinuousGroup(
  questions: QuestionWithNumericForecasts[]
): GroupFanDatum[] {
  return questions
    .map((q) => {
      const latest = q.my_forecasts?.latest;
      const userForecast = extractPrevNumericForecastValue(
        latest && isForecastActive(latest)
          ? latest.distribution_input
          : undefined
      );

      let userCdf: number[] | null = null;
      if (userForecast?.components) {
        userForecast.type === ContinuousForecastInputType.Slider
          ? (userCdf = getSliderNumericForecastDataset(
              userForecast.components,
              q
            ).cdf)
          : (userCdf = getQuantileNumericForecastDataset(
              userForecast.components,
              q
            ).cdf);
      }

      return {
        name: q.label,
        communityCdf:
          q.aggregations[q.default_aggregation_method].latest
            ?.forecast_values ?? [],
        userCdf: userCdf,
        resolved: q.resolution !== null,
        question: q,
      };
    })
    .map(({ name, communityCdf, resolved, question, userCdf }) => ({
      name,
      communityQuartiles: communityCdf.length
        ? computeQuartilesFromCDF(communityCdf) ?? null
        : null,
      communityBounds: getCdfBounds(communityCdf) ?? null,
      userQuartiles: userCdf?.length ? computeQuartilesFromCDF(userCdf) : null,
      userBounds: userCdf ? getCdfBounds(userCdf) ?? null : null,
      resolved,
      question,
    }));
}

function getFanOptionsFromBinaryGroup(
  questions: QuestionWithNumericForecasts[]
): GroupFanDatum[] {
  return questions.map((q) => {
    const aggregation = q.aggregations[q.default_aggregation_method].latest;
    const resolved = q.resolution !== null;

    const latest = q.my_forecasts?.latest;
    const userForecast = extractPrevBinaryForecastValue(
      latest && isForecastActive(latest) ? latest.forecast_values[1] : null
    );

    return {
      name: q.label,
      communityQuartiles: !!aggregation
        ? {
            median: aggregation.centers?.[0] ?? 0,
            lower25: aggregation.interval_lower_bounds?.[0] ?? 0,
            upper75: aggregation.interval_upper_bounds?.[0] ?? 0,
          }
        : null,
      communityBounds: null,
      userQuartiles: userForecast
        ? {
            lower25: userForecast / 100,
            median: userForecast / 100,
            upper75: userForecast / 100,
          }
        : null,
      userBounds: null,
      resolved,
      question: q,
    };
  });
}

export default FanChart;
