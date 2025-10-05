"use client";
import { FC, useCallback, useMemo, useState } from "react";
import { DomainTuple } from "victory";

import NumericChart from "@/components/charts/numeric_chart";
import { METAC_COLORS } from "@/constants/colors";
import { Area, Line, TimelineChartZoomOption } from "@/types/charts";
import { IndexSeries } from "@/types/projects";
import {
  generateNumericXDomain,
  generateTimestampXScale,
} from "@/utils/charts/axis";

import {
  getIndexBounds,
  getVerticalLegendProps,
} from "../../helpers/index_legend";
import VerticalGradientArrow from "../vertical_legend_arrow";

type Props = {
  series: IndexSeries;
  height?: number;
  chartTitle?: string;
  minLabel?: string | null;
  maxLabel?: string | null;
  increasingIsGood?: boolean | null;
  min?: number | null;
  max?: number | null;
};

const IndexTimeline: FC<Props> = ({
  series,
  height = 170,
  chartTitle,
  minLabel,
  maxLabel,
  increasingIsGood,
  min,
  max,
}) => {
  const buildChartData = useCallback(
    (width: number, zoom: TimelineChartZoomOption) =>
      buildChart({ series, width, zoom, min, max }),
    [series, min, max]
  );

  const legend = getVerticalLegendProps({
    min,
    max,
    min_label: minLabel,
    max_label: maxLabel,
    increasing_is_good: increasingIsGood,
  });

  const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);
  const handleCursorChange = (value: number | null) =>
    setCursorTimestamp(value);

  const resolutionPoint = useMemo(() => {
    if (series.status !== "resolved") return undefined;
    const last = series.line.at(-1);
    const x =
      series.resolved_at != null
        ? Math.floor(new Date(series.resolved_at).getTime() / 1000)
        : last?.x;
    const y = series.resolution_value ?? last?.y;
    return x != null && y != null ? [{ x, y }] : undefined;
  }, [series]);

  return (
    <NumericChart
      buildChartData={buildChartData}
      withZoomPicker={true}
      height={height}
      cursorTimestamp={cursorTimestamp}
      onCursorChange={handleCursorChange}
      chartTitle={chartTitle}
      colorOverride={METAC_COLORS.blue["600"]}
      resolutionPoint={resolutionPoint}
      leftLegend={
        <>
          <VerticalGradientArrow {...legend} className="hidden sm:block" />
          <VerticalGradientArrow
            {...legend}
            stemThickness={3}
            className="max-w-[66px] border-none p-0 sm:hidden"
          />
        </>
      }
    />
  );
};

function buildChart({
  series,
  width,
  zoom,
  min,
  max,
}: {
  series: IndexSeries;
  width: number;
  zoom: TimelineChartZoomOption;
  min?: number | null;
  max?: number | null;
}) {
  const linePoints = series.line;
  const timestamps = linePoints.map((p) => p.x as number);
  const earliestTimestamp = timestamps[0] ?? 0;
  const latestTimestamp = timestamps[timestamps.length - 1] ?? 1;

  const timestampPadding = (latestTimestamp - earliestTimestamp) * 0.03;
  const domainStart = earliestTimestamp - timestampPadding;
  const xDomain = generateNumericXDomain([domainStart, ...timestamps], zoom);
  const xScale = generateTimestampXScale(
    [earliestTimestamp, latestTimestamp],
    width
  );

  const { MIN, MAX } = getIndexBounds({ min, max });
  const yDomain = [MIN, MAX] as DomainTuple;

  const ticks = makeTicks(MIN, MAX, 5);
  const showPlus = MIN < 0 && MAX > 0;
  const tickFormat = (tick: number) =>
    showPlus && tick > 0 ? `+${formatTick(tick)}` : formatTick(tick);

  return {
    line: linePoints,
    area: [] as Area,
    points: [] as Line,
    yDomain,
    yScale: { ticks, tickFormat },
    xDomain,
    xScale,
  };
}

function makeTicks(min: number, max: number, count = 5): number[] {
  if (count <= 1) return [min, max];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + i * step);
}

function formatTick(v: number): string {
  const isInt = Math.abs(v % 1) < 1e-9;
  return isInt ? v.toFixed(0) : v.toFixed(1);
}

export default IndexTimeline;
