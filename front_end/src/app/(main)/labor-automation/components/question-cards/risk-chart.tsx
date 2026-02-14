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

type RiskDataPoint = {
  year: number;
  change: number;
};

type Props = {
  data?: RiskDataPoint[];
  height?: number;
};

// Default static data
const DEFAULT_DATA: RiskDataPoint[] = [
  { year: 2025, change: 0 },
  { year: 2027, change: -1.5 },
  { year: 2030, change: -2.8 },
  { year: 2035, change: -7.1 },
];

// Custom hollow circle point component
const HollowCirclePoint: FC<{
  x?: number;
  y?: number;
  datum?: RiskDataPoint;
  strokeColor?: string;
  fillColor?: string;
}> = ({ x, y, strokeColor, fillColor }) => {
  if (x === undefined || y === undefined) return null;

  return (
    <circle
      cx={x}
      cy={y}
      r={8}
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth={2}
    />
  );
};

// Custom badge label component - positioned below the data point
const ChangeBadge: FC<{
  x?: number;
  y?: number;
  datum?: RiskDataPoint;
  getThemeColor: (color: { DEFAULT: string; dark: string }) => string;
}> = ({ x, y, datum, getThemeColor }) => {
  if (x === undefined || y === undefined || !datum) return null;

  // Skip if change is 0 (first point)
  if (datum.change === 0) return null;

  const isNegative = datum.change < 0;
  const bgColor = isNegative
    ? getThemeColor(METAC_COLORS.salmon["200"])
    : getThemeColor(METAC_COLORS.mint["200"]);
  const textColor = isNegative
    ? getThemeColor(METAC_COLORS.salmon["700"])
    : getThemeColor(METAC_COLORS.mint["700"]);

  const text = `${datum.change > 0 ? "+" : ""}${datum.change}%`;
  const badgeWidth = text.length * 8 + 8;
  const badgeHeight = 20;
  // Position badge below the data point
  const badgeY = y + 16;

  return (
    <g>
      <rect
        x={x - badgeWidth / 2}
        y={badgeY}
        width={badgeWidth}
        height={badgeHeight}
        rx={4}
        ry={4}
        fill={bgColor}
      />
      <text
        x={x}
        y={badgeY + badgeHeight / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textColor}
        fontSize={14}
        fontWeight={450}
        fontFamily="var(--font-inter-variable), var(--font-inter), sans-serif"
      >
        {text}
      </text>
    </g>
  );
};

export const RiskChart: FC<Props> = ({ data = DEFAULT_DATA, height = 200 }) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  const chartData = useMemo(
    () => data.map((d) => ({ x: d.year, y: d.change, ...d })),
    [data]
  );

  const xDomain = useMemo(() => {
    const years = data.map((d) => d.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const padding = (maxYear - minYear) * 0.1;
    return [minYear - padding, maxYear + padding] as [number, number];
  }, [data]);

  const { yDomain, yTickValues } = useMemo(() => {
    const changes = data.map((d) => d.change);
    const minChange = Math.min(...changes);
    const maxChange = Math.max(...changes);
    const range = maxChange - minChange || 1;
    // More padding at bottom for badges, some at top for labels
    const bottomPadding = range * 0.3;
    const topPadding = range * 0.15;
    const domain = [minChange - bottomPadding, maxChange + topPadding] as [
      number,
      number,
    ];

    // Generate integer tick values that include 0
    const minTick = Math.floor(minChange);
    const maxTick = Math.ceil(maxChange);
    const ticks: number[] = [];
    for (let i = minTick; i <= maxTick; i++) {
      if (i % 2 === 0) {
        ticks.push(i);
      }
    }

    return { yDomain: domain, yTickValues: ticks };
  }, [data]);

  const shouldDisplayChart = !!chartWidth;

  const strokeColor = getThemeColor(METAC_COLORS.gray["500"]);
  const fillColor = getThemeColor(METAC_COLORS.gray["0"]);
  const lineColor = getThemeColor(METAC_COLORS.gray["500"]);
  const gridColor = getThemeColor(METAC_COLORS.gray["400"]);

  return (
    <div ref={chartContainerRef} className="relative w-full" style={{ height }}>
      {shouldDisplayChart && (
        <VictoryChart
          width={chartWidth}
          height={height}
          theme={chartTheme}
          domain={{ x: xDomain, y: yDomain }}
          padding={{ top: 30, bottom: 20, left: 0, right: 0 }}
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
          {/* X-axis with year labels at top of chart */}
          <VictoryAxis
            orientation="top"
            offsetY={30}
            tickValues={data.map((d) => d.year)}
            tickFormat={(t) => String(t)}
            style={{
              axis: { stroke: "transparent" },
              ticks: { stroke: "transparent" },
              tickLabels: {
                fill: getThemeColor(METAC_COLORS.gray["700"]),
                fontSize: 12,
                fontWeight: 400,
                fontFamily:
                  "var(--font-inter-variable), var(--font-inter), sans-serif",
              },
            }}
          />

          {/* Y-axis with dotted grid lines, no labels */}
          <VictoryAxis
            dependentAxis
            tickValues={yTickValues}
            style={{
              axis: { stroke: "transparent" },
              ticks: { stroke: "transparent", size: 0 },
              tickLabels: { fill: "transparent", padding: 0 },
              grid: {
                stroke: gridColor,
                strokeDasharray: "1, 5",
                strokeLinecap: "round",
              },
            }}
            gridComponent={<LineSegment />}
          />

          {/* Connecting line */}
          <VictoryLine
            data={chartData}
            style={{
              data: {
                stroke: lineColor,
                strokeWidth: 2,
              },
            }}
          />

          {/* Data points with hollow circles */}
          <VictoryScatter
            data={chartData}
            dataComponent={
              <HollowCirclePoint
                strokeColor={strokeColor}
                fillColor={fillColor}
              />
            }
          />

          {/* Change badges */}
          <VictoryScatter
            data={chartData}
            dataComponent={<ChangeBadge getThemeColor={getThemeColor} />}
          />
        </VictoryChart>
      )}
    </div>
  );
};
