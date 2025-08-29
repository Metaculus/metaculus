"use client";
import { isNil, merge } from "lodash";
import { FC, useMemo, useState } from "react";
import {
  Tuple,
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryContainer,
  VictoryLabel,
  VictoryLine,
  VictoryScatter,
  VictoryThemeDefinition,
  VictoryVoronoiContainer,
} from "victory";

import ChartFanTooltip from "@/components/charts/primitives/chart_fan_tooltip";
import FanPoint from "@/components/charts/primitives/fan_point";
import ForecastAvailabilityChartOverflow from "@/components/post_card/chart_overflow";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import {
  Area,
  ContinuousForecastInputType,
  FanDatum,
  GroupFanDatum,
  Line,
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
import { getGroupForecastAvailability } from "@/utils/questions/forecastAvailability";
import { sortGroupPredictionOptions } from "@/utils/questions/groupOrdering";

import { FanChartVariant, fanVariants } from "./fan_chart_variants";

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
  type: QuestionType.Binary | QuestionType.Numeric;
};

const FanChart: FC<Props> = ({
  group,
  options,
  height = 220,
  yLabel,
  withTooltip = false,
  extraTheme,
  pointSize,
  hideCP,
  variant,
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

  const optionsLike = useMemo<NormalizedFanDatum[]>(() => {
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
    const legacy = group ? getFanOptions(group) : [];
    return legacy.map((opt) => ({
      name: opt.name,
      communityQuartiles: opt.communityQuartiles,
      userQuartiles: opt.userQuartiles,
      communityBounds: opt.communityBounds,
      userBounds: opt.userBounds,
      resolved: opt.resolved,
      optionScaling: opt.question?.scaling ?? null,
      question: opt.question,
      type:
        opt.question?.type === QuestionType.Binary
          ? QuestionType.Binary
          : QuestionType.Numeric,
    }));
  }, [group, options]);
  const {
    communityLine,
    userLine,
    communityArea,
    userArea,
    communityPoints,
    userPoints,
    resolutionPoints,
    yScale,
    yDomain,
  } = useMemo(
    () =>
      buildChartData({
        options: optionsLike,
        height,
        forceTickCount: effectiveVariant === "index" ? 5 : undefined,
      }),
    [height, optionsLike, effectiveVariant]
  );

  const labels = adjustLabelsForDisplay(optionsLike, chartWidth, actualTheme);
  const tooltipOptions: GroupFanDatum[] = useMemo(
    () =>
      optionsLike
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
    [optionsLike]
  );
  const { ticks, tickFormat } = yScale;
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
          domain={{
            y: yDomain,
          }}
          domainPadding={v.domainPadding({
            chartWidth,
            yLabel,
            tickLabelFontSize,
            maxLeftPadding,
            maxRightPadding,
            getThemeColor,
          })}
          padding={v.padding({
            chartWidth,
            yLabel,
            tickLabelFontSize,
            maxLeftPadding,
            maxRightPadding,
            getThemeColor,
          })}
          containerComponent={
            withTooltip ? (
              <VictoryVoronoiContainer
                voronoiBlacklist={[
                  "communityFanArea",
                  "userFanArea",
                  "communityFanLine",
                  "userFanLine",
                ]}
                style={{
                  touchAction: "pan-y",
                }}
                labels={({
                  datum,
                }: {
                  datum: { x: string; xName?: string; y?: number };
                }) => datum.x}
                labelComponent={
                  <ChartFanTooltip
                    chartHeight={height}
                    options={tooltipOptions}
                    hideCp={hideCP}
                    forecastAvailability={forecastAvailability}
                  />
                }
                onActivated={(points: { x: string }[]) => {
                  const x = points[0]?.x;
                  if (!isNil(x)) {
                    setActivePoint(x);
                  }
                }}
              />
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
                onMouseOutCapture: () => {
                  setActivePoint(null);
                },
              },
            },
          ]}
        >
          {!hideCP && (
            <VictoryArea
              name="communityFanArea"
              data={communityArea}
              style={{ data: { opacity: 0.3, fill: palette.communityArea } }}
            />
          )}
          <VictoryArea
            name="userFanArea"
            data={userArea}
            style={{ data: { opacity: 0.3, fill: palette.userArea } }}
          />
          {!hideCP && (
            <VictoryLine
              style={{ data: { stroke: palette.communityLine } }}
              name="communityFanLine"
              data={communityLine}
            />
          )}
          <VictoryLine
            name="userFanLine"
            data={userLine}
            style={{ data: { stroke: palette.userLine } }}
          />
          <VictoryAxis
            dependentAxis
            label={yLabel}
            tickValues={ticks}
            tickFormat={tickFormat}
            style={
              v.yAxisStyle({
                tickLabelFontSize,
                getThemeColor,
                maxLeftPadding,
                maxRightPadding,
              }) ?? { ticks: { strokeWidth: 1 } }
            }
            offsetX={v.axisLabelOffsetX({
              chartWidth,
              yLabel,
              tickLabelFontSize,
              maxLeftPadding,
              maxRightPadding,
              getThemeColor,
            })}
            axisLabelComponent={<VictoryLabel x={chartWidth} />}
          />

          <VictoryAxis
            tickValues={optionsLike.map((option) => option.name)}
            tickFormat={(_, index) => labels[index] ?? ""}
            style={v.xAxisStyle({
              tickLabelFontSize,
              getThemeColor,
              maxLeftPadding,
              maxRightPadding,
            })}
          />
          {!hideCP && !forecastAvailability?.cpRevealsOn && (
            <VictoryScatter
              data={communityPoints.map((point) => ({
                ...point,
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
                />
              }
            />
          )}
          <VictoryScatter
            data={userPoints.map((point) => ({
              ...point,
              symbol: "square",
            }))}
            dataComponent={
              <FanPoint
                activePoint={activePoint}
                pointSize={pointSize}
                pointColor={palette.communityPoint}
              />
            }
          />
          <VictoryScatter
            data={resolutionPoints.map((point) => ({
              ...point,
              symbol: "diamond",
            }))}
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

type FanGraphPoint = { x: string; y: number; resolved: boolean };

function buildChartData({
  options,
  height,
  forceTickCount,
}: {
  options: NormalizedFanDatum[];
  height: number;
  forceTickCount?: number;
}) {
  // we expect fan graph to be rendered only for group questions, that expect some options
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (!options.length) {
    return {
      communityLine: [],
      userLine: [],
      communityArea: [],
      userArea: [],
      communityPoints: [],
      userPoints: [],
      resolutionPoints: [],
      yScale: {
        ticks: [],
        tickFormat: (v: number) => String(v),
      },
      yDomain: [0, 1] as Tuple<number>,
    };
  }
  const groupType: QuestionType = options[0]?.type ?? QuestionType.Numeric;
  const isBinaryGroup = groupType === QuestionType.Binary;
  const communityLine: Line<string> = [];
  const userLine: Line<string> = [];
  const communityArea: Area<string> = [];
  const userArea: Area<string> = [];
  const communityPoints: Array<FanGraphPoint> = [];
  const userPoints: Array<FanGraphPoint> = [];
  const resolutionPoints: Array<FanGraphPoint> = [];

  const scaling = getFanGraphScaling(options);

  for (const option of options) {
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
      });
      communityLine.push(communityLinePoint);
      communityArea.push(communityAreaPoint);
      communityPoints.push(communityPoint);
    }
    if (option.resolved) {
      resolutionPoints.push({
        x: option.name,
        y: Number.isFinite(option.resolvedValue)
          ? (option.resolvedValue as number)
          : option.question
            ? getResolutionPosition({ question: option.question, scaling })
            : NaN,
        resolved: true,
      });
    }
    if (option.userQuartiles) {
      const {
        linePoint: userLinePoint,
        areaPoint: userAreaPoint,
        point: userPoint,
      } = getOptionGraphData({
        name: option.name,
        quartiles: option.userQuartiles,
        optionScaling: option.optionScaling,
        scaling,
        withoutScaling: isBinaryGroup,
      });
      userLine.push(userLinePoint);
      if (!isBinaryGroup) {
        userArea.push(userAreaPoint);
      }
      userPoints.push(userPoint);
    }
  }

  const { originalYDomain, zoomedYDomain } = generateFanGraphYDomain({
    communityArea,
    userArea,
    resolutionPoints,
    includeClosestBoundOnZoom: isBinaryGroup,
  });
  const yScale = generateScale({
    displayType: groupType,
    axisLength: height,
    direction: "vertical",
    scaling: scaling,
    domain: originalYDomain,
    forceTickCount,
    zoomedDomain: zoomedYDomain,
  });

  return {
    communityLine,
    userLine,
    communityArea,
    userArea,
    communityPoints,
    userPoints,
    resolutionPoints,
    yScale,
    yDomain: zoomedYDomain,
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
  communityArea,
  resolutionPoints,
  userArea,
  includeClosestBoundOnZoom,
}: {
  communityArea: Area<string>;
  userArea: Area<string>;
  resolutionPoints: Array<FanGraphPoint>;
  includeClosestBoundOnZoom?: boolean;
}): YDomain {
  const originalYDomain: Tuple<number> = [0, 1];
  const fallback = { originalYDomain, zoomedYDomain: originalYDomain };

  const combinedAreaData = [...communityArea, ...userArea];
  const minValues: number[] = [];
  const maxValues: number[] = [];
  for (const areaPoint of combinedAreaData) {
    if (!isNil(areaPoint.y0)) {
      minValues.push(areaPoint.y0);
    }
    if (!isNil(areaPoint.y)) {
      maxValues.push(areaPoint.y);
    }
  }
  for (const resolutionPoint of resolutionPoints) {
    if (!isNil(resolutionPoint.y)) {
      minValues.push(resolutionPoint.y);
      maxValues.push(resolutionPoint.y);
    }
  }
  const minValue = minValues.length ? Math.min(...minValues) : null;
  const maxValue = maxValues.length ? Math.max(...maxValues) : null;

  if (isNil(minValue) || isNil(maxValue)) {
    return fallback;
  }

  return generateYDomain({
    minValue,
    maxValue,
    includeClosestBoundOnZoom,
  });
}

function getOptionGraphData({
  name,
  quartiles,
  scaling,
  optionScaling,
  withoutScaling,
}: {
  name: string;
  quartiles: Quartiles;
  optionScaling: Scaling | null;
  scaling: Scaling;
  withoutScaling: boolean;
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
        resolved: false,
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

  const labels = options.map((option) => option.name);
  if (!charWidth) {
    return labels;
  }

  const maxLabelLength = Math.max(...labels.map((label) => label.length));
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
