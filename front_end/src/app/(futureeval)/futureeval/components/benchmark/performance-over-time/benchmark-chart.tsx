"use client";

import { range as d3Range } from "d3-array";
import { useCallback, useMemo, useRef } from "react";
import {
  VictoryChart,
  VictoryScatter,
  VictoryAxis,
  VictoryLine,
  VictoryLabel,
  VictoryVoronoiContainer,
} from "victory";
import type { CallbackArgs } from "victory-core";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import { useBreakpoint } from "@/hooks/tailwind";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";

import { CollisionAwareLabels } from "./collision-aware-labels";
import { MappedAggregates, MappedBots } from "./mapping";
import {
  computeSotaPoints,
  calculateLinearRegression,
  calculateCrossingX,
  generateTrendLineData,
  type TrendPoint,
} from "./sota-trend";

type Props = {
  bots: MappedBots;
  aggregates: MappedAggregates;
  legendItems: { id: string; label: string; color: string }[];
  selectedFamilies: Set<string>;
  hoveredFamily: string | null;
  hoveredPointKey: string | null;
  onHoveredPointKeyChange: (key: string | null) => void;
  showAllLabels?: boolean;
  showProjection?: boolean;
  className?: string;
};

// Chart dimensions
const CHART_HEIGHT_DESKTOP = 600;
const CHART_HEIGHT_MOBILE = 460;
const MIN_CHART_WIDTH = 300;
const PADDING_DESKTOP = { top: 30, bottom: 80, left: 50, right: 30 };
const PADDING_SMALL_SCREEN = { top: 30, bottom: 80, left: 35, right: 0 };

// Label font sizes (used for passing to CollisionAwareLabels)
const LABEL_FONT_SIZE_DESKTOP = 12;
const LABEL_FONT_SIZE_MOBILE = 10;

export function BenchmarkChart({
  bots,
  aggregates,
  legendItems,
  selectedFamilies,
  hoveredFamily,
  hoveredPointKey,
  onHoveredPointKeyChange,
  showAllLabels = false,
  showProjection = false,
  className,
}: Props) {
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  // On small screens (< sm breakpoint), use smaller padding and font sizes
  const smUp = useBreakpoint("sm");
  const isSmallScreen = !smUp;
  const PADDING = isSmallScreen ? PADDING_SMALL_SCREEN : PADDING_DESKTOP;
  const domainPadding = { x: isSmallScreen ? 10 : 25, y: 20 };
  const labelFontSize = isSmallScreen
    ? LABEL_FONT_SIZE_MOBILE
    : LABEL_FONT_SIZE_DESKTOP;

  // Get container width for responsive chart
  const { ref: containerRef, width: containerWidth } =
    useContainerSize<HTMLDivElement>();
  const chartWidth = Math.max(containerWidth, MIN_CHART_WIDTH);
  const chartHeight = isSmallScreen
    ? CHART_HEIGHT_MOBILE
    : CHART_HEIGHT_DESKTOP;

  // Color scheme matching pros-vs-bots chart
  const gridStroke = getThemeColor(METAC_COLORS.gray[500]);
  const axisLabelColor = getThemeColor(METAC_COLORS.gray[700]);
  const tickLabelColor = getThemeColor(METAC_COLORS.gray[500]);

  const colorForFamily = useCallback(
    (family: string) => {
      const item = legendItems.find((item) => item.id === family);
      return item?.color ?? getThemeColor(METAC_COLORS["mc-option"][2]);
    },
    [legendItems, getThemeColor]
  );

  // Process data
  const referenceLines = useMemo(() => {
    const byKey = new Map<string, { y: number; label: string }>();
    for (const a of aggregates) {
      const y = Number(a.score);
      if (!Number.isFinite(y)) continue;
      const key = a.aggregateKind ?? a.name;
      const prev = byKey.get(key);
      if (!prev || y < prev.y) byKey.set(key, { y, label: a.name });
    }
    return Array.from(byKey.values());
  }, [aggregates]);

  // Transform data for Victory (convert dates to timestamps)
  const chartData = useMemo(() => {
    return bots.map((item) => ({
      x: +item.releaseDate,
      y: item.score,
      name: item.name,
      label: `${item.name}\nScore: ${item.score.toFixed(2)}`,
      family: item.family,
      pointKey: `${item.name}-${+item.releaseDate}-${item.score}`,
    }));
  }, [bots]);

  // Calculate SOTA points using the shared utility
  const sotaPoints: TrendPoint[] = useMemo(() => {
    return computeSotaPoints(chartData);
  }, [chartData]);

  // Calculate SOTA models - models that were the best at their release time
  const sotaModels = useMemo(() => {
    const sotaSet = new Set(sotaPoints.map((p) => `${p.x}-${p.y}`));
    return chartData.filter((d) => sotaSet.has(`${d.x}-${d.y}`));
  }, [chartData, sotaPoints]);

  const sotaModelNames = useMemo(
    () => new Set(sotaModels.map((m) => m.name)),
    [sotaModels]
  );

  // Calculate domain - optionally extended so the trendline visibly crosses the reference lines
  const { minX, maxX, minY, maxY } = useMemo(() => {
    // Build arrays and filter out non-finite values
    const xValues = chartData.map((d) => d.x).filter((x) => Number.isFinite(x));
    const yValues = chartData.map((d) => d.y).filter((y) => Number.isFinite(y));
    const refScores = referenceLines
      .map((r) => r.y)
      .filter((y) => Number.isFinite(y));

    // Combine yValues and refScores for Y domain calculation
    const allYValues = [...yValues, ...refScores];

    // Use safe fallbacks (0) when arrays are empty to ensure finite results
    const defaultX = 0;
    const defaultY = 0;

    const rawMinX = xValues.length > 0 ? Math.min(...xValues) : defaultX;
    const rawMaxX = xValues.length > 0 ? Math.max(...xValues) : defaultX;
    const rawMinY = allYValues.length > 0 ? Math.min(...allYValues) : defaultY;
    const rawMaxY = allYValues.length > 0 ? Math.max(...allYValues) : defaultY;

    let extendedMaxX = rawMaxX;
    if (showProjection && sotaPoints.length >= 2 && refScores.length > 0) {
      const regression = calculateLinearRegression(sotaPoints);
      if (regression && regression.slope > 0) {
        const highestRef = Math.max(...refScores);
        const crossingX = calculateCrossingX(regression, highestRef);
        if (crossingX !== null && crossingX > rawMaxX) {
          const padding = (crossingX - rawMinX) * 0.05;
          extendedMaxX = crossingX + padding;
        }
      }
    }

    return {
      minX: rawMinX,
      maxX: extendedMaxX,
      minY: rawMinY,
      maxY: rawMaxY,
    };
  }, [chartData, referenceLines, sotaPoints, showProjection]);

  const yTicks = useMemo(() => {
    const step = 10;
    const start = Math.floor(minY / step) * step;
    const end = Math.ceil(maxY / step) * step;
    return d3Range(start, end + step, step);
  }, [minY, maxY]);

  const xTicks = useMemo(() => {
    const startDate = new Date(minX);
    const endDate = new Date(maxX);

    // Start from the first day of the month containing minX
    const startMonth = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      1
    );

    // End at the first day of the month after maxX
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 1);

    const ticks: number[] = [];
    const current = new Date(startMonth);

    while (current <= endMonth) {
      ticks.push(+current);
      // Move to next 2 months
      current.setMonth(current.getMonth() + 2);
    }

    return ticks;
  }, [minX, maxX]);

  // Calculate SOTA trend line using the shared utility
  const trendLineData = useMemo(() => {
    return generateTrendLineData(sotaPoints, minX, maxX);
  }, [sotaPoints, minX, maxX]);

  // Check if a family is highlighted (full opacity dots) - memoized
  // When hovering, the hovered family AND any selected families stay highlighted
  const isHighlighted = useCallback(
    (family: string) => {
      if (hoveredFamily) {
        return family === hoveredFamily || selectedFamilies.has(family);
      }
      return selectedFamilies.size === 0 || selectedFamilies.has(family);
    },
    [hoveredFamily, selectedFamilies]
  );

  // Track active touch gestures so we can suppress voronoi activation during
  // scrolling and only respond to taps (via the synthetic mousemove the browser
  // fires after touchend).
  const touchActiveRef = useRef(false);
  // Timestamp of the last touchend — used to ignore the synthetic mouseleave
  // the browser fires shortly after a tap.
  const lastTouchTimeRef = useRef(0);

  // Prepare data with showLabel flag, opacity, and isSota flag - memoized
  // Show labels when:
  // 1. showAllLabels is true (show all), OR
  // 2. It's a SOTA model (only when not hovering a different family), OR
  // 3. The family is specifically selected in the legend (only when not hovering a different family), OR
  // 4. The family is hovered in the legend, OR
  // 5. The specific point is hovered
  const dataWithLabels = useMemo(() => {
    return chartData.map((d) => {
      const familyIsSelected = selectedFamilies.has(d.family ?? "");
      const familyIsHovered = hoveredFamily === d.family;
      const isHoveredPointFlag = hoveredPointKey === d.pointKey;
      // When hovering a family, only show labels for that family (and hovered points)
      // Hide labels from selected/SOTA families while hovering a different family
      const showLabelWhenHovering = familyIsHovered || isHoveredPointFlag;
      const showLabelNormally =
        showAllLabels ||
        sotaModelNames.has(d.name) ||
        familyIsSelected ||
        isHoveredPointFlag;
      return {
        ...d,
        showLabel: hoveredFamily ? showLabelWhenHovering : showLabelNormally,
        isHighlighted: isHighlighted(d.family ?? ""),
        isSota: sotaModelNames.has(d.name),
        isHoveredPoint: isHoveredPointFlag,
      };
    });
  }, [
    chartData,
    selectedFamilies,
    hoveredFamily,
    hoveredPointKey,
    showAllLabels,
    sotaModelNames,
    isHighlighted,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className ?? ""}`}
      style={{ minHeight: chartHeight }}
      onMouseLeave={() => {
        // After a touch, the browser fires a synthetic mouseleave. Ignore it
        // so the label activated by the tap doesn't immediately vanish.
        if (Date.now() - lastTouchTimeRef.current < 500) return;
        onHoveredPointKeyChange(null);
      }}
      onTouchStart={() => {
        touchActiveRef.current = true;
        onHoveredPointKeyChange(null);
      }}
      onTouchEnd={() => {
        touchActiveRef.current = false;
        lastTouchTimeRef.current = Date.now();
      }}
    >
      {containerWidth === 0 ? (
        <div className="h-[460px] w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-800 sm:h-[600px]" />
      ) : (
        <VictoryChart
          width={chartWidth}
          height={chartHeight}
          theme={chartTheme}
          padding={PADDING}
          domainPadding={domainPadding}
          domain={{
            x: [minX, maxX],
            y: [minY, maxY],
          }}
          containerComponent={
            <VictoryVoronoiContainer
              voronoiBlacklist={[/^refLine-/, /^refLabel-/, "sotaTrend"]}
              radius={30}
              activateData
              style={{ touchAction: "pan-y" }}
              onActivated={(points: { pointKey?: string }[]) => {
                // During an active touch gesture (scroll), suppress voronoi
                // activation so labels don't flicker. After the touch ends the
                // browser fires a synthetic mousemove for taps, which reaches
                // here with touchActiveRef already cleared.
                if (touchActiveRef.current) return;
                const point = points[0];
                if (point?.pointKey) {
                  onHoveredPointKeyChange(point.pointKey);
                }
              }}
            />
          }
        >
          {/* X Axis - Date - positioned at bottom */}
          <VictoryAxis
            orientation="bottom"
            offsetY={PADDING.bottom}
            tickFormat={(t: number) => {
              const date = new Date(t);
              return `${date.toLocaleString("default", { month: "short" })} '${String(date.getFullYear()).slice(2)}`;
            }}
            tickValues={xTicks}
            style={{
              axis: {
                stroke: "transparent",
              },
              ticks: { stroke: "transparent" },
              tickLabels: {
                fontSize: isSmallScreen ? 10 : 12,
                fill: tickLabelColor,
                angle: -45,
                textAnchor: "end",
                fontFamily: "system-ui, sans-serif",
              },
              grid: {
                stroke: gridStroke,
                strokeDasharray: "3,3",
                strokeWidth: 1,
                opacity: 0.25,
              },
            }}
            label="Release Date"
            axisLabelComponent={
              <VictoryLabel
                dy={35}
                style={{
                  fontSize: isSmallScreen ? 10 : 13,
                  fill: axisLabelColor,
                  fontFamily: "system-ui, sans-serif",
                  fontWeight: 500,
                }}
              />
            }
          />

          {/* Y Axis - Score (smaller sizes on small screens) */}
          <VictoryAxis
            dependentAxis={true}
            style={{
              axis: {
                stroke: "transparent",
              },
              ticks: { stroke: "transparent" },
              tickLabels: {
                fontSize: isSmallScreen ? 10 : 12,
                fill: tickLabelColor,
                fontFamily: "system-ui, sans-serif",
                fontFeatureSettings: '"tnum"',
              },
              grid: {
                stroke: gridStroke,
                strokeDasharray: "3,3",
                strokeWidth: 1,
                opacity: 0.25,
              },
            }}
            tickValues={yTicks}
            label="Forecasting Score"
            axisLabelComponent={
              <VictoryLabel
                angle={-90}
                dy={isSmallScreen ? 0 : -10}
                dx={-10}
                style={{
                  fontSize: isSmallScreen ? 10 : 13,
                  fill: axisLabelColor,
                  fontFamily: "system-ui, sans-serif",
                  fontWeight: 500,
                }}
              />
            }
          />

          {/* Reference benchmark horizontal dotted lines */}
          {referenceLines.map((item, idx) => (
            <VictoryLine
              key={item.label}
              name={`refLine-${idx}`}
              data={[
                { x: minX, y: item.y },
                { x: maxX, y: item.y },
              ]}
              style={{
                data: {
                  stroke: getThemeColor(METAC_COLORS.purple[700]),
                  strokeWidth: 1.5,
                  opacity: 1,
                  strokeDasharray: "6,5",
                },
              }}
            />
          ))}

          {/* Reference benchmark labels - positioned at end of lines */}
          {referenceLines.map((item, idx) => (
            <VictoryScatter
              key={`label-${item.label}`}
              name={`refLabel-${idx}`}
              data={[{ x: maxX, y: item.y }]}
              size={0}
              style={{ data: { opacity: 0 } }}
              labels={[item.label]}
              labelComponent={
                <VictoryLabel
                  dx={2}
                  dy={-6}
                  textAnchor="end"
                  style={{
                    fontSize: isSmallScreen ? 10 : 12,
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: 600,
                    fill: getThemeColor(METAC_COLORS.purple[700]),
                  }}
                />
              }
            />
          ))}

          {/* SOTA Trend Line */}
          <VictoryLine
            name="sotaTrend"
            data={trendLineData}
            style={{
              data: {
                stroke: getThemeColor(METAC_COLORS["mc-option"][3]),
                strokeWidth: 1.5,
                strokeDasharray: "6,5",
              },
            }}
          />

          {/* Dots - colored by option palette, stars for SOTA models */}
          <VictoryScatter
            name="points"
            data={dataWithLabels}
            size={(args: CallbackArgs) => {
              const datum = (args.datum ?? {}) as { isSota?: boolean };
              return datum.isSota ? 5 : 4;
            }}
            symbol={(args: CallbackArgs) => {
              const datum = (args.datum ?? {}) as { isSota?: boolean };
              return datum.isSota ? "star" : "circle";
            }}
            style={{
              data: {
                fill: (args: CallbackArgs) => {
                  const datum = (args.datum ?? {}) as { family?: string };
                  return colorForFamily(datum.family ?? "");
                },
                stroke: (args: CallbackArgs) => {
                  const datum = (args.datum ?? {}) as { family?: string };
                  return colorForFamily(datum.family ?? "");
                },
                strokeWidth: 1,
                fillOpacity: (args: CallbackArgs) => {
                  const datum = (args.datum ?? {}) as {
                    isHighlighted?: boolean;
                    isHoveredPoint?: boolean;
                  };
                  return datum.isHighlighted || datum.isHoveredPoint ? 1 : 0.25;
                },
                strokeOpacity: (args: CallbackArgs) => {
                  const datum = (args.datum ?? {}) as {
                    isHighlighted?: boolean;
                    isHoveredPoint?: boolean;
                  };
                  return datum.isHighlighted || datum.isHoveredPoint ? 1 : 0.25;
                },
                cursor: "pointer",
              },
            }}
            labels={() => ""}
            labelComponent={
              <VictoryLabel style={{ opacity: 0, pointerEvents: "none" }} />
            }
          />

          {/* Custom labels layer with collision detection */}
          <CollisionAwareLabels
            data={dataWithLabels}
            xDomain={[minX, maxX]}
            yDomain={[minY, maxY]}
            colorForFamily={colorForFamily}
            getThemeColor={getThemeColor}
            padding={PADDING}
            chartWidth={chartWidth}
            chartHeight={chartHeight}
            domainPadding={domainPadding}
            labelFontSize={labelFontSize}
          />
        </VictoryChart>
      )}
    </div>
  );
}

export default BenchmarkChart;
