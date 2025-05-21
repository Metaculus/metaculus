"use client";
import { isNil, merge } from "lodash";
import React, { FC, useMemo, useState } from "react";
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
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import {
  Area,
  ContinuousForecastInputType,
  FanOption,
  Line,
  YDomain,
} from "@/types/charts";
import { PostGroupOfQuestions } from "@/types/post";
import {
  Quartiles,
  QuestionType,
  QuestionWithNumericForecasts,
  Scaling,
} from "@/types/question";
import {
  generateScale,
  generateYDomain,
  getAxisLeftPadding,
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

const TOOLTIP_WIDTH = 150;

type Props = {
  group: PostGroupOfQuestions<QuestionWithNumericForecasts>;
  height?: number;
  yLabel?: string;
  withTooltip?: boolean;
  extraTheme?: VictoryThemeDefinition;
  pointSize?: number;
  hideCP?: boolean;
};

const FanChart: FC<Props> = ({
  group,
  height = 220,
  yLabel,
  withTooltip = false,
  extraTheme,
  pointSize,
  hideCP,
}) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();

  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const actualTheme = extraTheme
    ? merge({}, chartTheme, extraTheme)
    : chartTheme;
  const tickLabelFontSize = getTickLabelFontSize(actualTheme);

  const [activePoint, setActivePoint] = useState<string | null>(null);

  const forecastAvailability = getGroupForecastAvailability(group.questions);

  const options = useMemo(() => getFanOptions(group), [group]);
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
  } = useMemo(() => buildChartData({ options, height }), [height, options]);

  const labels = adjustLabelsForDisplay(options, chartWidth, actualTheme);
  const { ticks, tickFormat } = yScale;
  const { leftPadding, MIN_LEFT_PADDING } = useMemo(() => {
    return getAxisLeftPadding(yScale, tickLabelFontSize as number, yLabel);
  }, [yScale, tickLabelFontSize, yLabel]);

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
          domainPadding={{
            x: TOOLTIP_WIDTH / 2,
          }}
          padding={{
            left: Math.max(leftPadding, MIN_LEFT_PADDING),
            top: 10,
            right: 10,
            bottom: 20,
          }}
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
                labels={({ datum }: { datum: any }) => datum.x}
                labelComponent={
                  <ChartFanTooltip
                    chartHeight={height}
                    options={options}
                    hideCp={hideCP}
                    forecastAvailability={forecastAvailability}
                  />
                }
                onActivated={(points: any) => {
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
              style={{
                data: {
                  opacity: 0.3,
                },
              }}
            />
          )}
          <VictoryArea
            name="userFanArea"
            data={userArea}
            style={{
              data: {
                fill: getThemeColor(METAC_COLORS.orange["500"]),
                opacity: 0.3,
              },
            }}
          />
          {!hideCP && (
            <VictoryLine name="communityFanLine" data={communityLine} />
          )}
          <VictoryLine
            name="userFanLine"
            data={userLine}
            style={{
              data: {
                stroke: getThemeColor(METAC_COLORS.orange["700"]),
              },
            }}
          />
          <VictoryAxis
            dependentAxis
            label={yLabel}
            tickValues={ticks}
            tickFormat={tickFormat}
            style={{ ticks: { strokeWidth: 1 } }}
            offsetX={Math.max(leftPadding - 2, MIN_LEFT_PADDING - 2)}
            axisLabelComponent={
              <VictoryLabel
                dy={-Math.max(leftPadding - 40, MIN_LEFT_PADDING - 40)}
              />
            }
          />
          <VictoryAxis
            tickValues={options.map((option) => option.name)}
            tickFormat={(_, index) => labels[index] ?? ""}
          />
          {!hideCP && !forecastAvailability?.cpRevealsOn && (
            <VictoryScatter
              data={communityPoints.map((point) => ({
                ...point,
                symbol: "square",
              }))}
              style={{
                data: {
                  fill: () => getThemeColor(METAC_COLORS.olive["800"]),
                  stroke: () => getThemeColor(METAC_COLORS.olive["800"]),
                  strokeWidth: 6,
                  strokeOpacity: ({ datum }) =>
                    activePoint === datum.x ? 0.3 : 0,
                },
              }}
              dataComponent={
                <FanPoint activePoint={activePoint} pointSize={pointSize} />
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
                pointColor={getThemeColor(METAC_COLORS.orange["700"])}
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
                fill: "none",
                stroke: () => getThemeColor(METAC_COLORS.purple["800"]),
                strokeWidth: 2,
                strokeOpacity: 1,
              },
            }}
            dataComponent={
              <FanPoint activePoint={null} pointSize={pointSize} />
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
}: {
  options: FanOption[];
  height: number;
}) {
  // we expect fan graph to be rendered only for group questions, that expect some options
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const groupType = options[0]!.question.type;
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
        optionScaling: option.question.scaling,
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
        y: getResolutionPosition({
          question: option.question,
          scaling,
        }),
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
        optionScaling: option.question.scaling,
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

function getFanGraphScaling(options: FanOption[]): Scaling {
  const zeroPoints: number[] = [];
  const rangeMaxValues: number[] = [];
  const rangeMinValues: number[] = [];
  for (const option of options) {
    if (
      !isNil(option.question.scaling.zero_point) &&
      !!option.communityQuartiles
    ) {
      zeroPoints.push(option.question.scaling.zero_point);
    }

    if (!isNil(option.question.scaling.range_max)) {
      rangeMaxValues.push(option.question.scaling.range_max);
    }

    if (!isNil(option.question.scaling.range_min)) {
      rangeMinValues.push(option.question.scaling.range_min);
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
  optionScaling: Scaling;
  scaling: Scaling;
  withoutScaling: boolean;
}) {
  if (withoutScaling) {
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
  options: FanOption[],
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
): FanOption[] {
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
): FanOption[] {
  return questions
    .map((q) => {
      const latest = q.my_forecasts?.latest;
      const userForecast = extractPrevNumericForecastValue(
        latest && !latest.end_time ? latest.distribution_input : undefined
      );

      let userCdf: number[] | null = null;
      if (userForecast?.components) {
        userForecast.type === ContinuousForecastInputType.Slider
          ? (userCdf = getSliderNumericForecastDataset(
              userForecast.components,
              q.open_lower_bound,
              q.open_upper_bound
            ).cdf)
          : (userCdf = getQuantileNumericForecastDataset(
              userForecast.components,
              q
            ).cdf);
      }

      return {
        name: q.label,
        communityCdf:
          q.aggregations.recency_weighted.latest?.forecast_values ?? [],
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
): FanOption[] {
  return questions.map((q) => {
    const aggregation = q.aggregations.recency_weighted.latest;
    const resolved = q.resolution !== null;

    const latest = q.my_forecasts?.latest;
    const userForecast = extractPrevBinaryForecastValue(
      latest && !latest.end_time ? latest.forecast_values[1] : null
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
