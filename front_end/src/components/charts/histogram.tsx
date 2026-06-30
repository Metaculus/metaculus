"use client";

import { FloatingPortal } from "@floating-ui/react";
import { range } from "lodash";
import { useTranslations } from "next-intl";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryContainer,
  VictoryLabel,
  VictoryPortal,
} from "victory";
import type { CallbackArgs } from "victory-core";

import { CHART_DASH } from "@/constants/chart_dash";
import { CHART_STROKE_WIDTH } from "@/constants/chart_stroke";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { CHART_FONT_STYLE } from "@/constants/chart_typography";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useChartTooltip from "@/hooks/use_chart_tooltip";
import useContainerSize from "@/hooks/use_container_size";
import { QuestionStatus } from "@/types/post";
import cn from "@/utils/core/cn";

const BIN_COUNT = 100;
const X_PADDING = 12;
const BOTTOM_PADDING = 20;
const MARKER_HEIGHT = 1;
const BAR_OPACITY = 0.45;
const BAR_HOVER_OPACITY = 0.7;
const COLUMN_HIGHLIGHT_OPACITY = 0.15;

type HistogramProps = {
  histogramData: { x: number; y: number }[];
  median: number | null | undefined;
  mean: number | null | undefined;
  questionStatus?: QuestionStatus;
  height?: number;
  onChartReady?: () => void;
};

const Histogram: React.FC<HistogramProps> = ({
  histogramData,
  median,
  mean,
  questionStatus,
  height,
  onChartReady,
}) => {
  const t = useTranslations();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const {
    ref: chartContainerRef,
    width: containerWidth,
    height: containerHeight,
  } = useContainerSize<HTMLDivElement>();
  const chartWidth = containerWidth;
  const chartHeight = height ?? containerHeight;

  const notifiedReady = useRef(false);
  useEffect(() => {
    if (
      !notifiedReady.current &&
      chartWidth > 0 &&
      chartHeight > 0 &&
      onChartReady
    ) {
      notifiedReady.current = true;
      onChartReady();
    }
  }, [onChartReady, chartWidth, chartHeight]);

  const palette = useMemo(() => {
    switch (questionStatus) {
      case QuestionStatus.RESOLVED:
        return {
          line: METAC_COLORS.purple["700"],
          area: METAC_COLORS.purple["500"],
        };
      case QuestionStatus.CLOSED:
        return {
          line: METAC_COLORS.gray["700"],
          area: METAC_COLORS.gray["500"],
        };
      default:
        return {
          line: METAC_COLORS.olive["700"],
          area: METAC_COLORS.olive["500"],
        };
    }
  }, [questionStatus]);

  const binValues = useMemo(() => {
    const values = new Array<number>(BIN_COUNT).fill(0);
    for (const { x, y } of histogramData) {
      if (x >= 0 && x < BIN_COUNT) {
        values[x] = y;
      }
    }
    return values;
  }, [histogramData]);
  const maxY = Math.max(...histogramData.map((d) => d.y), 0);

  const [hoveredBin, setHoveredBin] = useState<number | null>(null);
  // Mouse position is tracked internally by the tooltip's useClientPoint via
  // DOM listeners; feeding it through state would call setPositionReference
  // from a layout effect on every mousemove and trip React's nested-update
  // limit. Only touch needs explicit coordinates.
  const [touchPoint, setTouchPoint] = useState<{ x: number; y: number } | null>(
    null
  );

  const getBinFromPoint = useCallback(
    (clientX: number) => {
      const container = chartContainerRef.current;
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      const plotWidth = rect.width - 2 * X_PADDING;
      if (plotWidth <= 0) return null;
      const domainX =
        ((clientX - rect.left - X_PADDING) / plotWidth) * BIN_COUNT;
      return Math.min(BIN_COUNT - 1, Math.max(0, Math.floor(domainX)));
    },
    [chartContainerRef]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setHoveredBin(getBinFromPoint(e.clientX));
    },
    [getBinFromPoint]
  );
  const handleMouseLeave = useCallback(() => {
    setHoveredBin(null);
  }, []);
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      if (!touch) return;
      setHoveredBin(getBinFromPoint(touch.clientX));
      setTouchPoint({ x: touch.clientX, y: touch.clientY });
    },
    [getBinFromPoint]
  );
  const handleTouchEnd = useCallback(() => {
    setHoveredBin(null);
    setTouchPoint(null);
  }, []);

  const {
    isActive,
    getReferenceProps,
    getFloatingProps,
    refs,
    floatingStyles,
  } = useChartTooltip({
    placement: "top",
    tooltipOffset: touchPoint ? 50 : 12,
    x: touchPoint?.x ?? null,
    y: touchPoint?.y ?? null,
  });

  const totalWeight = useMemo(
    () => binValues.reduce((acc, value) => acc + value, 0),
    [binValues]
  );
  const hoveredValue = hoveredBin === null ? 0 : binValues[hoveredBin] ?? 0;
  // Bars are recency-weighted, so a bin can't be expressed as a raw forecaster
  // count; show its share of the total weight instead.
  const sharePct = totalWeight > 0 ? (hoveredValue / totalWeight) * 100 : 0;
  // never read "0%" for a non-empty bin (those still render a marker)
  const shareLabel =
    sharePct === 0
      ? "0%"
      : sharePct < 0.1
        ? "<0.1%"
        : `${sharePct.toFixed(1)}%`;
  const showTooltip = isActive && hoveredBin !== null;

  const isBinHovered = useCallback(
    ({ datum }: CallbackArgs) =>
      hoveredBin !== null && (datum as { x: number }).x === hoveredBin,
    [hoveredBin]
  );

  const setContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      chartContainerRef.current = node;
      refs.setReference(node);
    },
    [chartContainerRef, refs]
  );

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-2 text-center">
        {median != null && (
          <span className="text-sm font-bold capitalize">
            {t("median")}{" "}
            <span
              className="tabular-nums"
              style={{ color: getThemeColor(palette.line) }}
            >{`${(100 * median).toFixed(1)}%`}</span>
          </span>
        )}
        {mean != null && (
          <span className="ml-8 text-sm font-bold capitalize">
            {t("mean")}{" "}
            <span
              className="tabular-nums"
              style={{ color: getThemeColor(palette.line) }}
            >{`${(100 * mean).toFixed(1)}%`}</span>
          </span>
        )}
      </div>
      <div
        ref={setContainerRef}
        className={cn("relative w-full", !height && "min-h-0 flex-1")}
        style={height ? { height } : undefined}
        {...getReferenceProps({
          onMouseMove: handleMouseMove,
          onMouseLeave: handleMouseLeave,
          onTouchMove: handleTouchMove,
          onTouchEnd: handleTouchEnd,
          onTouchCancel: handleTouchEnd,
        })}
      >
        {/* full-height column highlight for the hovered bin; rendered before
            the svg so it stays behind bars and gridlines */}
        {hoveredBin !== null && chartWidth > 0 && chartHeight > 0 && (
          <div
            className="pointer-events-none absolute"
            style={{
              left:
                X_PADDING +
                (hoveredBin / BIN_COUNT) * (chartWidth - 2 * X_PADDING),
              width: (chartWidth - 2 * X_PADDING) / BIN_COUNT,
              top: 0,
              height: chartHeight - BOTTOM_PADDING,
              backgroundColor: getThemeColor(palette.area),
              opacity: COLUMN_HIGHLIGHT_OPACITY,
            }}
          />
        )}
        {chartWidth > 0 && chartHeight > 0 && (
          <VictoryChart
            theme={chartTheme}
            domain={{
              x: [0, BIN_COUNT],
              y: [0, (maxY || 1) * 1.01], // prevent highest bar being cut off
            }}
            containerComponent={
              <VictoryContainer
                responsive={true}
                style={{
                  touchAction: "pan-y",
                }}
              />
            }
            padding={{
              top: 0,
              bottom: BOTTOM_PADDING,
              left: X_PADDING,
              right: X_PADDING,
            }}
            height={chartHeight}
            width={chartWidth}
          >
            <VictoryAxis
              dependentAxis
              tickFormat={() => ""}
              style={{
                ticks: { stroke: "transparent" },
                tickLabels: { fill: "transparent" },
                axis: { stroke: "transparent" },
                grid: {
                  stroke: getThemeColor(METAC_COLORS.gray["400"]),
                  strokeWidth: CHART_STROKE_WIDTH.grid,
                  strokeDasharray: CHART_DASH.grid,
                },
              }}
            />
            <VictoryBar
              data={histogramData}
              style={{
                data: {
                  fill: getThemeColor(palette.area),
                  opacity: (arg: CallbackArgs) =>
                    isBinHovered(arg) ? BAR_HOVER_OPACITY : BAR_OPACITY,
                },
              }}
              barRatio={0.85}
              alignment="start"
            />
            {/* 1px markers on top of each bin */}
            <VictoryBar
              data={histogramData}
              style={{
                data: {
                  fill: getThemeColor(palette.line),
                },
              }}
              barRatio={0.85}
              alignment="start"
              getPath={(props: unknown) => {
                const { x0, x1, y0, y1, datum } = props as {
                  x0: number;
                  x1: number;
                  y0: number;
                  y1: number;
                  datum: { y: number };
                };

                if (!datum || datum.y === 0) return "";

                const base =
                  typeof y0 === "number" ? y0 : chartHeight - BOTTOM_PADDING;
                // keep the marker above the axis line even for near-zero bins
                const top = Math.min(y1, base - 1 - MARKER_HEIGHT);

                return `M ${x0}, ${top}
                  L ${x1}, ${top}
                  L ${x1}, ${top + MARKER_HEIGHT}
                  L ${x0}, ${top + MARKER_HEIGHT}
                  z`;
              }}
            />
            <VictoryAxis
              tickValues={
                chartWidth > 400 ? range(0, BIN_COUNT + 1, 10) : [0, 50, 100]
              }
              tickFormat={(x: number) => `${x}%`}
              tickLabelComponent={
                <VictoryPortal>
                  <VictoryLabel dy={3} />
                </VictoryPortal>
              }
              style={{
                tickLabels: {
                  ...CHART_FONT_STYLE.tick,
                  fontWeight: 400,
                  fill: getThemeColor(METAC_COLORS.gray["700"]),
                },
                ticks: {
                  stroke: getThemeColor(METAC_COLORS.gray["400"]),
                  strokeWidth: CHART_STROKE_WIDTH.grid,
                },
                axis: {
                  stroke: getThemeColor(METAC_COLORS.gray["400"]),
                  strokeWidth: CHART_STROKE_WIDTH.grid,
                },
                grid: { stroke: "none" },
              }}
            />
          </VictoryChart>
        )}
      </div>
      {showTooltip && (
        <FloatingPortal>
          <div
            className="pointer-events-none z-100 rounded bg-blue-800 px-3 py-1.5 leading-5 shadow-lg dark:bg-blue-800-dark"
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            <div
              className="text-center text-blue-200 dark:text-gray-200-dark"
              style={CHART_FONT_STYLE.tooltip}
            >
              <div className="text-lg font-normal tabular-nums">
                {`${hoveredBin}-${hoveredBin}.9%`}
              </div>
              <div className="mx-auto max-w-[7.5rem] text-balance tabular-nums text-blue-300 dark:text-blue-300-dark">
                {t("histogramBinShare", { share: shareLabel })}
              </div>
            </div>
          </div>
        </FloatingPortal>
      )}
    </div>
  );
};

export default Histogram;
