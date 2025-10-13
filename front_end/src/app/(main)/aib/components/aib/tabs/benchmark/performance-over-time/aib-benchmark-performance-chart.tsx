"use client";

import { FC, useMemo } from "react";
import {
  VictoryAxis,
  VictoryChart,
  VictoryLabel,
  VictoryLine,
  VictoryScatter,
  VictoryVoronoiContainer,
} from "victory";
import type { CallbackArgs, VictoryLabelProps } from "victory-core";

import EdgeAwareLabel from "@/components/charts/edge_aware_label";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import { useBreakpoint } from "@/hooks/tailwind";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import { getYMeta } from "@/utils/charts/axis";

import { ModelPoint } from "./mapping";

type LegendItem =
  | { label: string; pointIndex: number }
  | { label: string; trend: true };

type Props = { data: ModelPoint[]; className?: string; legend?: LegendItem[] };

const AIBBenchmarkPerformanceChart: FC<Props> = ({
  data,
  legend,
  className,
}) => {
  const { ref: wrapRef, width } = useContainerSize<HTMLDivElement>();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const smUp = useBreakpoint("sm");

  const points = useMemo(
    () =>
      data.map((d, i) => ({
        i,
        x:
          d.releaseDate instanceof Date
            ? d.releaseDate
            : new Date(d.releaseDate),
        y: d.score,
        name: d.name,
      })),
    [data]
  );

  const yMeta = useMemo(() => {
    const vals = points.map((p) => p.y);
    return getYMeta(vals, {
      gridlines: GRIDLINES,
      padMin: 2,
      padRatio: 0.1,
      clamp: [0, 100],
    });
  }, [points]);

  const trend = useMemo(() => {
    if (points.length < 2) return null;
    const xs = points.map((p) =>
      (p.x instanceof Date ? p.x : new Date(p.x)).getTime()
    );
    const ys = points.map((p) => p.y);

    const n = xs.length;
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;

    const num = xs.reduce(
      (s, x, i) => s + (x - meanX) * ((ys[i] ?? 0) - meanY),
      0
    );
    const den = xs.reduce((s, x) => s + (x - meanX) ** 2, 0) || 1;

    const m = num / den;
    const b = meanY - m * meanX;
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);

    const clampY = (v: number) =>
      Math.max(yMeta.lo - 0.5, Math.min(yMeta.hi + 0.5, v));

    return [
      { x: new Date(minX), y: clampY(m * minX + b) },
      { x: new Date(maxX), y: clampY(m * maxX + b) },
    ];
  }, [points, yMeta]);

  const groupIndexByLabel = useMemo(() => {
    const m = new Map<string, number>();
    (legend ?? []).forEach((item) => {
      if ("pointIndex" in item) m.set(item.label, item.pointIndex);
    });
    return m;
  }, [legend]);

  const colorForName = (name: string) => {
    const group = String(name).split(" ")[0] ?? name;
    const idx = groupIndexByLabel.get(group);
    return colorFor(
      typeof idx === "number" ? { index: idx } : { index: 0 }
    ) as string;
  };

  const colorFor = (idxOrArgs: number | CallbackArgs) => {
    const idx =
      typeof idxOrArgs === "number" ? idxOrArgs : safeIndex(idxOrArgs.index);
    const chosen =
      Object.values(METAC_COLORS["mc-option"])[
        idx % Object.values(METAC_COLORS["mc-option"]).length
      ] ?? METAC_COLORS["mc-option"][1];
    return getThemeColor(chosen);
  };

  return (
    <div ref={wrapRef} className={className ?? "relative w-full"}>
      {width === 0 && <div style={{ height: smUp ? 360 : 220 }} />}
      {width > 0 && (
        <VictoryChart
          width={width}
          height={smUp ? 360 : 220}
          theme={chartTheme}
          scale={{ x: "time" }}
          domain={{ y: [yMeta.lo - 0.5, yMeta.hi + 0.5] }}
          domainPadding={{ x: 24 }}
          padding={{ top: 16, bottom: 68, left: 50, right: 0 }}
          containerComponent={
            <VictoryVoronoiContainer
              labels={() => " "}
              voronoiBlacklist={["bgPoints", "labelsLayer"]}
              activateData
              style={{ touchAction: "pan-y" }}
              labelComponent={<NullLabel />}
            />
          }
        >
          <VictoryAxis
            dependentAxis
            label="Score"
            axisLabelComponent={<VictoryLabel angle={-90} dx={-10} dy={-10} />}
            tickValues={yMeta.ticks}
            tickFormat={(d: number) => Math.round(d)}
            style={{
              grid: {
                stroke: getThemeColor(METAC_COLORS.gray[400]),
                strokeWidth: 1,
                strokeDasharray: "2,5",
              },
              axis: { stroke: "transparent" },
              ticks: { stroke: "transparent" },
              tickLabels: {
                fill: getThemeColor(METAC_COLORS.gray[500]),
                fontSize: smUp ? 16 : 12,
                fontWeight: 400,
              },
              axisLabel: {
                fill: getThemeColor(METAC_COLORS.gray[700]),
                fontSize: smUp ? 16 : 12,
                fontWeight: 400,
              },
            }}
          />

          <VictoryAxis
            label="Model release date"
            axisLabelComponent={<VictoryLabel dy={28} />}
            tickFormat={(d: Date) =>
              d.toLocaleDateString(undefined, {
                month: "short",
                year: "numeric",
              })
            }
            tickLabelComponent={<DateTick />}
            style={{
              axis: { stroke: "transparent" },
              ticks: { stroke: "transparent" },
              tickLabels: {
                fill: getThemeColor(METAC_COLORS.gray[500]),
                fontSize: smUp ? 16 : 12,
              },
              axisLabel: {
                fill: getThemeColor(METAC_COLORS.gray[700]),
                fontSize: smUp ? 16 : 12,
              },
              grid: { stroke: "transparent" },
            }}
          />

          {trend && (
            <VictoryLine
              name="trend"
              data={trend}
              style={{
                data: {
                  stroke: getThemeColor(METAC_COLORS.blue[800]),
                  strokeWidth: 2,
                  strokeDasharray: "6,5",
                },
              }}
            />
          )}

          <VictoryScatter
            name="bgPoints"
            data={points}
            x="x"
            y="y"
            size={14}
            style={{ data: { opacity: 0 } }}
          />

          <VictoryScatter
            data={points}
            x="x"
            y="y"
            size={5}
            style={{
              data: {
                fill: ({ datum }) =>
                  colorForName((datum as { name: string }).name),
              },
            }}
          />

          <VictoryScatter
            name="labelsLayer"
            data={points}
            labelComponent={
              <EdgeAwareLabel
                chartWidth={width}
                padLeft={50}
                padRight={0}
                minGap={10}
                fontSizePx={16}
                dy={8}
              />
            }
            x="x"
            y="y"
            size={6}
            labels={({ datum }) => (datum as { name: string }).name}
            style={{
              labels: {
                fill: (args: CallbackArgs) =>
                  colorForName((args.datum as { name: string })?.name || ""),
                fontSize: smUp ? 16 : 12,
              },
              data: { opacity: 0 },
            }}
          />
        </VictoryChart>
      )}

      {legend?.length ? (
        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {legend.map((item, i) =>
            "pointIndex" in item ? (
              <LegendDot
                key={`legend-dot-${i}`}
                color={
                  colorFor({
                    index: item.pointIndex,
                  } as unknown as CallbackArgs) as string
                }
                label={item.label}
              />
            ) : (
              <LegendTrend
                key={`legend-trend-${i}`}
                color={getThemeColor(METAC_COLORS.blue[800])}
                label={item.label}
              />
            )
          )}
        </div>
      ) : null}
    </div>
  );
};

const LegendDot: FC<{ color: string; label: string }> = ({ color, label }) => (
  <span className="inline-flex items-center gap-2">
    <span
      aria-hidden
      className="inline-block h-[14px] w-[14px] rounded-full"
      style={{ background: color }}
    />
    <span className="text-lg text-gray-900 dark:text-gray-900-dark">
      {label}
    </span>
  </span>
);

const LegendTrend: FC<{ color: string; label: string }> = ({
  color,
  label,
}) => (
  <span className="inline-flex items-center gap-2">
    <span className="relative inline-block h-[3px] w-5">
      <span
        aria-hidden
        className="absolute left-0 top-1/2 w-full -translate-y-1/2"
        style={{ borderTop: `2px dashed ${color}` }}
      />
    </span>
    <span className="text-lg text-gray-900 dark:text-gray-900-dark">
      {label}
    </span>
  </span>
);

const GRIDLINES = 5;
const NullLabel: React.FC<Record<string, unknown>> = () => null;
const safeIndex = (i: CallbackArgs["index"]) => (typeof i === "number" ? i : 0);

const DateTick: React.FC<
  VictoryLabelProps & { index?: number; ticks?: unknown[] }
> = (props) => {
  const i = props.index ?? 0;
  const count = props.ticks?.length ?? 0;
  const dx = i === 0 ? -44 : count > 0 && i === count - 1 ? -44 : -4;
  const dy = 16;
  return <VictoryLabel {...props} dx={dx} dy={dy} textAnchor="start" />;
};

export default AIBBenchmarkPerformanceChart;
