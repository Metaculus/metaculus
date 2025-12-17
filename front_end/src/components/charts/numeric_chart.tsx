"use client";
import { FloatingPortal } from "@floating-ui/react";
import { isNil, merge } from "lodash";
import {
  FC,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CursorCoordinatesPropType,
  DomainTuple,
  LineSegment,
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryContainer,
  VictoryCursorContainer,
  VictoryLabelProps,
  VictoryLine,
  VictoryPortal,
  VictoryScatter,
  VictoryThemeDefinition,
} from "victory";

import ChartContainer from "@/components/charts/primitives/chart_container";
import ChartCursorLabel from "@/components/charts/primitives/chart_cursor_label";
import PredictionWithRange from "@/components/charts/primitives/prediction_with_range";
import ResolutionDiamond from "@/components/charts/primitives/resolution_diamond";
import XTickLabel from "@/components/charts/primitives/x_tick_label";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useChartTooltip from "@/hooks/use_chart_tooltip";
import useContainerSize from "@/hooks/use_container_size";
import usePrevious from "@/hooks/use_previous";
import {
  Area,
  Line,
  LinePoint,
  Scale,
  TimelineChartZoomOption,
} from "@/types/charts";
import { QuestionStatus } from "@/types/post";
import { ForecastAvailability, QuestionType } from "@/types/question";
import { ThemeColor } from "@/types/theme";
import {
  getAxisLeftPadding,
  getAxisRightPadding,
  getTickLabelFontSize,
} from "@/utils/charts/axis";
import { findLastIndexBefore } from "@/utils/charts/helpers";
import cn from "@/utils/core/cn";
import { resolveToCssColor } from "@/utils/resolve_color";

import ForecastAvailabilityChartOverflow from "../post_card/chart_overflow";
import ChartValueBox from "./primitives/chart_value_box";
import ResolutionTooltip from "./primitives/resolution_tooltip";

type ChartData = {
  line: Line;
  area: Area;
  points: Line;
  yDomain: DomainTuple;
  xDomain: DomainTuple;
  yScale: Scale;
  xScale: Scale;
};

type Props = {
  buildChartData: (width: number, zoom: TimelineChartZoomOption) => ChartData;
  chartTitle?: string;
  height?: number;
  hideCP?: boolean;
  defaultZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  resolutionPoint?: LinePoint[];
  yLabel?: string;
  tickFontSize?: number;
  extraTheme?: VictoryThemeDefinition;
  onChartReady?: () => void;
  cursorTimestamp?: number | null;
  onCursorChange?: (value: number | null) => void;
  getCursorValue?: (value: number) => string;
  colorOverride?: ThemeColor | string;
  nonInteractive?: boolean;
  isEmbedded?: boolean;
  simplifiedCursor?: boolean;
  leftLegend?: React.ReactNode;
  forecastAvailability?: ForecastAvailability;
  questionStatus?: QuestionStatus;
  resolution?: string | null;
  cursorTooltip?: ReactNode;
  isConsumerView?: boolean;
  questionType?: QuestionType;
};

const BOTTOM_PADDING = 20;
const LABEL_FONT_FAMILY = "Inter";

const NumericChart: FC<Props> = ({
  buildChartData,
  chartTitle,
  height = 170,
  hideCP,
  defaultZoom = TimelineChartZoomOption.All,
  withZoomPicker = false,
  resolutionPoint,
  yLabel,
  tickFontSize = 10,
  extraTheme,
  onChartReady,
  cursorTimestamp,
  onCursorChange,
  getCursorValue,
  colorOverride,
  leftLegend,
  nonInteractive = false,
  isEmbedded = false,
  simplifiedCursor = false,
  forecastAvailability,
  questionStatus,
  resolution,
  cursorTooltip,
  isConsumerView,
  questionType,
}) => {
  const { theme, getThemeColor } = useAppTheme();
  const [isChartReady, setIsChartReady] = useState(false);
  const [zoom, setZoom] = useState(defaultZoom);

  const [isCursorActive, setIsCursorActive] = useState(false);
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();
  const { line, area, points, yDomain, xDomain, yScale, xScale } = useMemo(
    () => buildChartData(chartWidth, zoom),
    [chartWidth, zoom, buildChartData]
  );
  const shouldAdjustCursorLabel = line.at(-1)?.x !== xDomain.at(-1);
  const defaultCursor = useMemo(
    () => line.at(-1)?.x ?? Date.now() / 1000,
    [line]
  );
  const cursorValue = useMemo(() => {
    if (isNil(cursorTimestamp)) return defaultCursor;
    return cursorTimestamp;
  }, [cursorTimestamp, defaultCursor]);
  const handleCursorChange = useCallback(
    (value: number | null) => {
      if (nonInteractive) return;
      onCursorChange?.(value);
    },
    [onCursorChange, nonInteractive]
  );
  const chartTheme = useMemo(
    () => (theme === "dark" ? darkTheme : lightTheme),
    [theme]
  );
  const actualTheme = useMemo(
    () => (extraTheme ? merge({}, chartTheme, extraTheme) : chartTheme),
    [chartTheme, extraTheme]
  );
  const tickLabelFontSize =
    isNil(tickFontSize) || !isNil(extraTheme)
      ? getTickLabelFontSize(actualTheme)
      : tickFontSize;
  const hasExternalTheme = !!extraTheme;

  const highlightedLine = useMemo(() => {
    const lastIndex = findLastIndexBefore(line, cursorValue);
    if (lastIndex === -1) return [];

    const result = line.slice(0, lastIndex + 1);
    const lastPoint = result[result.length - 1];
    if (!lastPoint) return result;

    if (lastPoint.x < cursorValue && lastIndex + 1 < line.length) {
      result.push({
        x: cursorValue,
        y: lastPoint.y,
      });
    }

    return result;
  }, [line, cursorValue]);

  const highlightedPoint = useMemo(
    () => highlightedLine.at(-1),
    [highlightedLine]
  );
  const handleChartReady = useCallback(() => {
    setIsChartReady(true);
    onChartReady?.();
  }, [onChartReady]);

  const prevWidth = usePrevious(chartWidth);
  useEffect(() => {
    if (!prevWidth && chartWidth && handleChartReady) {
      handleChartReady();
    }
  }, [prevWidth, chartWidth, handleChartReady]);

  const { rightPadding, MIN_RIGHT_PADDING } = useMemo(() => {
    return getAxisRightPadding(yScale, tickLabelFontSize as number, yLabel);
  }, [yScale, tickLabelFontSize, yLabel]);

  const { leftPadding, MIN_LEFT_PADDING } = useMemo(() => {
    return getAxisLeftPadding(yScale, tickLabelFontSize as number, yLabel);
  }, [yScale, tickLabelFontSize, yLabel]);

  const maxRightPadding = useMemo(() => {
    return Math.max(rightPadding, MIN_RIGHT_PADDING);
  }, [rightPadding, MIN_RIGHT_PADDING]);

  const containerComponent = useMemo(() => {
    if (nonInteractive) {
      return (
        <VictoryContainer
          style={{
            pointerEvents: "auto",
            userSelect: "auto",
            touchAction: "auto",
          }}
        />
      );
    }

    return (
      <VictoryCursorContainer
        cursorDimension={"x"}
        defaultCursor={defaultCursor}
        style={{
          touchAction: "pan-y",
        }}
        cursorLabelOffset={{
          x: 0,
          y: 0,
        }}
        cursorLabel={({ datum }: VictoryLabelProps) => {
          if (datum) {
            return datum.x === defaultCursor
              ? ""
              : xScale.cursorFormat?.(datum.x) ?? xScale.tickFormat(datum.x);
          }
        }}
        cursorComponent={
          <LineSegment
            style={{
              stroke: getThemeColor(METAC_COLORS.blue["700"]),
              opacity: 0.5,
              strokeDasharray: "5,2",
            }}
          />
        }
        cursorLabelComponent={
          <VictoryPortal>
            <ChartCursorLabel
              positionY={height - 10}
              {...(hasExternalTheme
                ? {}
                : { fill: getThemeColor(METAC_COLORS.gray["700"]) })}
              style={{
                fontFamily: LABEL_FONT_FAMILY,
              }}
              isActive={isCursorActive}
            />
          </VictoryPortal>
        }
        onCursorChange={(value: CursorCoordinatesPropType) => {
          if (typeof value === "number") {
            handleCursorChange(value);
          } else {
            handleCursorChange(null);
          }
        }}
      />
    );
  }, [
    defaultCursor,
    xScale,
    height,
    hasExternalTheme,
    getThemeColor,
    handleCursorChange,
    nonInteractive,
    isCursorActive,
  ]);

  const chartEvents = useMemo(() => {
    if (nonInteractive) return [];

    return [
      {
        target: "parent",
        eventHandlers: {
          onTouchStart: () => {
            setIsCursorActive(true);
          },
          onMouseEnter: () => {
            setIsCursorActive(true);
          },
          onMouseLeave: () => {
            setIsCursorActive(false);
            handleCursorChange(null);
          },
        },
      },
    ];
  }, [nonInteractive, handleCursorChange]);

  const shouldDisplayChart = useMemo(
    () => !!chartWidth && !!xScale.ticks.length && yScale.ticks.length,
    [chartWidth, xScale.ticks.length, yScale.ticks.length]
  );

  const yScaleTicks = useMemo(() => {
    if (yScale.ticks.length >= 5 && chartWidth < 300) {
      return [
        yScale.ticks.at(0),
        yScale.ticks.at(Math.round(yScale.ticks.length / 2)),
        yScale.ticks.at(-1),
      ];
    }
    return yScale.ticks;
  }, [yScale, chartWidth]);

  const [yMin, yMax] = useMemo(() => {
    const [a, b] = yDomain as [number, number];
    return a <= b ? [a, b] : [b, a];
  }, [yDomain]);

  const resolutionPlacement = useMemo<"in" | "below" | "above" | null>(() => {
    const p = resolutionPoint?.[0];
    if (!p || p.x == null || p.y == null || !Number.isFinite(p.y)) return null;
    if (p.y < yMin) return "below";
    if (p.y > yMax) return "above";
    return "in";
  }, [resolutionPoint, yMin, yMax]);

  const resolutionClamped = useMemo(() => {
    const p = resolutionPoint?.[0];
    if (!p || p.x == null || p.y == null || !Number.isFinite(p.y)) return null;
    return { x: p.x, y: Math.max(yMin, Math.min(yMax, p.y)) };
  }, [resolutionPoint, yMin, yMax]);

  const colorPalette = useMemo(() => {
    switch (questionStatus) {
      case QuestionStatus.RESOLVED:
        return {
          lineStroke: METAC_COLORS.purple["700"],
          cpRange: METAC_COLORS.purple["500"],
          chip: METAC_COLORS.purple["800"],
        };
      case QuestionStatus.CLOSED:
        return {
          lineStroke: METAC_COLORS.gray["700"],
          cpRange: METAC_COLORS.gray["500"],
          chip: METAC_COLORS.gray["700"],
        };
      default:
        return {
          lineStroke: METAC_COLORS.olive["700"],
          cpRange: METAC_COLORS.olive["500"],
          chip: METAC_COLORS.olive["700"],
        };
    }
  }, [questionStatus]);
  // Add short padding at the beginning of X domain
  const adjustedXDomain = useMemo(() => {
    if (!isEmbedded && xDomain.length === 2) {
      const domainRange = Number(xDomain[1]) - Number(xDomain[0]);
      return [
        Number(xDomain[0]) - domainRange * 0.02,
        Number(xDomain[1]),
      ] as DomainTuple;
    }
    return xDomain;
  }, [xDomain, isEmbedded]);

  const { getReferenceProps, getFloatingProps, refs, floatingStyles } =
    useChartTooltip({ placement: "top", tooltipOffset: 15 });
  const {
    isActive: isDiamondActive,
    getReferenceProps: getDiamondRefProps,
    getFloatingProps: getDiamondFloatingProps,
    refs: diamondRefs,
    floatingStyles: diamondFloatingStyles,
  } = useChartTooltip({
    placement: resolutionPlacement === "below" ? "top" : "bottom",
    tooltipOffset: 8,
  });

  const clampedPoints = useMemo(() => {
    return points.map((p) => ({
      ...p,
      y: p.y == null ? p.y : Math.max(yMin, Math.min(yMax, p.y)),
      y1: p.y1 == null ? p.y1 : Math.max(yMin, Math.min(yMax, p.y1)),
      y2: p.y2 == null ? p.y2 : Math.max(yMin, Math.min(yMax, p.y2)),
    }));
  }, [points, yMin, yMax]);

  const themeLineData = (
    actualTheme?.line as
      | { style?: { data?: Record<string, unknown> } }
      | undefined
  )?.style?.data as Record<string, unknown> | undefined;

  const themeAreaData = (
    actualTheme?.area as
      | { style?: { data?: Record<string, unknown> } }
      | undefined
  )?.style?.data as Record<string, unknown> | undefined;

  const asCssColor = (v: unknown): string | undefined =>
    typeof v === "string" && v.trim().length ? v : undefined;

  const cpLineStroke = useMemo(() => {
    const overrideCss = resolveToCssColor(getThemeColor, colorOverride);
    if (overrideCss) return overrideCss;

    if (hasExternalTheme) {
      const fromTheme = asCssColor(themeLineData?.stroke);
      if (fromTheme) return fromTheme;
    }
    return getThemeColor(colorPalette.lineStroke);
  }, [
    colorOverride,
    hasExternalTheme,
    themeLineData?.stroke,
    getThemeColor,
    colorPalette.lineStroke,
  ]);

  const cpRangeFill = useMemo(() => {
    const overrideCss = resolveToCssColor(getThemeColor, colorOverride);
    if (overrideCss) return overrideCss;

    if (hasExternalTheme) {
      const fromTheme = asCssColor(themeAreaData?.fill);
      if (fromTheme) return fromTheme;
    }
    return getThemeColor(colorPalette.cpRange);
  }, [
    colorOverride,
    hasExternalTheme,
    themeAreaData?.fill,
    getThemeColor,
    colorPalette.cpRange,
  ]);

  const cpRangeOpacity = useMemo(() => {
    if (!hasExternalTheme) return 0.3;
    const fromTheme = themeAreaData?.opacity;
    return typeof fromTheme === "number" ? fromTheme : 0.3;
  }, [hasExternalTheme, themeAreaData?.opacity]);

  const showRightYAxis = isEmbedded;

  const chartPadding = {
    top: 10,
    bottom: isEmbedded ? BOTTOM_PADDING + 15 : BOTTOM_PADDING,

    left: showRightYAxis ? 10 : Math.max(leftPadding, MIN_LEFT_PADDING),
    right: showRightYAxis
      ? Math.max(rightPadding, MIN_RIGHT_PADDING)
      : Math.max(rightPadding, MIN_RIGHT_PADDING),
  };

  return (
    <>
      <div
        className={cn(
          "flex w-full flex-col",
          isChartReady ? "opacity-100" : "opacity-0"
        )}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        <ForecastAvailabilityChartOverflow
          forecastAvailability={forecastAvailability}
          className="text-xs text-gray-700 dark:text-gray-700-dark"
          textClassName="pl-0"
          style={{
            paddingRight: isEmbedded ? maxRightPadding : maxRightPadding,
            paddingLeft: isEmbedded ? 0 : 0,
            paddingTop: withZoomPicker ? 24 : 0,
          }}
        />

        <ChartContainer
          ref={chartContainerRef}
          height={height}
          zoom={withZoomPicker ? zoom : undefined}
          onZoomChange={setZoom}
          chartTitle={chartTitle}
          leftLegend={leftLegend}
        >
          {shouldDisplayChart ? (
            <VictoryChart
              domain={{ y: yDomain, x: adjustedXDomain }}
              width={chartWidth}
              height={height}
              theme={actualTheme}
              padding={chartPadding}
              events={chartEvents}
              containerComponent={containerComponent}
            >
              {/* Y axis used for GRIDLINES */}
              <VictoryAxis
                dependentAxis
                orientation="left"
                style={{
                  ticks: { stroke: "transparent" },
                  tickLabels: { fill: "transparent" }, // hide labels
                  axis: { stroke: "transparent" },
                  grid: {
                    stroke: getThemeColor(METAC_COLORS.gray["400"]),
                    strokeWidth: 1,
                    strokeDasharray: "3, 2",
                  },
                }}
                tickValues={yScaleTicks}
                tickFormat={yScale.tickFormat}
              />

              {/* Y axis used for LABELS */}
              <VictoryAxis
                dependentAxis
                orientation={showRightYAxis ? "right" : "left"}
                style={{
                  ticks: { stroke: "transparent" },
                  axis: { stroke: "transparent" },
                  grid: { stroke: "transparent" },
                  axisLabel: {
                    fontFamily: LABEL_FONT_FAMILY,
                    fontSize: tickLabelFontSize,
                    ...(hasExternalTheme
                      ? {}
                      : { fill: getThemeColor(METAC_COLORS.gray["500"]) }),
                  },
                  tickLabels: {
                    fontFamily: LABEL_FONT_FAMILY,
                    padding: 5,
                    fontSize: tickLabelFontSize,
                    ...(hasExternalTheme
                      ? {}
                      : { fill: getThemeColor(METAC_COLORS.gray["700"]) }),
                  },
                }}
                tickValues={yScaleTicks}
                tickFormat={yScale.tickFormat}
                label={!isNil(yLabel) ? `(${yLabel})` : undefined}
              />

              {/* X axis */}
              <VictoryAxis
                style={{
                  ticks: { stroke: "transparent" },
                  axis: { stroke: "transparent" },
                }}
                offsetY={isEmbedded ? BOTTOM_PADDING - 5 : BOTTOM_PADDING}
                tickValues={xScale.ticks}
                tickFormat={
                  hideCP
                    ? () => ""
                    : isCursorActive
                      ? () => ""
                      : xScale.tickFormat
                }
                tickLabelComponent={
                  <VictoryPortal>
                    <XTickLabel
                      chartWidth={chartWidth}
                      withCursor
                      fontSize={tickLabelFontSize}
                      {...(!extraTheme && {
                        style: {
                          fontFamily: LABEL_FONT_FAMILY,
                          fill: getThemeColor(METAC_COLORS.gray["700"]),
                        },
                      })}
                    />
                  </VictoryPortal>
                }
              />

              {/* CP range */}
              {!hideCP ? (
                <VictoryArea
                  data={area}
                  style={{
                    data: {
                      opacity: cpRangeOpacity,
                      fill: cpRangeFill,
                    },
                  }}
                  interpolation="stepAfter"
                />
              ) : null}

              {/* CP Line background */}
              {!hideCP ? (
                <VictoryLine
                  data={line}
                  style={{
                    data: {
                      strokeWidth: 2.5,
                      stroke: cpLineStroke,
                      opacity: 0.2,
                    },
                  }}
                  interpolation="stepAfter"
                />
              ) : null}

              {/* CP Line (highlighted to cursor) */}
              {!hideCP ? (
                <VictoryLine
                  data={highlightedLine}
                  style={{
                    data: {
                      strokeWidth: simplifiedCursor ? 2.5 : 1.5,
                      stroke: cpLineStroke,
                    },
                  }}
                  interpolation="stepAfter"
                />
              ) : null}

              {/* Prediction points */}
              <VictoryPortal>
                <VictoryScatter
                  data={clampedPoints}
                  dataComponent={
                    <PredictionWithRange
                      colorOverride={colorOverride ?? colorPalette.chip}
                    />
                  }
                />
              </VictoryPortal>

              {/* Resolution marker */}
              {!!resolutionPoint &&
              !isCursorActive &&
              resolutionPlacement === "in" ? (
                <VictoryPortal>
                  <VictoryScatter
                    data={resolutionPoint}
                    size={() => 4}
                    style={{
                      data: {
                        stroke: getThemeColor(METAC_COLORS.purple["800"]),
                        fill: getThemeColor(METAC_COLORS.gray["0"]),
                        strokeWidth: 2.5,
                      },
                    }}
                  />
                </VictoryPortal>
              ) : null}

              {/* Cursor value chip / box */}
              {resolutionClamped &&
              resolutionPlacement &&
              resolutionPlacement !== "in" ? (
                <VictoryPortal>
                  <VictoryScatter
                    data={[
                      {
                        x: resolutionClamped.x,
                        y: resolutionClamped.y,
                        placement: resolutionPlacement,
                        primary: colorOverride ?? METAC_COLORS.purple["800"],
                        secondary: METAC_COLORS.purple["500"],
                      },
                    ]}
                    dataComponent={
                      <ResolutionDiamond
                        isHovered={isDiamondActive}
                        refProps={{
                          ...getDiamondRefProps(),
                          ref: diamondRefs.setReference,
                          style: { pointerEvents: "visiblePainted" },
                        }}
                      />
                    }
                  />
                </VictoryPortal>
              ) : null}

              {!isDiamondActive && !isNil(highlightedPoint) && !hideCP ? (
                <VictoryScatter
                  data={[highlightedPoint]}
                  dataComponent={
                    <VictoryPortal>
                      {simplifiedCursor ? (
                        <CursorChip
                          shouldRender={
                            isConsumerView
                              ? false
                              : (isCursorActive && !isNil(resolution)) ||
                                isNil(resolution)
                          }
                          colorOverride={colorOverride ?? colorPalette.chip}
                          isEmbedded={isEmbedded}
                        />
                      ) : (
                        <ChartValueBox
                          isCursorActive={
                            shouldAdjustCursorLabel || isCursorActive
                          }
                          chartWidth={chartWidth}
                          rightPadding={maxRightPadding}
                          getCursorValue={getCursorValue}
                          resolution={resolution}
                          questionType={questionType}
                          colorOverride={colorOverride ?? colorPalette.chip}
                        />
                      )}
                    </VictoryPortal>
                  }
                />
              ) : null}
            </VictoryChart>
          ) : null}
        </ChartContainer>
      </div>

      {/* Forecaster view tooltip */}
      {isCursorActive && !!cursorTooltip ? (
        <FloatingPortal>
          <div
            className="pointer-events-none z-100 rounded bg-gray-0 leading-4 shadow-lg dark:bg-gray-0-dark"
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            {cursorTooltip}
          </div>
        </FloatingPortal>
      ) : null}

      <ResolutionTooltip
        active={isDiamondActive}
        placement={resolutionPlacement}
        resolution={resolution}
        setFloating={diamondRefs.setFloating}
        floatingStyles={diamondFloatingStyles}
        getFloatingProps={getDiamondFloatingProps}
      />
    </>
  );
};

const CursorChip: FC<{
  x?: number;
  y?: number;
  colorOverride?: ThemeColor | string;
  shouldRender?: boolean;
  isEmbedded?: boolean;
}> = ({ x, y, colorOverride, shouldRender, isEmbedded }) => {
  const { getThemeColor } = useAppTheme();
  if (isNil(x) || isNil(y) || !shouldRender) return null;

  const fill =
    resolveToCssColor(getThemeColor, colorOverride) ??
    getThemeColor(METAC_COLORS.olive["700"]);

  return <circle cx={x} cy={y} r={isEmbedded ? 5 : 4} fill={fill} />;
};

export default memo(NumericChart);
