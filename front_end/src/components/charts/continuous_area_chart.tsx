"use client";
import { isNil, merge } from "lodash";
import { useLocale, useTranslations } from "next-intl";
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CursorCoordinatesPropType,
  Tuple,
  VictoryArea,
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryContainer,
  VictoryCursorContainer,
  VictoryLabel,
  VictoryLine,
  VictoryPortal,
  VictoryScatter,
  VictoryThemeDefinition,
} from "victory";

import { CHART_DASH } from "@/constants/chart_dash";
import { CHART_STROKE_WIDTH } from "@/constants/chart_stroke";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { CHART_FONT_STYLE } from "@/constants/chart_typography";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import {
  ContinuousAreaGraphType,
  ContinuousAreaHoverState,
  ContinuousAreaType,
  Line,
  ScaleDirection,
} from "@/types/charts";
import {
  GraphingQuestionProps,
  Question,
  QuestionType,
  QuestionWithForecasts,
  Scaling,
} from "@/types/question";
import { generateScale } from "@/utils/charts/axis";
import {
  getClosestXValue,
  getClosestYValue,
  interpolateYValue,
} from "@/utils/charts/helpers";
import { FEED_CHART_TARGET_POINTS, lttb } from "@/utils/charts/lttb";
import { getResolutionPoint } from "@/utils/charts/resolution";
import { isForecastActive } from "@/utils/forecasts/helpers";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { formatResolution } from "@/utils/formatters/resolution";
import {
  cdfToPmf,
  computeQuartilesFromCDF,
  rescaleCdf,
  unscaleNominalLocation,
} from "@/utils/math";

import ChartValueBox from "./primitives/chart_value_box";
import LineCursorPoints from "./primitives/line_cursor_points";
import OobBreakMarker, {
  OobBreakMarkerDatum,
} from "./primitives/oob_break_marker";
import ResolutionDiamond from "./primitives/resolution_diamond";

type ContinuousAreaColor = "orange" | "green" | "gray" | "purple";
const CHART_COLOR_MAP: Record<ContinuousAreaType, ContinuousAreaColor> = {
  community: "green",
  community_closed: "gray",
  community_resolved: "purple",
  user: "orange",
  user_previous: "orange",
  user_components: "orange",
};

export type ContinuousAreaGraphInput = Array<{
  pmf: number[];
  cdf: number[];
  componentCdfs?: number[][] | null;
  type: ContinuousAreaType;
}>;

const TOP_PADDING = 10;
// Discrete PMFs only: extra top padding reserved when an out-of-bounds bar
// (below-lower / above-upper) is clamped to the axis top, so the break's
// value label has room to render without being clipped.
const OOB_BREAK_TOP_PADDING = 28;
// Y-axis headroom above the tallest in-bounds bar, as a multiple of its
// value. The larger ratio only kicks in when a bar needs to be broken, so
// there's enough room above the tallest in-bounds bar for the notch (see
// `getDiscreteBarPath`) without changing the axis proportions of ordinary
// discrete charts.
const BASE_AXIS_HEADROOM_RATIO = 1.2;
const BREAK_AXIS_HEADROOM_RATIO = 1.5;
const BOTTOM_PADDING = 20;
const HORIZONTAL_PADDING = 10;
const CURSOR_POINT_OFFSET = 5;
const CURSOR_CHART_EXTENSION = 10;

type Props = {
  question: Question | GraphingQuestionProps;
  data: ContinuousAreaGraphInput;
  graphType?: ContinuousAreaGraphType;
  height?: number;
  width?: number;
  extraTheme?: VictoryThemeDefinition;
  onCursorChange?: (value: ContinuousAreaHoverState | null) => void;
  hideCP?: boolean;
  hideLabels?: boolean;
  hideYAxis?: boolean;
  shortLabels?: boolean;
  alignChartTabs?: boolean;
  forceTickCount?: number; // is used on feed page
  variant?: "feed" | "question";
  withResolutionChip?: boolean;
  withTodayLine?: boolean;
  globalScaling?: Scaling;
  colorOverride?: string;
  // Show a value chip at the top of the chart (instead of the cursor circle)
  // when the cursor is near a quartile line. Used by the group distributions view.
  cursorQuartileTooltip?: boolean;
  outlineUser?: boolean;
  centerOOBResolution?: boolean;
  animate?: object;
  onChartReady?: () => void;
};

const ContinuousAreaChart: FC<Props> = ({
  question,
  data,
  graphType = "pmf",
  height = 150,
  width = undefined,
  extraTheme,
  onCursorChange,
  hideCP,
  hideLabels = false,
  hideYAxis = false,
  shortLabels = false,
  alignChartTabs,
  forceTickCount,
  variant = "question",
  withResolutionChip = true,
  withTodayLine = true,
  globalScaling,
  colorOverride,
  cursorQuartileTooltip = false,
  outlineUser = false,
  centerOOBResolution = false,
  animate,
  onChartReady,
}) => {
  const locale = useLocale();
  const t = useTranslations();
  const { ref: chartContainerRef, width: containerWidth } =
    useContainerSize<HTMLDivElement>();
  const chartWidth = width || containerWidth;
  const prevWidth = useRef(0);
  useEffect(() => {
    if (!prevWidth.current && chartWidth && onChartReady) {
      onChartReady();
    }
    prevWidth.current = chartWidth;
  }, [onChartReady, chartWidth]);
  const [cursorEdge, setCursorEdge] = useState<number | null>(null);
  const [cursorX, setCursorX] = useState<number | null>(null);
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const actualTheme = extraTheme
    ? merge({}, chartTheme, extraTheme)
    : chartTheme;

  const discrete = question.type === QuestionType.Discrete;
  const showYAxis =
    graphType === "cdf" ||
    (question.type === QuestionType.Discrete && !hideYAxis);

  // Discrete PMF only: the Y-axis top is derived from the tallest in-bounds
  // bar, excluding the below-lower/above-upper edges, so a disproportionate
  // OOB bar can't squash the rest of the distribution. OOB bars taller than
  // this get clamped to it (see `charts` below) and get a broken-axis marker.
  // When a break is needed, the axis gets extra headroom (BREAK_AXIS_HEADROOM_RATIO
  // rather than BASE_AXIS_HEADROOM_RATIO) so the clamped bar's notch — see
  // `getDiscreteBarPath` below, which relies on this same ratio — has enough
  // room above the tallest in-bounds bar to read clearly.
  const { oobAxisTop, hasOobOverflow, oobBreakThreshold } = useMemo(() => {
    if (question.type !== QuestionType.Discrete || graphType === "cdf") {
      return {
        oobAxisTop: undefined,
        hasOobOverflow: false,
        oobBreakThreshold: undefined,
      };
    }
    const inboundMax = Math.max(
      0,
      ...data.map((x) => x.pmf.slice(1, -1)).flat()
    );
    const base = inboundMax <= 0 ? 1 : inboundMax;
    const needsBreak = data.some(
      (x) =>
        (x.pmf.at(0) ?? 0) > BASE_AXIS_HEADROOM_RATIO * base ||
        (x.pmf.at(-1) ?? 0) > BASE_AXIS_HEADROOM_RATIO * base
    );
    const ratio = needsBreak
      ? BREAK_AXIS_HEADROOM_RATIO
      : BASE_AXIS_HEADROOM_RATIO;
    return {
      oobAxisTop: Math.min(1, ratio * base),
      hasOobOverflow: needsBreak,
      // The tallest in-bounds bar's value: the top of the "normal" scale
      // region. Axis ticks above this fall in the reserved break headroom
      // and are hidden, since that space no longer represents a regular
      // linear continuation of the axis.
      oobBreakThreshold: base,
    };
  }, [data, question.type, graphType]);

  const paddingTop =
    graphType === "cdf" || discrete
      ? discrete && hasOobOverflow
        ? OOB_BREAK_TOP_PADDING
        : TOP_PADDING
      : 0;

  const hasUserData = useMemo(
    () => data.some((d) => d.type === "user"),
    [data]
  );

  const charts = useMemo(() => {
    const parsedData = hideCP
      ? [...data].filter((el) => el.type === "user")
      : data;

    const scaledPerDatum = parsedData.map((datum) => {
      const { pmf, cdf, componentCdfs } = datum;
      const useRescaled = globalScaling && !isNil(question.scaling.zero_point);
      const scaled = useRescaled
        ? (() => {
            const cdfRescaled = rescaleCdf(cdf, question.scaling, {
              ...question.scaling,
              zero_point: globalScaling.zero_point,
            });
            return { cdf: cdfRescaled, pmf: cdfToPmf(cdfRescaled) };
          })()
        : { cdf, pmf };
      return { datum, scaled, componentCdfs };
    });

    // Discrete PMF only: clamp OOB bars to the axis top computed above so
    // they never render past the visible plot.
    const oobCap = oobAxisTop;

    const chartData: NumericPredictionGraph[] = [];
    for (const { datum, scaled, componentCdfs } of scaledPerDatum) {
      chartData.push(
        generateNumericAreaGraph({
          ...scaled,
          graphType,
          type: datum.type,
          question,
          oobCap,
        })
      );
      if (componentCdfs && componentCdfs.length > 1) {
        for (const componentCdf of componentCdfs) {
          chartData.push(
            generateNumericAreaGraph({
              pmf: cdfToPmf(componentCdf),
              cdf: componentCdf,
              graphType,
              type: "user_components",
              question,
              oobCap,
            })
          );
        }
      }
    }
    if (variant === "feed" && question.type !== QuestionType.Discrete) {
      return chartData.map((chart) => ({
        ...chart,
        graphLine: lttb(chart.graphLine, FEED_CHART_TARGET_POINTS),
      }));
    }
    return chartData;
  }, [data, graphType, hideCP, question, globalScaling, variant, oobAxisTop]);

  const { xDomain, yDomain } = useMemo<{
    xDomain: Tuple<number>;
    yDomain: Tuple<number>;
  }>(() => {
    if (question.type !== QuestionType.Discrete) {
      const xDomain: Tuple<number> =
        globalScaling &&
        !isNil(globalScaling.range_min) &&
        !isNil(globalScaling.range_max)
          ? [
              unscaleNominalLocation(globalScaling.range_min, {
                ...question.scaling,
                zero_point: globalScaling.zero_point,
              }),
              unscaleNominalLocation(globalScaling.range_max, {
                ...question.scaling,
                zero_point: globalScaling.zero_point,
              }),
            ]
          : [0, 1];
      if (graphType === "cdf") {
        return {
          xDomain,
          yDomain: [0, 1],
        };
      }

      const maxValue = Math.max(
        ...data.map((x) => x.pmf.slice(1, x.pmf.length - 1)).flat()
      );
      return {
        xDomain,
        yDomain: [0, 1.2 * (maxValue <= 0 ? 1 : maxValue)],
      };
    }
    let xMin = Math.min(
      ...charts.map((chart) => 2 * (chart.graphLine.at(0)?.x ?? 0)),
      0
    );
    let xMax = Math.max(
      ...charts.map((chart) => 1 + 2 * ((chart.graphLine.at(-1)?.x ?? 1) - 1)),
      1
    );

    const N =
      question.inbound_outcome_count ??
      Math.max(1, (data.at(0)?.cdf?.length ?? 1) - 1);
    if (Number.isFinite(N) && N > 0) {
      const halfBin = 0.5 / N;
      if (question.resolution === "below_lower_bound")
        xMin = Math.min(xMin, -halfBin);
      if (question.resolution === "above_upper_bound")
        xMax = Math.max(xMax, 1 + halfBin);
    }
    const xDomain: Tuple<number> = [xMin, xMax];
    if (graphType === "cdf") return { xDomain, yDomain: [0, 1] };

    // Excludes OOB PMF values (pmf[0], pmf[-1]) so an outlying below/above-bound
    // bar doesn't squash the in-bounds distribution. OOB bars are clamped to
    // this same top in `charts` above, with a broken-axis marker drawn on them.
    return {
      xDomain,
      yDomain: [0, oobAxisTop ?? 1],
    };
  }, [
    data,
    charts,
    graphType,
    question.type,
    question.resolution,
    globalScaling,
    question.inbound_outcome_count,
    question.scaling,
    oobAxisTop,
  ]);

  const xScale = useMemo(
    () =>
      generateScale({
        displayType: question.type,
        axisLength: chartWidth,
        direction: ScaleDirection.Horizontal,
        domain: xDomain,
        shortLabels,
        adjustLabels: true,
        question: question,
        forceTickCount,
        alwaysShowTicks: !isNil(forceTickCount),
      }),
    [chartWidth, question, xDomain, shortLabels, forceTickCount]
  );
  const yScale = useMemo(
    () =>
      generateScale({
        displayType: QuestionType.Binary,
        axisLength: height - BOTTOM_PADDING - paddingTop,
        direction: ScaleDirection.Vertical,
        domain: yDomain,
        zoomedDomain: yDomain,
        adjustLabels: true,
      }),
    [height, yDomain, paddingTop]
  );

  // When a bar is broken, ticks above the break sit in headroom reserved for
  // the notch rather than a real linear continuation of the axis, so regular
  // tick labels up there would be misleading — the clamped bar's own value
  // label (rendered on the bar itself) is the only annotation shown there.
  const visibleYTicks = useMemo(() => {
    if (!hasOobOverflow || oobBreakThreshold === undefined) {
      return yScale.ticks;
    }
    return yScale.ticks.filter((tick) => tick <= oobBreakThreshold);
  }, [yScale, hasOobOverflow, oobBreakThreshold]);

  const resolutionPoint =
    !isNil(question.resolution) && question.resolution !== ""
      ? getResolutionPoint({
          questionType: question.type,
          resolution: question.resolution,
          resolveTime: 1,
          scaling: question.scaling,
          inboundOutcomeCount: question.inbound_outcome_count,
        })
      : null;

  const toDiscreteBarCenter = useCallback(
    (norm: number): number => {
      const N =
        question.inbound_outcome_count ??
        Math.max(1, (data.at(0)?.cdf?.length ?? 1) - 1);
      if (!Number.isFinite(norm) || N <= 0) return norm;
      if (norm <= 0 || norm >= 1) return norm;
      const idx = Math.round(norm * (N - 1));
      return (idx + 0.5) / N;
    },
    [question.inbound_outcome_count, data]
  );

  const resX = useMemo(() => {
    if (!resolutionPoint || !Number.isFinite(resolutionPoint.y as number)) {
      return null;
    }
    return question.type === QuestionType.Discrete
      ? toDiscreteBarCenter(resolutionPoint.y as number)
      : (resolutionPoint.y as number);
  }, [resolutionPoint, question.type, toDiscreteBarCenter]);

  const forcedOobSide: "left" | "right" | null = useMemo(() => {
    if (question.resolution === "below_lower_bound") return "left";
    if (question.resolution === "above_upper_bound") return "right";
    return null;
  }, [question.resolution]);

  const resPlacement = useMemo<"in" | "left" | "right" | null>(() => {
    if (resX == null || !Number.isFinite(resX)) return null;
    if (forcedOobSide) return forcedOobSide;

    const baseMin = 0;
    const baseMax = 1;
    const EPS = 1e-9;

    if (resX < baseMin - EPS) return "left";
    if (resX > baseMax + EPS) return "right";
    return "in";
  }, [resX, forcedOobSide]);

  const formattedResolution = formatResolution({
    resolution: question.resolution,
    questionType: question.type,
    locale,
    scaling: question.scaling,
    actual_resolve_time: null,
  });
  // TODO: find a nice way to display the out of bounds weights as numbers
  // const massBelowBounds = dataset[0];
  // const massAboveBounds = dataset[dataset.length - 1];
  const horizontalPadding = useMemo(() => {
    if (alignChartTabs || showYAxis) {
      const labels = yScale.ticks.map((tick) => yScale.tickFormat(tick));
      const longestLabelLength = Math.max(
        ...labels.map((label) => label.length)
      );
      const longestLabelWidth = Math.max(5, longestLabelLength) * 5;

      return HORIZONTAL_PADDING + longestLabelWidth;
    }

    return HORIZONTAL_PADDING;
  }, [yScale, showYAxis, alignChartTabs]);

  const handleMouseLeave = useCallback(() => {
    onCursorChange?.(null);
    setCursorEdge(null);
    setCursorX(null);
  }, [onCursorChange]);

  const handleMouseMove = useCallback(
    (evt: MouseEvent) => {
      const svg = chartContainerRef.current?.firstChild as SVGElement;
      if (!svg) return;
      setCursorEdge(null);
      const bounds = svg.getBoundingClientRect();
      const chartLeft = bounds.left + horizontalPadding;
      const chartRight = bounds.right - horizontalPadding;

      // Used to handle cursor display when hovering chart edges
      if (
        (evt.clientX >= chartLeft - CURSOR_CHART_EXTENSION &&
          evt.clientX <= chartLeft) ||
        (evt.clientX <= chartRight + CURSOR_CHART_EXTENSION &&
          evt.clientX >= chartRight)
      ) {
        const firstBucketLocation =
          question.type !== QuestionType.Discrete
            ? 0
            : (question.open_lower_bound ? -0.5 : 0.5) /
              ((data.at(0)?.pmf.length || 200) - 2);
        const lastBucketLocation =
          question.type !== QuestionType.Discrete
            ? 1
            : 1 +
              (question.open_upper_bound ? 0.5 : -0.5) /
                ((data.at(0)?.pmf.length || 200) - 2);

        let normalizedX: number | undefined;
        if (evt.clientX < chartLeft) {
          normalizedX = firstBucketLocation;
        } else if (evt.clientX > chartRight) {
          normalizedX = lastBucketLocation;
        }
        if (normalizedX !== undefined) {
          setCursorEdge(normalizedX);
          const hoverState = charts.reduce<ContinuousAreaHoverState>(
            (acc, el) => {
              if (
                el.graphType === "pmf" ||
                question.type === QuestionType.Discrete
              ) {
                acc.yData[el.type] = getClosestYValue(
                  normalizedX as number,
                  el.graphLine
                );
                return acc;
              }

              acc.yData[el.type] = interpolateYValue(
                normalizedX as number,
                el.graphLine
              );
              return acc;
            },
            {
              x: normalizedX,
              yData: {
                community: 0,
                user: 0,
                user_previous: 0,
                community_closed: 0,
                community_resolved: 0,
                user_components: 0,
              },
            }
          );
          onCursorChange?.(hoverState);
        }
      }
    },
    [
      charts,
      onCursorChange,
      chartContainerRef,
      horizontalPadding,
      data,
      question,
    ]
  );
  useEffect(() => {
    const svg = chartContainerRef.current?.firstChild as SVGElement;
    if (!svg) return;

    svg.addEventListener("mousemove", handleMouseMove);
    svg.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      svg.removeEventListener("mousemove", handleMouseMove);
      svg.removeEventListener("mouseleave", handleMouseLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartContainerRef.current, handleMouseMove, handleMouseLeave]);

  const barWidth = useMemo(() => {
    if (question.type !== QuestionType.Discrete) {
      return (chartWidth - 30) / (1.07 * ((data.at(0)?.cdf.length || 200) - 1));
    }
    const openBoundCount =
      (question.open_lower_bound ? 1 : 0) + (question.open_upper_bound ? 1 : 0);
    return (
      (chartWidth - horizontalPadding) /
      (1.09 * ((question.inbound_outcome_count || 200) + openBoundCount))
    );
  }, [chartWidth, data, question, horizontalPadding]);

  // When enabled, snap a value chip to the nearest quartile line while the
  // cursor is close to it (used in the group distributions view). Replaces the
  // cursor circle at that moment.
  const quartileTooltip = useMemo(() => {
    if (!cursorQuartileTooltip || cursorX == null || discrete) return null;
    const displayChart = charts.find((c) => c.type !== "user_components");
    if (!displayChart) return null;
    const innerWidth = chartWidth - 2 * horizontalPadding;
    if (innerWidth <= 0) return null;
    const threshold = 10 / innerWidth;
    let best: { x: number; y: number | null } | null = null;
    let bestIndex = -1;
    let bestDist = Infinity;
    // verticalLines order is [lower25, median, upper75].
    for (const [index, line] of displayChart.verticalLines.entries()) {
      const d = Math.abs(cursorX - line.x);
      if (d < bestDist) {
        bestDist = d;
        best = line;
        bestIndex = index;
      }
    }
    if (!best || bestDist > threshold) return null;
    const topLabel =
      bestIndex === 0
        ? t("quartileLabelP25")
        : bestIndex === 2
          ? t("quartileLabelP75")
          : t("quartileLabelMedian");
    return {
      // Anchor the chip where the curve meets the quartile line (i.e. where the
      // cursor circle would be).
      x: best.x,
      y: best.y ?? 0,
      topLabel,
      label: getPredictionDisplayValue(best.x, {
        questionType: question.type,
        scaling: question.scaling,
        actual_resolve_time: null,
      }),
    };
  }, [
    cursorQuartileTooltip,
    cursorX,
    discrete,
    charts,
    chartWidth,
    horizontalPadding,
    question.type,
    question.scaling,
    t,
  ]);
  const CursorContainer = (
    <VictoryCursorContainer
      cursorLabel={"label"}
      cursorLabelOffset={{ x: 0, y: 0 }}
      style={{
        strokeWidth: 0,
        touchAction: "pan-y",
      }}
      cursorLabelComponent={
        <LineCursorPoints
          chartData={charts
            .filter((chart) => chart.type !== "user_components")
            .map((chart) => ({
              line: chart.graphLine,
              color: (() => {
                if (colorOverride && chart.type !== "user") {
                  return colorOverride;
                }
                switch (chart.color) {
                  case "orange":
                    return getThemeColor(
                      METAC_COLORS.orange[chart.type === "user" ? "800" : "500"]
                    );
                  case "gray":
                    return getThemeColor(METAC_COLORS.gray["500"]);
                  case "purple":
                    return getThemeColor(METAC_COLORS.purple["700"]);
                  default:
                    return getThemeColor(METAC_COLORS.olive["700"]);
                }
              })(),
              type: chart.type,
              graphType: chart.graphType,
            }))}
          yDomain={yDomain}
          xDomain={xDomain}
          chartWidth={chartWidth}
          chartHeight={height}
          barWidth={barWidth}
          paddingTop={paddingTop}
          paddingBottom={BOTTOM_PADDING}
          paddingLeft={horizontalPadding}
          paddingRight={horizontalPadding}
          discrete={discrete}
          suppress={!!quartileTooltip}
        />
      }
      onCursorChange={(value: CursorCoordinatesPropType | null) => {
        const x = typeof value === "number" ? value : value?.x;

        if (isNil(x)) {
          onCursorChange?.(null);
          if (cursorQuartileTooltip) setCursorX(null);
          return;
        }
        if (cursorQuartileTooltip) setCursorX(x);

        const hoverState = charts.reduce<ContinuousAreaHoverState>(
          (acc, el) => {
            if (!discrete) {
              if (el.graphType === "pmf") {
                acc.yData[el.type] = getClosestYValue(x, el.graphLine);
              } else {
                acc.yData[el.type] = interpolateYValue(x, el.graphLine);
              }
            } else {
              acc.yData[el.type] = getClosestYValue(x, el.graphLine);
              acc.x = getClosestXValue(x, el.graphLine);
            }
            return acc;
          },
          {
            x,
            yData: {
              community: 0,
              user: 0,
              user_previous: 0,
              community_closed: 0,
              community_resolved: 0,
              user_components: 0,
            },
          }
        );

        onCursorChange?.(hoverState);
      }}
    />
  );
  const todayLabelPosition = useMemo(() => {
    const visibleChartLength = chartWidth - 2 * horizontalPadding;
    const point = {
      x:
        horizontalPadding +
        ((chartWidth - 2 * horizontalPadding) *
          (unscaleNominalLocation(
            Math.floor(Date.now() / 1000),
            question.scaling
          ) -
            xDomain[0])) /
          (xDomain[1] - xDomain[0]),
      y: 0,
    };
    if (point.x < 0 || point.x > visibleChartLength) {
      return null;
    }
    return point;
  }, [chartWidth, horizontalPadding, question.scaling, xDomain]);

  return (
    <div ref={chartContainerRef} className="h-full w-full" style={{ height }}>
      {!!chartWidth && (
        <VictoryChart
          width={chartWidth}
          height={height}
          theme={actualTheme}
          padding={{
            top: paddingTop,
            left: horizontalPadding,
            bottom: BOTTOM_PADDING,
            right: horizontalPadding,
          }}
          domain={{ x: xDomain, y: yDomain }}
          animate={animate}
          containerComponent={
            onCursorChange ? (
              CursorContainer
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
        >
          {charts
            .filter((chart) => chart.type !== "user_components")
            .map((chart, index) => {
              if (!discrete) {
                return (
                  <VictoryArea
                    key={`area-${index}`}
                    data={chart.graphLine}
                    style={{
                      data: {
                        fill: (() => {
                          if (colorOverride && chart.type !== "user") {
                            return colorOverride;
                          }
                          if (extraTheme?.area?.style?.data?.fill) {
                            return extraTheme.area.style.data.fill;
                          }
                          switch (chart.color) {
                            case "orange":
                              return getThemeColor(
                                METAC_COLORS.orange[
                                  chart.type === "user" ? "500" : "400"
                                ]
                              );
                            case "green":
                              return getThemeColor(METAC_COLORS.olive["500"]);
                            case "gray":
                              return getThemeColor(METAC_COLORS.gray["500"]);
                            case "purple":
                              return getThemeColor(METAC_COLORS.purple["500"]);
                            default:
                              return undefined;
                          }
                        })(),
                        opacity:
                          outlineUser && chart.type === "user"
                            ? 0
                            : chart.type === "user_previous"
                              ? 0.1
                              : 0.3,
                      },
                    }}
                  />
                );
              }
              return (
                <VictoryBar
                  key={`bar-${index}`}
                  data={chart.graphLine}
                  style={{
                    data: {
                      fill: (() => {
                        if (colorOverride && chart.type !== "user") {
                          return colorOverride;
                        }
                        if (extraTheme?.area?.style?.data?.fill) {
                          return extraTheme.area.style.data.fill;
                        }
                        switch (chart.color) {
                          case "orange":
                            return getThemeColor(
                              METAC_COLORS.orange[
                                chart.type === "user" ? "500" : "400"
                              ]
                            );
                          case "green":
                            return getThemeColor(METAC_COLORS.olive["500"]);
                          case "gray":
                            return getThemeColor(METAC_COLORS.gray["500"]);
                          case "purple":
                            return getThemeColor(METAC_COLORS.purple["500"]);
                          default:
                            return undefined;
                        }
                      })(),
                      opacity: chart.type === "user_previous" ? 0.1 : 0.3,
                    },
                  }}
                  barWidth={barWidth}
                  getPath={
                    chart.oobClamped
                      ? (props) =>
                          getDiscreteBarPath(
                            props as unknown as BarPathProps,
                            chart.oobClamped
                          )
                      : undefined
                  }
                />
              );
            })}
          {discrete &&
            charts.flatMap((chart, chartIndex) => {
              if (!chart.oobClamped) return [];
              const points: Array<{
                key: string;
                x: number;
                y: number;
                datum: OobBreakMarkerDatum;
              }> = [];
              for (const side of ["left", "right"] as const) {
                const clamp = chart.oobClamped[side];
                if (!clamp) continue;
                points.push({
                  key: `${chartIndex}-${side}`,
                  x: clamp.x,
                  y: clamp.clampedY,
                  datum: {
                    trueValue: clamp.trueY,
                    formatValue: (v: number) => `${(v * 100).toFixed(1)}%`,
                  },
                });
              }
              return points.map((p) => (
                <VictoryScatter
                  key={`oob-break-${p.key}`}
                  data={[{ x: p.x, y: p.y, ...p.datum }]}
                  dataComponent={
                    <VictoryPortal>
                      <OobBreakMarker />
                    </VictoryPortal>
                  }
                />
              ));
            })}
          {!discrete
            ? charts.map((chart, index) => (
                <VictoryLine
                  key={`line-${index}`}
                  data={chart.graphLine}
                  style={{
                    data: {
                      stroke: (() => {
                        if (colorOverride && chart.type !== "user") {
                          return colorOverride;
                        }
                        if (extraTheme?.line?.style?.data?.stroke) {
                          return extraTheme?.line?.style?.data?.stroke;
                        }
                        switch (chart.color) {
                          case "orange":
                            return getThemeColor(
                              METAC_COLORS.orange[
                                chart.type === "user"
                                  ? "500"
                                  : chart.type === "user_components"
                                    ? "500"
                                    : "200"
                              ]
                            );
                          case "green":
                            return getThemeColor(METAC_COLORS.olive["500"]);
                          case "gray":
                            return getThemeColor(METAC_COLORS.gray["500"]);
                          case "purple":
                            return getThemeColor(METAC_COLORS.purple["700"]);
                          default:
                            return undefined;
                        }
                      })(),
                      strokeDasharray:
                        chart.type === "user_previous"
                          ? CHART_DASH.quartile
                          : undefined,
                    },
                  }}
                />
              ))
            : null}
          {showYAxis && (
            // Prevent Y axis being cut off in edge cases
            <VictoryPortal>
              <VictoryAxis
                dependentAxis
                orientation="right"
                style={{
                  tickLabels: {
                    ...CHART_FONT_STYLE.tick,
                    // Right-align labels flush to the right margin.
                    padding: Math.max(horizontalPadding - 4, 2),
                    textAnchor: "end",
                    fill: getThemeColor(METAC_COLORS.gray["700"]),
                  },
                  ticks: { stroke: "transparent" },
                  axis: {
                    stroke: getThemeColor(METAC_COLORS.gray["300"]),
                    strokeWidth: 1,
                  },
                }}
                tickValues={visibleYTicks}
                tickFormat={yScale.tickFormat}
                axisValue={xDomain[1]}
              />
            </VictoryPortal>
          )}
          <VictoryAxis
            tickValues={xScale.ticks}
            tickFormat={
              hideLabels || (hideCP && !hasUserData)
                ? () => ""
                : xScale.tickFormat
            }
            style={{
              ticks: {
                strokeWidth: 1,
                stroke: "transparent",
              },
              axis: {
                strokeWidth: 0,
              },
              tickLabels: {
                ...CHART_FONT_STYLE.tick,
                fill: getThemeColor(METAC_COLORS.gray["700"]),
                textAnchor: ({ index, ticks }) =>
                  // We want first and last labels be aligned against area boundaries
                  // except for discrete questions, whose first and last ticks are not
                  // at the edges of the chart
                  index === 0 && question.type !== QuestionType.Discrete
                    ? "start"
                    : index === ticks.length - 1 &&
                        question.type !== QuestionType.Discrete
                      ? "end"
                      : "middle",
              },
            }}
          />
          {/* Horizontal line */}
          {charts.map((chart, index) => (
            <VictoryLine
              key={`line-${index}`}
              data={[
                { x: 0, y: 0 },
                { x: 1, y: 0 },
              ]}
              style={{
                data: {
                  stroke: (() => {
                    // The x-axis baseline stays grayscale in the distributions
                    // view (colorOverride) regardless of subquestion color/state.
                    if (colorOverride) {
                      return getThemeColor(METAC_COLORS.gray["400"]);
                    }
                    switch (chart.color) {
                      case "orange":
                        return getThemeColor(METAC_COLORS.orange["800"]);
                      case "gray":
                        return getThemeColor(METAC_COLORS.gray["500"]);
                      case "purple":
                        return getThemeColor(METAC_COLORS.purple["700"]);
                      default:
                        return undefined;
                    }
                  })(),
                },
              }}
            />
          ))}
          {/* Left/Right borders at bounds — only meaningful on a shared (global)
              scale. Gated on globalScaling so standalone charts (prediction
              inputs, single distributions) don't render an asymmetric edge line. */}
          {globalScaling &&
            (question.scaling.range_min ?? 1) <=
              (globalScaling.range_min ?? 0) && (
              <VictoryLine
                data={[
                  { x: 0, y: yDomain[0] },
                  { x: 0, y: yDomain[1] * 0.9 },
                ]}
                style={{
                  data: {
                    stroke: getThemeColor(METAC_COLORS.gray["500"]),
                    strokeWidth: 0.5,
                  },
                }}
              />
            )}
          {globalScaling &&
            (question.scaling.range_max ?? 0) >=
              (globalScaling.range_max ?? 1) && (
              <VictoryLine
                data={[
                  { x: 1, y: yDomain[0] },
                  { x: 1, y: yDomain[1] * 0.9 },
                ]}
                style={{
                  data: {
                    stroke: getThemeColor(METAC_COLORS.gray["500"]),
                    strokeWidth: 0.5,
                  },
                }}
              />
            )}
          {charts.map((chart, k) =>
            chart.verticalLines.map((line, index) => {
              // The quartile line under the cursor becomes solid and thicker.
              const isActiveQuartile =
                !!quartileTooltip && quartileTooltip.x === line.x;
              return (
                <VictoryLine
                  key={`${k}-${index}`}
                  data={[
                    { x: line.x, y: 0 },
                    { x: line.x, y: line.y },
                  ]}
                  style={{
                    data: {
                      stroke: (() => {
                        if (colorOverride && chart.type !== "user") {
                          return colorOverride;
                        }
                        switch (chart.color) {
                          case "orange":
                            return getThemeColor(METAC_COLORS.orange["700"]);
                          case "gray":
                            return getThemeColor(METAC_COLORS.gray["500"]);
                          case "purple":
                            return getThemeColor(METAC_COLORS.purple["700"]);
                          default:
                            return undefined;
                        }
                      })(),
                      strokeDasharray: isActiveQuartile
                        ? undefined
                        : CHART_DASH.quartile,
                      strokeWidth: isActiveQuartile ? 2 : undefined,
                    },
                  }}
                />
              );
            })
          )}

          {/* Today's date dot for date questions */}
          {question.type === QuestionType.Date && withTodayLine && (
            <VictoryScatter
              data={[
                {
                  x: unscaleNominalLocation(
                    Math.floor(Date.now() / 1000),
                    question.scaling
                  ),
                  y: yDomain[0], // Bottom of the chart
                  symbol: "circle",
                  size: 3,
                },
              ]}
              style={{
                data: {
                  fill: getThemeColor(METAC_COLORS.blue["700"]),
                  stroke: "none",
                },
              }}
            />
          )}

          {question.type === QuestionType.Date &&
            todayLabelPosition &&
            withTodayLine && (
              <VictoryPortal>
                <VictoryLabel
                  x={todayLabelPosition.x}
                  y={height - BOTTOM_PADDING - 12} // Position above the dot
                  text="Today"
                  style={{
                    ...CHART_FONT_STYLE.tooltip,
                    fill: getThemeColor(METAC_COLORS.blue["700"]),
                  }}
                  textAnchor="middle"
                />
              </VictoryPortal>
            )}

          {/* Resolution point */}
          {resX != null && resPlacement === "in" && (
            <VictoryScatter
              data={[
                {
                  x: resX,
                  y: 0,
                  symbol: "diamond",
                  size: 4,
                },
              ]}
              style={{
                data: {
                  stroke: getThemeColor(METAC_COLORS.purple["800"]),
                  fill: getThemeColor(METAC_COLORS.gray["200"]),
                  strokeWidth: CHART_STROKE_WIDTH.resolutionDiamond,
                },
              }}
            />
          )}
          {/* Resolution chip */}
          {resX != null &&
            resPlacement === "in" &&
            withResolutionChip &&
            [
              QuestionType.Numeric,
              QuestionType.Discrete,
              QuestionType.Date,
            ].includes(question.type) && (
              <VictoryScatter
                data={[
                  {
                    x: resX,
                    y: 0,
                    symbol: "diamond",
                    size: 4,
                  },
                ]}
                dataComponent={
                  <VictoryPortal>
                    <ChartValueBox
                      rightPadding={0}
                      chartWidth={chartWidth}
                      isCursorActive={false}
                      isDistributionChip
                      colorOverride={METAC_COLORS.purple["800"]}
                      resolution={formattedResolution}
                    />
                  </VictoryPortal>
                }
              />
            )}

          {/* Resolution chip for out of bounds resolution */}
          {resX != null &&
            resPlacement !== "in" &&
            withResolutionChip &&
            [
              QuestionType.Numeric,
              QuestionType.Discrete,
              QuestionType.Date,
            ].includes(question.type) && (
              <VictoryScatter
                data={[
                  {
                    x:
                      resPlacement === "left"
                        ? Math.min(...xDomain)
                        : Math.max(...xDomain),
                    y: centerOOBResolution ? Math.max(...yDomain) / 2 : 0,
                    placement: resPlacement,
                  },
                ]}
                dataComponent={
                  <VictoryPortal>
                    <ChartValueBox
                      rightPadding={0}
                      chartWidth={chartWidth}
                      isCursorActive={false}
                      isDistributionChip
                      colorOverride={METAC_COLORS.purple["800"]}
                      resolution={formattedResolution}
                      textAlignToSide={centerOOBResolution}
                    />
                  </VictoryPortal>
                }
              />
            )}

          {resX != null && resPlacement && resPlacement !== "in" && (
            <VictoryPortal>
              <VictoryScatter
                data={[
                  {
                    x:
                      resPlacement === "left"
                        ? Math.min(...xDomain)
                        : Math.max(...xDomain),
                    y: centerOOBResolution ? Math.max(...yDomain) / 2 : 0,
                    placement: resPlacement,
                    primary: METAC_COLORS.purple["800"],
                    secondary: METAC_COLORS.purple["500"],
                  },
                ]}
                dataComponent={<ResolutionDiamond hoverable={false} />}
              />
            </VictoryPortal>
          )}

          {/* Manually render cursor component when cursor is on edge */}
          {!isNil(cursorEdge) && (
            <LineCursorPoints
              chartWidth={chartWidth}
              x={
                cursorEdge < 0.5
                  ? horizontalPadding + CURSOR_POINT_OFFSET
                  : chartWidth - horizontalPadding + CURSOR_POINT_OFFSET
              }
              datum={{
                x: cursorEdge,
                y: 0,
              }}
              chartData={charts
                .filter((chart) => chart.type !== "user_components")
                .map((chart) => ({
                  line: chart.graphLine,
                  color: (() => {
                    if (colorOverride && chart.type !== "user") {
                      return colorOverride;
                    }
                    switch (chart.color) {
                      case "orange":
                        return getThemeColor(
                          METAC_COLORS.orange[
                            chart.type === "user" ? "800" : "500"
                          ]
                        );
                      case "gray":
                        return getThemeColor(METAC_COLORS.gray["500"]);
                      case "purple":
                        return getThemeColor(METAC_COLORS.purple["700"]);
                      default:
                        return getThemeColor(METAC_COLORS.olive["700"]);
                    }
                  })(),
                  type: chart.type,
                  graphType: chart.graphType,
                }))}
              chartHeight={height}
              yDomain={yDomain}
              xDomain={xDomain}
              paddingBottom={BOTTOM_PADDING}
              paddingTop={paddingTop}
              paddingLeft={horizontalPadding}
              paddingRight={horizontalPadding}
              discrete={discrete}
              barWidth={barWidth}
            />
          )}

          {/* Value chip snapped to the nearest quartile line on hover */}
          {quartileTooltip && (
            <VictoryScatter
              data={[{ x: quartileTooltip.x, y: quartileTooltip.y }]}
              dataComponent={
                <VictoryPortal>
                  <ChartValueBox
                    isCursorActive
                    chartWidth={chartWidth}
                    rightPadding={horizontalPadding}
                    colorOverride={colorOverride}
                    getCursorValue={() => quartileTooltip.label}
                    topLabel={quartileTooltip.topLabel}
                  />
                </VictoryPortal>
              }
            />
          )}
        </VictoryChart>
      )}
    </div>
  );
};

type OobClampedBar = {
  x: number;
  clampedY: number;
  trueY: number;
};

type NumericPredictionGraph = {
  graphLine: Line;
  verticalLines: Line;
  color: ContinuousAreaColor;
  type: ContinuousAreaType;
  graphType: ContinuousAreaGraphType;
  oobClamped?: {
    left?: OobClampedBar;
    right?: OobClampedBar;
  };
};

type BarPathProps = {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  datum?: { x?: number };
};

// The notch cut into a clamped OOB bar is anchored to the tallest in-bounds
// bar's height (not an arbitrary fraction of the OOB bar's own height): the
// solid lower segment rises to just above that neighboring bar, then a real
// gap (a hole in the path — nothing painted, so the actual background shows
// through) separates it from the cap, which fills the rest of the way up to
// the axis top. Since the axis top is BREAK_AXIS_HEADROOM_RATIO × the
// tallest in-bounds bar's value whenever a break is needed, the tallest
// in-bounds bar's pixel height is `barHeight / BREAK_AXIS_HEADROOM_RATIO`.
const OOB_NEIGHBOR_CLEARANCE = 4;
const OOB_GAP_HEIGHT = 18;
const OOB_GAP_SLANT = 6;
const OOB_MIN_CAP_HEIGHT = 10;

function getDiscreteBarPath(
  props: BarPathProps,
  oobClamped: NumericPredictionGraph["oobClamped"]
): string {
  const { x0, x1, y0, y1, datum } = props;
  const isOobEdge =
    !!oobClamped &&
    (oobClamped.left?.x === datum?.x || oobClamped.right?.x === datum?.x);

  const plainRect = `M ${x0},${y0} L ${x0},${y1} L ${x1},${y1} L ${x1},${y0} Z`;
  if (!isOobEdge) {
    return plainRect;
  }

  const barHeight = y0 - y1;
  const neighborTop = y0 - barHeight / BREAK_AXIS_HEADROOM_RATIO;
  const gapBottom = neighborTop - OOB_NEIGHBOR_CLEARANCE;
  const gapTop = gapBottom - OOB_GAP_HEIGHT;
  const capHeight = gapTop - y1;

  // Not enough headroom above the neighboring bar for a legible notch (very
  // short bar): fall back to a plain, un-broken rect rather than a cramped one.
  if (capHeight < OOB_MIN_CAP_HEIGHT) {
    return plainRect;
  }

  const slant = Math.min(OOB_GAP_SLANT, (x1 - x0) / 2);

  return (
    `M ${x0},${y0} L ${x0},${gapBottom} L ${x1},${gapBottom - slant} L ${x1},${y0} Z ` +
    `M ${x0},${gapTop} L ${x0},${y1} L ${x1},${y1} L ${x1},${gapTop - slant} Z`
  );
}

function generateNumericAreaGraph(data: {
  pmf: number[];
  cdf: number[];
  graphType: ContinuousAreaGraphType;
  type: ContinuousAreaType;
  question: Question | GraphingQuestionProps;
  oobCap?: number;
}): NumericPredictionGraph {
  const { pmf, cdf, graphType, type, question, oobCap } = data;

  const graph: Line = [];
  const oobClamped: { left?: OobClampedBar; right?: OobClampedBar } = {};
  if (question.type === QuestionType.Discrete) {
    if (graphType === "cdf") {
      if (question.open_lower_bound) {
        graph.push({
          x: -0.5 / (cdf.length - 1),
          y: cdf.at(0) ?? 0,
        });
      }
      cdf.slice(1).forEach((value, index) => {
        graph.push({ x: (index + 0.5) / (cdf.length - 1), y: value });
      });
      if (question.open_upper_bound) {
        graph.push({
          x: (cdf.length - 0.5) / (cdf.length - 1),
          y: 1,
        });
      }
    } else {
      if (question.open_lower_bound) {
        const trueY = pmf.at(0) ?? 0;
        const x = -0.5 / (cdf.length - 1);
        const clampedY =
          oobCap !== undefined && trueY > oobCap ? oobCap : trueY;
        if (clampedY !== trueY) {
          oobClamped.left = { x, clampedY, trueY };
        }
        graph.push({ x, y: clampedY });
      }
      pmf.slice(1, -1).forEach((value, index) => {
        graph.push({ x: (index + 0.5) / (cdf.length - 1), y: value });
      });
      if (question.open_upper_bound) {
        const trueY = pmf.at(-1) ?? 0;
        const x = (cdf.length - 0.5) / (cdf.length - 1);
        const clampedY =
          oobCap !== undefined && trueY > oobCap ? oobCap : trueY;
        if (clampedY !== trueY) {
          oobClamped.right = { x, clampedY, trueY };
        }
        graph.push({ x, y: clampedY });
      }
    }
  } else {
    if (graphType === "cdf") {
      cdf.forEach((value, index) => {
        if (index === 0) {
          // extend to the left edge so the area fills the full width
          graph.push({ x: -1e-10, y: value });
          return;
        }
        if (index === cdf.length - 1) {
          // extend to the right edge so the area fills the full width
          graph.push({ x: 1 + 1e-10, y: value });
          return;
        }
        graph.push({ x: (index - 0.5) / (cdf.length - 1), y: value });
      });
    } else {
      pmf.forEach((value, index) => {
        if (index === 0) {
          // add a point at the beginning to extend pmf to the edge
          graph.push({ x: -1e-10, y: pmf[1] ?? null });
          return;
        }
        if (index === pmf.length - 1) {
          // add a point at the end to extend pmf to the edge
          graph.push({ x: 1 + 1e-10, y: pmf[pmf.length - 2] ?? null });
          return;
        }
        graph.push({ x: (index - 0.5) / (pmf.length - 2), y: value });
      });
    }
  }

  const hasOobClamp = !!(oobClamped.left || oobClamped.right);
  if (type === "user_components") {
    return {
      graphLine: graph,
      verticalLines: [],
      color: CHART_COLOR_MAP[type],
      type,
      graphType,
      ...(hasOobClamp ? { oobClamped } : {}),
    };
  }

  const verticalLines: Line = [];
  const quantiles = computeQuartilesFromCDF(cdf);
  if (question.type !== QuestionType.Discrete) {
    verticalLines.push(
      {
        x: quantiles.lower25,
        y: interpolateYValue(quantiles.lower25, graph),
      },
      {
        x: quantiles.median,
        y: interpolateYValue(quantiles.median, graph),
      },
      {
        x: quantiles.upper75,
        y: interpolateYValue(quantiles.upper75, graph),
      }
    );
  } else {
    // Discrete case uses a bar chart, so has to snap to y values
    verticalLines.push(
      {
        x: quantiles.lower25,
        y: getClosestYValue(quantiles.lower25, graph),
      },
      {
        x: quantiles.median,
        y: getClosestYValue(quantiles.median, graph),
      },
      {
        x: quantiles.upper75,
        y: getClosestYValue(quantiles.upper75, graph),
      }
    );
  }

  return {
    graphLine: graph,
    verticalLines,
    color: CHART_COLOR_MAP[type],
    type,
    graphType,
    ...(hasOobClamp ? { oobClamped } : {}),
  };
}

export function getContinuousAreaChartData({
  question,
  userForecastOverride,
  isClosed,
  isResolved,
}: {
  question: QuestionWithForecasts;
  userForecastOverride?: {
    cdf: number[];
    pmf: number[];
  };
  isClosed?: boolean;
  isResolved?: boolean;
}): ContinuousAreaGraphInput {
  if (
    question.type !== QuestionType.Numeric &&
    question.type !== QuestionType.Discrete &&
    question.type !== QuestionType.Date
  ) {
    return [];
  }

  const chartData: ContinuousAreaGraphInput = [];

  const latest =
    question.aggregations[question.default_aggregation_method].latest;
  const userForecast = question.my_forecasts?.latest;

  if (latest && isForecastActive(latest)) {
    const type: ContinuousAreaType = isResolved
      ? "community_resolved"
      : isClosed
        ? "community_closed"
        : "community";
    chartData.push({
      pmf: cdfToPmf(latest.forecast_values),
      cdf: latest.forecast_values,
      type,
    });
  }

  if (userForecastOverride) {
    chartData.push({
      pmf: userForecastOverride.pmf,
      cdf: userForecastOverride.cdf,
      type: "user" as ContinuousAreaType,
    });
  } else if (!!userForecast && isForecastActive(userForecast)) {
    chartData.push({
      pmf: cdfToPmf(userForecast.forecast_values),
      cdf: userForecast.forecast_values,
      type: "user" as ContinuousAreaType,
    });
  }

  return chartData;
}

export default React.memo(ContinuousAreaChart);
