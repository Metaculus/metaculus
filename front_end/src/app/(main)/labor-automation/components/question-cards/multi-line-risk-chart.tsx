"use client";

import { FC, useMemo } from "react";
import {
  LineSegment,
  VictoryAxis,
  VictoryChart,
  VictoryContainer,
  VictoryLine,
  VictoryScatter,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";

type DataPoint = {
  year: number;
  value: number;
};

type LineSeries = {
  id: string;
  data: DataPoint[];
  color: "green" | "gray" | "red";
  filled?: boolean; // Whether points should be filled or hollow
  label?: string; // Legend label for this series
};

type YAxisLabel = {
  text: string;
  value: number; // The Y-axis value this label should align with
};

type Props = {
  series?: LineSeries[];
  height?: number;
  yAxisLabels?: {
    top: YAxisLabel;
    middle: YAxisLabel;
    bottom: YAxisLabel;
  };
  showLegend?: boolean;
  legendOrder?: string[]; // Optional: order series by id for legend display
};

// Default static data matching the design
const DEFAULT_SERIES: LineSeries[] = [
  {
    id: "growth",
    color: "green",
    filled: true,
    label: "Least vulnerable",
    data: [
      { year: 2025, value: 0 },
      { year: 2027, value: 2 },
      { year: 2030, value: 8 },
      { year: 2035, value: 18 },
    ],
  },
  {
    id: "decline",
    color: "red",
    filled: true,
    label: "Most vulnerable",
    data: [
      { year: 2025, value: 0 },
      { year: 2027, value: -8 },
      { year: 2030, value: -18 },
      { year: 2035, value: -45 },
    ],
  },
  {
    id: "baseline",
    color: "gray",
    filled: false,
    label: "Overall employment",
    data: [
      { year: 2025, value: 0 },
      { year: 2027, value: -1.5 },
      { year: 2030, value: -2.8 },
      { year: 2035, value: -7.1 },
    ],
  },
];

// Default legend order (by series id)
const DEFAULT_LEGEND_ORDER = ["growth", "baseline", "decline"];

const DEFAULT_Y_LABELS = {
  top: { text: "25% growth", value: 25 },
  middle: { text: "Baseline", value: 0 },
  bottom: { text: "Fully automated", value: -100 },
};

// Get color based on series color type
const getSeriesColors = (
  colorType: "green" | "gray" | "red",
  getThemeColor: (color: { DEFAULT: string; dark: string }) => string
) => {
  switch (colorType) {
    case "green":
      return {
        stroke: getThemeColor(METAC_COLORS["mc-option"]["3"]),
        fill: getThemeColor(METAC_COLORS["mc-option"]["3"]),
      };
    case "red":
      return {
        stroke: getThemeColor(METAC_COLORS["mc-option"]["2"]),
        fill: getThemeColor(METAC_COLORS["mc-option"]["2"]),
      };
    case "gray":
    default:
      return {
        stroke: getThemeColor(METAC_COLORS.gray["500"]),
        fill: getThemeColor(METAC_COLORS.gray["500"]),
      };
  }
};

// Legend component - derives legend from series data
const Legend: FC<{
  series: LineSeries[];
  order?: string[];
  getThemeColor: (color: { DEFAULT: string; dark: string }) => string;
}> = ({ series, order, getThemeColor }) => {
  const bgColor = getThemeColor(METAC_COLORS.gray["0"]);

  // Filter to only series with labels, then order if specified
  const legendItems = useMemo(() => {
    const withLabels = series.filter((s) => s.label);
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
            {/* Legend dot */}
            <span
              className="inline-block size-4 rounded-full"
              style={{
                backgroundColor: item.filled ? colors.fill : bgColor,
                border: `2px solid ${colors.stroke}`,
              }}
            />
            {/* Legend label */}
            <span className="text-xs font-medium text-gray-700 dark:text-gray-700-dark">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Utility to split text into lines based on max character width
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

// Custom Y-axis tick label component for precise positioning control
const CustomYAxisTickLabel: FC<{
  x?: number;
  y?: number;
  text?: string;
  textColor?: string;
  // Positioning offsets
  offsetX?: number;
  offsetY?: number;
  // Text wrapping
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

// Custom point component that can be filled or hollow
const DataPointCircle: FC<{
  x?: number;
  y?: number;
  datum?: DataPoint & {
    filled?: boolean;
    colorType?: "green" | "gray" | "red";
  };
  strokeColor?: string;
  fillColor?: string;
  isFilled?: boolean;
  bgColor?: string;
  radius?: number;
}> = ({ x, y, strokeColor, fillColor, isFilled, bgColor, radius = 6 }) => {
  if (x === undefined || y === undefined) return null;

  return (
    <circle
      cx={x}
      cy={y}
      r={radius}
      fill={isFilled ? fillColor : bgColor}
      stroke={strokeColor}
      strokeWidth={2}
    />
  );
};

export const MultiLineRiskChart: FC<Props> = ({
  series = DEFAULT_SERIES,
  height = 350,
  yAxisLabels = DEFAULT_Y_LABELS,
  showLegend = true,
  legendOrder = DEFAULT_LEGEND_ORDER,
}) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  // Calculate domains from all series data
  const { xDomain, yDomain } = useMemo(() => {
    const allYears = series.flatMap((s) => s.data.map((d) => d.year));
    const allValues = series.flatMap((s) => s.data.map((d) => d.value));

    const minYear = Math.min(...allYears);
    const maxYear = Math.max(...allYears);
    const xPadding = (maxYear - minYear) * 0.1;

    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const range = maxValue - minValue || 1;
    const yPadding = range * 0.15;

    return {
      xDomain: [minYear - xPadding, maxYear + xPadding] as [number, number],
      yDomain: [-100, maxValue + yPadding] as [number, number],
    };
  }, [series]);

  // Get unique years for x-axis ticks
  const xTickValues = useMemo(() => {
    const years = new Set(series.flatMap((s) => s.data.map((d) => d.year)));
    return Array.from(years).sort((a, b) => a - b);
  }, [series]);

  // Generate y-axis tick values at 25-point intervals
  const yTickValues = useMemo(() => {
    const [min, max] = yDomain;
    const ticks: number[] = [];
    // Start from nearest 25 below min, go to nearest 25 above max
    const startTick = Math.floor(min / 25) * 25;
    const endTick = Math.ceil(max / 25) * 25;
    for (let i = startTick; i <= endTick; i += 25) {
      ticks.push(i);
    }
    return ticks;
  }, [yDomain]);

  const shouldDisplayChart = !!chartWidth;

  const gridColor = getThemeColor(METAC_COLORS.gray["400"]);
  const labelColor = getThemeColor(METAC_COLORS.gray["700"]);
  const bgColor = getThemeColor(METAC_COLORS.gray["0"]);

  // Left padding for y-axis labels
  const leftPadding = 75;

  // Custom label tick values and format function
  const labelTickValues = useMemo(
    () => [
      yAxisLabels.top.value,
      yAxisLabels.middle.value,
      yAxisLabels.bottom.value,
    ],
    [yAxisLabels]
  );

  const labelTickFormat = useMemo(() => {
    const labelMap: Record<number, string> = {
      [yAxisLabels.top.value]: yAxisLabels.top.text,
      [yAxisLabels.middle.value]: yAxisLabels.middle.text,
      [yAxisLabels.bottom.value]: yAxisLabels.bottom.text,
    };
    return (t: number) => labelMap[t] || "";
  }, [yAxisLabels]);

  return (
    <div className="w-full">
      {/* Legend */}
      {showLegend && (
        <Legend
          series={series}
          order={legendOrder}
          getThemeColor={getThemeColor}
        />
      )}

      {/* Chart container */}
      <div
        ref={chartContainerRef}
        className="relative w-full"
        style={{ height }}
      >
        {shouldDisplayChart && (
          <VictoryChart
            width={chartWidth}
            height={height}
            theme={chartTheme}
            domain={{ x: xDomain, y: yDomain }}
            padding={{ top: 20, bottom: 40, left: leftPadding, right: 0 }}
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
            {/* X-axis with year labels at bottom */}
            <VictoryAxis
              tickValues={xTickValues}
              tickFormat={(t) => String(t)}
              offsetY={35}
              style={{
                axis: { stroke: "transparent" },
                ticks: { stroke: "transparent" },
                tickLabels: {
                  fill: labelColor,
                  fontSize: 12,
                  fontWeight: 400,
                  fontFamily:
                    "var(--font-inter-variable), var(--font-inter), sans-serif",
                },
              }}
            />

            {/* Y-axis with dotted grid lines only (no labels) */}
            <VictoryAxis
              dependentAxis
              tickValues={yTickValues}
              style={{
                axis: { stroke: "transparent" },
                ticks: { stroke: "transparent", size: 0 },
                tickLabels: { fill: "transparent" },
                grid: {
                  stroke: gridColor,
                  strokeDasharray: "1, 5",
                  strokeLinecap: "round",
                },
              }}
              gridComponent={<LineSegment />}
            />

            {/* Y-axis with custom text labels (no grid) */}
            <VictoryAxis
              dependentAxis
              tickValues={labelTickValues}
              tickFormat={labelTickFormat}
              tickLabelComponent={
                <CustomYAxisTickLabel
                  textColor={labelColor}
                  offsetX={14} // Distance from axis line
                  offsetY={-8} // Vertical fine-tuning
                  maxCharsPerLine={10} // Wrap text after this many chars
                  lineHeight={14} // Space between lines
                />
              }
              style={{
                axis: {
                  stroke: gridColor,
                  strokeDasharray: "1, 5",
                  strokeLinecap: "round",
                },
                ticks: { stroke: gridColor, size: 18 },
                tickLabels: {}, // Styles handled by custom component
                grid: { stroke: "transparent" },
              }}
            />

            {/* Render each line series */}
            {series.map((s) => {
              const colors = getSeriesColors(s.color, getThemeColor);
              const chartData = s.data.map((d) => ({
                x: d.year,
                y: d.value,
                ...d,
              }));

              return (
                <VictoryLine
                  key={s.id}
                  data={chartData}
                  style={{
                    data: {
                      stroke: colors.stroke,
                      strokeWidth: 2,
                    },
                  }}
                />
              );
            })}

            {/* Render scatter points for each series */}
            {series.map((s) => {
              const colors = getSeriesColors(s.color, getThemeColor);
              const chartData = s.data.map((d) => ({
                x: d.year,
                y: d.value,
                ...d,
              }));

              return (
                <VictoryScatter
                  key={`scatter-${s.id}`}
                  data={chartData}
                  dataComponent={
                    <DataPointCircle
                      strokeColor={colors.stroke}
                      fillColor={colors.fill}
                      isFilled={s.filled}
                      bgColor={bgColor}
                      radius={s.filled ? 6 : 8}
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

export default MultiLineRiskChart;
