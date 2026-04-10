"use client";

import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, useCallback, useMemo, useState, type MouseEvent } from "react";
import {
  LineSegment,
  VictoryAxis,
  VictoryChart,
  VictoryContainer,
  VictoryLine,
  VictoryScatter,
} from "victory";

import Tooltip from "@/components/ui/tooltip";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import { usePrintOverride } from "@/contexts/theme_override_context";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import cn from "@/utils/core/cn";

import {
  CHART_PADDING,
  closestTickValue,
  computeMultiLineChartModel,
} from "./chart-core/multi-line-chart-model";
import {
  type DataLabelMode,
  type DataLabelPlacement,
  type LineSeries,
  type MultiLineChartColor,
  type MultiLineChartPoint,
  type MultiLineChartSeries,
  type MultiLineChartYAxisLabel,
} from "./multi-line-chart.types";

type Props = {
  series: MultiLineChartSeries[];
  height?: number;
  yAxisLabels?: MultiLineChartYAxisLabel[];
  showTickLabels?: boolean;
  showLegend?: boolean;
  legendOrder?: string[];
  yAxisGutter?: number;
  formatYTick?: (value: number) => string;
  formatYValue?: (value: number) => string;
  xTickValues?: number[];
  visibleXTickValues?: number[];
  formatXTick?: (value: number) => string;
  highlightedX?: number | null;
  defaultHighlightedX?: number | null;
  onHighlightedXChange?: (value: number | null) => void;
  clearHighlightOnMouseLeave?: boolean;
  emphasizedSeriesId?: string | null;
};

type ResolvedSeriesColors = {
  stroke: string;
  fill: string;
};

type VictoryDatum = MultiLineChartPoint & {
  x: number;
  y: number;
};

type ResolvedSeriesEntry = {
  series: MultiLineChartSeries;
  chartData: VictoryDatum[];
  colors: ResolvedSeriesColors;
  pointRadius: number;
  opacity: number;
  strokeWidth: number;
};

/** Default Y-axis tick labels: whole-number %, explicit + for positives. */
export const defaultFormatYTick = (value: number): string => {
  if (value === 0) return "0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(0)}%`;
};

const DATA_LABEL_ON_DARK_FILL = METAC_COLORS.gray["0"].DEFAULT;
const DATA_LABEL_ON_LIGHT_FILL = METAC_COLORS.gray["900"].DEFAULT;

const MC_OPTION_COLOR_MAP = {
  mc1: METAC_COLORS["mc-option"]["1"],
  mc2: METAC_COLORS["mc-option"]["2"],
  mc3: METAC_COLORS["mc-option"]["3"],
  mc4: METAC_COLORS["mc-option"]["4"],
  mc5: METAC_COLORS["mc-option"]["5"],
  mc6: METAC_COLORS["mc-option"]["6"],
  mc7: METAC_COLORS["mc-option"]["7"],
  mc8: METAC_COLORS["mc-option"]["8"],
  mc9: METAC_COLORS["mc-option"]["9"],
  mc10: METAC_COLORS["mc-option"]["10"],
  mc11: METAC_COLORS["mc-option"]["11"],
  mc12: METAC_COLORS["mc-option"]["12"],
  mc13: METAC_COLORS["mc-option"]["13"],
  mc14: METAC_COLORS["mc-option"]["14"],
  mc15: METAC_COLORS["mc-option"]["15"],
  mc16: METAC_COLORS["mc-option"]["16"],
  mc17: METAC_COLORS["mc-option"]["17"],
  mc18: METAC_COLORS["mc-option"]["18"],
} as const;

const getContrastTextColor = (backgroundColor: string): string => {
  const normalizedColor = backgroundColor.replace("#", "");
  const hex =
    normalizedColor.length === 3
      ? normalizedColor
          .split("")
          .map((value) => `${value}${value}`)
          .join("")
      : normalizedColor;

  if (hex.length !== 6) {
    return DATA_LABEL_ON_DARK_FILL;
  }

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  if ([red, green, blue].some(Number.isNaN)) {
    return DATA_LABEL_ON_DARK_FILL;
  }

  const yiq = (red * 299 + green * 587 + blue * 114) / 1000;
  return yiq >= 160 ? DATA_LABEL_ON_LIGHT_FILL : DATA_LABEL_ON_DARK_FILL;
};

/** Default for point badges: one decimal and %. */
export const defaultFormatYValue = (value: number): string => {
  if (value === 0) return "0.0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

const getSeriesColors = (
  colorType: MultiLineChartColor,
  getThemeColor: (color: { DEFAULT: string; dark: string }) => string
) => {
  if (colorType in MC_OPTION_COLOR_MAP) {
    const fill = getThemeColor(
      MC_OPTION_COLOR_MAP[colorType as keyof typeof MC_OPTION_COLOR_MAP]
    );
    return {
      stroke: fill,
      fill,
    };
  }

  switch (colorType) {
    case "green": {
      const fill = getThemeColor(METAC_COLORS["mc-option"]["3"]);
      return {
        stroke: fill,
        fill,
      };
    }
    case "red": {
      const fill = getThemeColor(METAC_COLORS["mc-option"]["2"]);
      return {
        stroke: fill,
        fill,
      };
    }
    case "blue": {
      const fill = getThemeColor(METAC_COLORS.blue["800"]);
      return {
        stroke: fill,
        fill,
      };
    }
    case "gray":
    default: {
      const fill = getThemeColor(METAC_COLORS.gray["500"]);
      return {
        stroke: fill,
        fill,
      };
    }
  }
};

const Legend: FC<{
  series: MultiLineChartSeries[];
  order?: string[];
  getThemeColor: (color: { DEFAULT: string; dark: string }) => string;
}> = ({ series, order, getThemeColor }) => {
  const legendItems = useMemo(() => {
    const withLabels = series.filter((item) => item.label);
    if (!order) return withLabels;

    return [...withLabels].sort((a, b) => {
      const aIndex = order.indexOf(a.id);
      const bIndex = order.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [series, order]);

  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      {legendItems.map((item) => {
        const colors = getSeriesColors(item.color, getThemeColor);
        return (
          <div key={item.id} className="flex items-center gap-1.5">
            <svg
              width={16}
              height={16}
              className={cn(
                "shrink-0",
                item.legendStyle !== "line" &&
                  !item.filled &&
                  "text-gray-0 dark:text-gray-0-dark"
              )}
            >
              {item.legendStyle === "line" ? (
                <line
                  x1={0}
                  y1={8}
                  x2={16}
                  y2={8}
                  stroke={colors.stroke}
                  strokeWidth={2}
                  strokeDasharray={item.dashed ? "4, 3" : undefined}
                />
              ) : (
                <circle
                  cx={8}
                  cy={8}
                  r={6}
                  fill={item.filled ? colors.fill : "currentColor"}
                  stroke={colors.stroke}
                  strokeWidth={2}
                />
              )}
            </svg>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-700-dark">
              {item.label}
            </span>
            {item.legendDetail && (
              <Tooltip
                showDelayMs={150}
                placement="top"
                tooltipContent={item.legendDetail}
                tooltipClassName="max-w-64 border-blue-400 bg-gray-0 text-left text-gray-800 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-gray-800-dark"
                className="text-[11px] leading-none text-gray-500 dark:text-gray-500-dark"
              >
                <span
                  aria-label={`More information about ${item.label}`}
                  className="inline-flex size-3.5 items-center justify-center rounded-full"
                >
                  <FontAwesomeIcon
                    icon={faCircleQuestion}
                    className="size-3.5"
                  />
                </span>
              </Tooltip>
            )}
          </div>
        );
      })}
    </div>
  );
};

const wrapText = (text: string, maxCharsPerLine: number): string[] => {
  if (text.length <= maxCharsPerLine) return [text];

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
};

const CustomYAxisTickLabel: FC<{
  x?: number;
  y?: number;
  text?: string;
  textColor?: string;
  offsetX?: number;
  offsetY?: number;
  maxCharsPerLine?: number;
  lineHeight?: number;
}> = ({
  x,
  y,
  text,
  textColor,
  offsetX = 0,
  offsetY = 0,
  maxCharsPerLine = 12,
  lineHeight = 14,
}) => {
  if (x === undefined || y === undefined || !text) return null;

  const lines = wrapText(text, maxCharsPerLine);
  const totalHeight = (lines.length - 1) * lineHeight;
  const startY = y + offsetY - totalHeight;

  return (
    <text
      x={x + offsetX}
      textAnchor="end"
      fill={textColor}
      fontSize={12}
      fontWeight={400}
      fontFamily="var(--font-inter-variable), var(--font-inter), sans-serif"
    >
      {lines.map((line, index) => (
        <tspan
          key={index}
          x={x + offsetX}
          y={startY + index * lineHeight}
          dominantBaseline="middle"
        >
          {line}
        </tspan>
      ))}
    </text>
  );
};

const DataPointCircle: FC<{
  x?: number;
  y?: number;
  datum?: MultiLineChartPoint;
  strokeColor?: string;
  fillColor?: string;
  isFilled?: boolean;
  bgColor?: string;
  radius?: number;
  opacity?: number;
  highlightedX?: number | null;
  hoverRadiusDelta?: number;
}> = ({
  x,
  y,
  datum,
  strokeColor,
  fillColor,
  isFilled,
  bgColor,
  radius = 6,
  opacity = 1,
  highlightedX,
  hoverRadiusDelta = 0,
}) => {
  if (x === undefined || y === undefined) return null;

  const resolvedBaseRadius = datum?.dotSize ?? radius;
  const resolvedRadius =
    highlightedX != null && datum?.x === highlightedX
      ? resolvedBaseRadius + hoverRadiusDelta
      : resolvedBaseRadius;
  const resolvedIsFilled = datum?.filled ?? isFilled;

  return (
    <circle
      cx={x}
      cy={y}
      r={resolvedRadius}
      fill={resolvedIsFilled ? fillColor : bgColor}
      stroke={strokeColor}
      strokeWidth={2}
      opacity={opacity}
    />
  );
};

const DATA_LABEL_BADGE_HEIGHT = 18;
const DATA_LABEL_FONT_SIZE = 12;
const DATA_LABEL_GAP = 4;

const ChangeBadge: FC<{
  x?: number;
  y?: number;
  datum?: MultiLineChartPoint;
  formatValue: (value: number) => string;
  alwaysVisible?: boolean;
  highlightedX?: number | null;
  placement?: DataLabelPlacement;
  pointRadius?: number;
  lineColor: string;
  labelColor?: string;
  transparent?: boolean;
  groupClassName?: string;
  rectClassName?: string;
  textClassName?: string;
}> = ({
  x,
  y,
  datum,
  formatValue,
  alwaysVisible = false,
  highlightedX,
  placement = "inline",
  pointRadius = 8,
  lineColor,
  labelColor = DATA_LABEL_ON_DARK_FILL,
  transparent = false,
  groupClassName,
  rectClassName,
  textClassName,
}) => {
  if (x === undefined || y === undefined || !datum) return null;
  if (!alwaysVisible && (highlightedX == null || datum.x !== highlightedX))
    return null;
  if (datum.y === 0) return null;

  const bgColor = transparent ? "transparent" : lineColor;
  const labelTextColor = transparent ? lineColor : labelColor;
  const text = formatValue(datum.y);
  const badgeWidth = text.length * 7 + 6;

  let badgeTop: number;
  switch (placement) {
    case "above":
      badgeTop = y - pointRadius - DATA_LABEL_GAP - DATA_LABEL_BADGE_HEIGHT;
      break;
    case "inline":
      badgeTop = y - DATA_LABEL_BADGE_HEIGHT / 2;
      break;
    case "below":
    default:
      badgeTop = y + pointRadius + DATA_LABEL_GAP;
      break;
  }

  return (
    <g className={cn("pointer-events-none", groupClassName)}>
      <rect
        className={rectClassName}
        x={x - badgeWidth / 2}
        y={badgeTop}
        width={badgeWidth}
        height={DATA_LABEL_BADGE_HEIGHT}
        rx={3}
        ry={3}
        fill={bgColor}
      />
      <text
        className={textClassName}
        x={x}
        y={badgeTop + DATA_LABEL_BADGE_HEIGHT / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={labelTextColor}
        fontSize={DATA_LABEL_FONT_SIZE}
        fontWeight={450}
        fontFamily="var(--font-inter-variable), var(--font-inter), sans-serif"
      >
        {text}
      </text>
    </g>
  );
};

const getAlwaysVisibleLabelMode = (
  mode: DataLabelMode | undefined,
  isPrintMode: boolean
) => mode === "always" || (isPrintMode && mode !== "never");

const getHoverLabelMode = (mode: DataLabelMode | undefined) =>
  mode !== "always" && mode !== "never";

export const MultiLineChart: FC<Props> = ({
  series,
  height = 250,
  yAxisLabels,
  showTickLabels = false,
  showLegend = true,
  legendOrder,
  yAxisGutter,
  formatYTick,
  formatYValue: formatYValueProp,
  xTickValues,
  visibleXTickValues,
  formatXTick,
  highlightedX: highlightedXProp,
  defaultHighlightedX = null,
  onHighlightedXChange,
  clearHighlightOnMouseLeave = true,
  emphasizedSeriesId = null,
}) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const isPrintMode = usePrintOverride();
  const [uncontrolledHighlightedX, setUncontrolledHighlightedX] = useState<
    number | null
  >(defaultHighlightedX);

  const highlightedX =
    highlightedXProp === undefined
      ? uncontrolledHighlightedX
      : highlightedXProp;

  const setHighlightedX = useCallback(
    (value: number | null) => {
      if (highlightedXProp === undefined) {
        setUncontrolledHighlightedX(value);
      }
      onHighlightedXChange?.(value);
    },
    [highlightedXProp, onHighlightedXChange]
  );

  const formatResolvedYValue = formatYValueProp ?? defaultFormatYValue;
  const formatResolvedYTick =
    formatYTick ?? formatYValueProp ?? defaultFormatYTick;

  const {
    xDomain,
    yDomain,
    xTickValues: resolvedXTickValues,
    labelTickValues,
    gridYTickValues,
    leftPadding,
    labelTickFormat,
    gridAxisTickFormat,
    customYAxisTickMaxChars,
  } = useMemo(
    () =>
      computeMultiLineChartModel({
        series,
        yAxisLabels,
        showTickLabels,
        formatYTick: formatResolvedYTick,
        yAxisGutter,
        xTickValues,
      }),
    [
      series,
      yAxisLabels,
      showTickLabels,
      formatResolvedYTick,
      yAxisGutter,
      xTickValues,
    ]
  );

  const shouldDisplayChart = !!chartWidth;
  const gridColor = getThemeColor(METAC_COLORS.gray["400"]);
  const activeXTickColor = getThemeColor(METAC_COLORS.gray["700"]);
  const bgColor = getThemeColor(METAC_COLORS.gray["0"]);

  const emphasisActive = emphasizedSeriesId != null;

  const seriesEntries = useMemo<ResolvedSeriesEntry[]>(
    () =>
      series.map((item) => {
        const opacity = emphasisActive
          ? item.id === emphasizedSeriesId
            ? 1
            : 0.32
          : 1;
        const baseStrokeWidth = item.dashed ? 1.5 : 2;
        const strokeWidth =
          emphasisActive && item.id === emphasizedSeriesId
            ? Math.max(baseStrokeWidth, 5)
            : baseStrokeWidth;
        const basePointRadius = item.dotSize ?? (item.filled ? 6 : 7);
        const pointRadius =
          emphasisActive && item.id === emphasizedSeriesId
            ? basePointRadius + 2
            : basePointRadius;

        return {
          series: item,
          chartData: item.data.map((point) => ({
            ...point,
            x: point.x,
            y: point.y,
          })),
          colors: getSeriesColors(item.color, getThemeColor),
          pointRadius,
          opacity,
          strokeWidth,
        };
      }),
    [series, emphasisActive, emphasizedSeriesId, getThemeColor]
  );

  const handleChartMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!chartWidth || !resolvedXTickValues.length) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const plotLeft = leftPadding;
      const plotWidth = chartWidth - plotLeft - CHART_PADDING.right;
      if (plotWidth <= 0) return;

      if (offsetX < plotLeft || offsetX > chartWidth - CHART_PADDING.right) {
        setHighlightedX(null);
        return;
      }

      const progress = (offsetX - plotLeft) / plotWidth;
      const [xMin, xMax] = xDomain;
      const highlightedValue = xMin + progress * (xMax - xMin);
      const closest = closestTickValue(highlightedValue, resolvedXTickValues);
      if (closest != null) {
        setHighlightedX(closest);
      }
    },
    [chartWidth, leftPadding, resolvedXTickValues, setHighlightedX, xDomain]
  );

  const handleChartMouseLeave = useCallback(() => {
    if (clearHighlightOnMouseLeave) {
      setHighlightedX(null);
    }
  }, [clearHighlightOnMouseLeave, setHighlightedX]);

  const formatResolvedXTick = useCallback(
    (tick: string | number) => {
      const numericTick = typeof tick === "number" ? tick : Number(tick);
      if (visibleXTickValues?.length) {
        const baseVisibleTickSet = new Set(visibleXTickValues);
        const isBaseVisible = baseVisibleTickSet.has(numericTick);

        if (highlightedX != null && !baseVisibleTickSet.has(highlightedX)) {
          const highlightedIndex = resolvedXTickValues.indexOf(highlightedX);
          const previousTick =
            highlightedIndex > 0
              ? resolvedXTickValues[highlightedIndex - 1]
              : undefined;
          const nextTick =
            highlightedIndex >= 0
              ? resolvedXTickValues[highlightedIndex + 1]
              : undefined;

          if (numericTick === highlightedX) {
            return formatXTick ? formatXTick(numericTick) : String(tick);
          }

          if (numericTick === previousTick || numericTick === nextTick) {
            return "";
          }
        }

        if (!isBaseVisible) {
          return "";
        }
      }

      return formatXTick ? formatXTick(numericTick) : String(tick);
    },
    [formatXTick, highlightedX, resolvedXTickValues, visibleXTickValues]
  );

  return (
    <div className="w-full">
      {showLegend && (
        <Legend
          series={series}
          order={legendOrder}
          getThemeColor={getThemeColor}
        />
      )}

      <div
        ref={chartContainerRef}
        className="relative w-full cursor-crosshair"
        style={{ height }}
        onMouseMove={handleChartMouseMove}
        onMouseLeave={handleChartMouseLeave}
      >
        {shouldDisplayChart && (
          <VictoryChart
            width={chartWidth}
            height={height}
            theme={chartTheme}
            domain={{ x: xDomain, y: yDomain }}
            padding={{
              top: CHART_PADDING.top,
              bottom: CHART_PADDING.bottom,
              left: leftPadding,
              right: CHART_PADDING.right,
            }}
            containerComponent={
              <VictoryContainer
                style={{
                  pointerEvents: "auto",
                  userSelect: "auto",
                  touchAction: "auto",
                }}
              />
            }
          >
            <VictoryAxis
              tickValues={resolvedXTickValues}
              tickFormat={formatResolvedXTick}
              offsetY={35}
              style={{
                axis: { stroke: "transparent" },
                ticks: { stroke: "transparent" },
                tickLabels: {
                  fill: ({ tick }: { tick?: string | number }) =>
                    highlightedX != null && Number(tick) === highlightedX
                      ? activeXTickColor
                      : gridColor,
                  fontSize: 12,
                  fontWeight: ({ tick }: { tick?: string | number }) =>
                    highlightedX != null && Number(tick) === highlightedX
                      ? 600
                      : 400,
                  fontFamily:
                    "var(--font-inter-variable), var(--font-inter), sans-serif",
                },
              }}
            />

            <VictoryAxis
              dependentAxis
              tickValues={gridYTickValues}
              tickFormat={gridAxisTickFormat}
              style={{
                axis: { stroke: "transparent" },
                ticks: { stroke: "transparent", size: 0 },
                tickLabels: showTickLabels
                  ? {
                      fill: gridColor,
                      fontSize: 12,
                      fontWeight: 400,
                      fontFamily:
                        "var(--font-inter-variable), var(--font-inter), sans-serif",
                      padding: 4,
                    }
                  : { fill: "transparent" },
                grid: {
                  stroke: gridColor,
                  strokeDasharray: "1, 5",
                  strokeLinecap: "round",
                },
              }}
              gridComponent={<LineSegment />}
            />

            {!!yAxisLabels?.length && (
              <VictoryAxis
                dependentAxis
                tickValues={labelTickValues}
                tickFormat={labelTickFormat}
                tickLabelComponent={
                  <CustomYAxisTickLabel
                    textColor={gridColor}
                    offsetX={14}
                    offsetY={-8}
                    maxCharsPerLine={customYAxisTickMaxChars}
                    lineHeight={14}
                  />
                }
                style={{
                  axis: {
                    stroke: gridColor,
                    strokeDasharray: "1, 5",
                    strokeLinecap: "round",
                  },
                  ticks: { stroke: gridColor, size: 18 },
                  tickLabels: {},
                  grid: { stroke: "transparent" },
                }}
              />
            )}

            {highlightedX != null && (
              <VictoryLine
                data={[
                  { x: highlightedX, y: yDomain[0] },
                  { x: highlightedX, y: yDomain[1] },
                ]}
                style={{
                  data: {
                    stroke: gridColor,
                    strokeWidth: 1,
                    strokeDasharray: "4 3",
                    opacity: emphasisActive ? 0.45 : 0.75,
                  },
                }}
              />
            )}

            {seriesEntries.map(
              ({ series: item, chartData, colors, opacity, strokeWidth }) => (
                <VictoryLine
                  key={item.id}
                  data={chartData}
                  style={{
                    data: {
                      stroke: colors.stroke,
                      strokeWidth,
                      opacity,
                      ...(item.dashed && { strokeDasharray: "6, 4" }),
                    },
                  }}
                />
              )
            )}

            {seriesEntries.map(
              ({ series: item, chartData, colors, opacity, pointRadius }) => {
                const showsInlineHoverBadge =
                  !isPrintMode &&
                  getHoverLabelMode(item.dataLabels) &&
                  (item.dataLabelPlacement ?? "inline") === "inline";

                return (
                  <VictoryScatter
                    key={`scatter-${item.id}`}
                    data={chartData}
                    dataComponent={
                      <DataPointCircle
                        strokeColor={colors.stroke}
                        fillColor={colors.fill}
                        isFilled={item.filled}
                        bgColor={bgColor}
                        radius={pointRadius}
                        opacity={opacity}
                        highlightedX={highlightedX}
                        hoverRadiusDelta={showsInlineHoverBadge ? 0 : 2}
                      />
                    }
                  />
                );
              }
            )}

            {seriesEntries
              .filter(({ series: item }) =>
                getAlwaysVisibleLabelMode(item.dataLabels, isPrintMode)
              )
              .map(({ series: item, chartData, colors, pointRadius }) => (
                <VictoryScatter
                  key={`labels-always-${item.id}`}
                  data={chartData}
                  dataComponent={
                    <ChangeBadge
                      formatValue={formatResolvedYValue}
                      alwaysVisible
                      placement={item.dataLabelPlacement}
                      pointRadius={pointRadius}
                      lineColor={colors.stroke}
                      labelColor={getContrastTextColor(colors.stroke)}
                      transparent={item.dataLabelTransparent}
                      groupClassName={cn(
                        item.dataLabelClassName,
                        emphasisActive &&
                          item.id !== emphasizedSeriesId &&
                          "opacity-[0.32]"
                      )}
                      rectClassName={item.dataLabelRectClassName}
                      textClassName={item.dataLabelTextClassName}
                    />
                  }
                />
              ))}

            {!isPrintMode &&
              (highlightedX != null || emphasisActive) &&
              seriesEntries
                .filter(
                  ({ series: item }) =>
                    getHoverLabelMode(item.dataLabels) &&
                    (item.dataLabelPlacement ?? "inline") === "inline"
                )
                .map(({ series: item, chartData, colors, pointRadius }) => {
                  const isEmphasized =
                    emphasisActive && item.id === emphasizedSeriesId;
                  const showAllBadges = isEmphasized;
                  const showHighlightedBadge =
                    highlightedX != null && (!emphasisActive || !isEmphasized);

                  if (!showAllBadges && !showHighlightedBadge) return null;

                  return (
                    <VictoryScatter
                      key={`labels-hover-${item.id}`}
                      data={chartData}
                      dataComponent={
                        <ChangeBadge
                          formatValue={formatResolvedYValue}
                          alwaysVisible={showAllBadges}
                          highlightedX={showAllBadges ? null : highlightedX}
                          placement={item.dataLabelPlacement}
                          pointRadius={pointRadius}
                          lineColor={colors.stroke}
                          labelColor={getContrastTextColor(colors.stroke)}
                          transparent={item.dataLabelTransparent}
                          groupClassName={cn(
                            item.dataLabelClassName,
                            emphasisActive &&
                              item.id !== emphasizedSeriesId &&
                              "opacity-[0.32]"
                          )}
                          rectClassName={item.dataLabelRectClassName}
                          textClassName={item.dataLabelTextClassName}
                        />
                      }
                    />
                  );
                })}
          </VictoryChart>
        )}
      </div>
    </div>
  );
};

export type {
  DataLabelMode,
  DataLabelPlacement,
  LineSeries,
  MultiLineChartColor,
  MultiLineChartPoint,
  MultiLineChartSeries,
  MultiLineChartYAxisLabel,
};
export type MultiLineChartProps = Props;
export default MultiLineChart;
