"use client";

import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";
import {
  VictoryAxis,
  VictoryChart,
  VictoryLabel,
  VictoryLine,
  VictoryScatter,
  VictoryVoronoiContainer,
} from "victory";
import type { CallbackArgs } from "victory-core";

import EdgeAwareLabel from "@/components/charts/edge_aware_label";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import { useBreakpoint } from "@/hooks/tailwind";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import { getYMeta } from "@/utils/charts/axis";
import { fitTrend } from "@/utils/charts/helpers";

import { ModelPoint } from "./mapping";

type LegendItem =
  | { label: string; pointIndex: number }
  | { label: string; trend: true }
  | { label: string; sota: true };

type Props = { data: ModelPoint[]; className?: string; legend?: LegendItem[] };

const isValidDate = (d: Date) => !Number.isNaN(+d);
const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));

const AIBBenchmarkPerformanceChart: FC<Props> = ({
  data,
  legend,
  className,
}) => {
  const t = useTranslations();
  const { ref: wrapRef, width } = useContainerSize<HTMLDivElement>();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const smUp = useBreakpoint("sm");
  const REF_STROKE = getThemeColor(METAC_COLORS.purple[700]);

  const referenceLines = useMemo(() => {
    const byKey = new Map<string, { y: number; label: string }>();
    for (const d of data) {
      if (!d.isAggregate) continue;
      const y = Number(d.score);
      if (!Number.isFinite(y)) continue;
      const key = d.aggregateKind ?? d.name;
      const prev = byKey.get(key);
      if (!prev || y < prev.y) byKey.set(key, { y, label: d.name });
    }
    return Array.from(byKey.values());
  }, [data]);

  const rightPad = referenceLines.length ? 64 : 40;

  const pointsAll = useMemo(() => {
    return data
      .map((d, i) => {
        const x = toDate(d.releaseDate);
        const y = Number(d.score);
        return {
          i,
          x,
          y,
          name: d.name,
          isAggregate: !!d.isAggregate,
        };
      })
      .filter((p) => isValidDate(p.x) && Number.isFinite(p.y));
  }, [data]);

  const plotPoints = useMemo(
    () => pointsAll.filter((p) => !data[p.i]?.isAggregate),
    [pointsAll, data]
  );

  const sotaPoints = useMemo(() => {
    const pts = [...plotPoints].sort((a, b) => +a.x - +b.x);
    const result: typeof plotPoints = [];
    let best = -Infinity;
    for (const p of pts) {
      if (p.y > best) {
        result.push(p);
        best = p.y;
      }
    }
    return result;
  }, [plotPoints]);

  const yMeta = useMemo(() => {
    const vals = [
      ...plotPoints.map((p) => p.y),
      ...referenceLines.map((r) => r.y),
    ];
    return getYMeta(vals, { gridlines: GRIDLINES, padMin: 2, padRatio: 0.1 });
  }, [plotPoints, referenceLines]);

  const xDomain = useMemo<[Date, Date]>(() => {
    if (plotPoints.length === 0) {
      const now = new Date();
      return [now, now];
    }
    const xs = plotPoints.map((p) => +p.x);
    const min = new Date(Math.min(...xs));
    const max = new Date(Math.max(...xs));
    return [min, max];
  }, [plotPoints]);

  const targetTicks = smUp ? 5 : 3;

  const timeTicks = useMemo<Date[]>(() => {
    const [min, max] = xDomain;
    return buildTimeTicks(min, max, targetTicks);
  }, [xDomain, targetTicks]);

  const xDomainAligned = useMemo<[Date, Date]>(() => {
    const [dataMin, dataMax] = xDomain;
    const firstTick = timeTicks[0] ?? dataMin;
    const first = firstTick < dataMin ? dataMin : firstTick;
    const lastTick = timeTicks[timeTicks.length - 1] ?? dataMax;
    const last = lastTick < dataMax ? dataMax : lastTick;
    return [first, last];
  }, [timeTicks, xDomain]);

  const trend = useMemo(() => {
    const base = sotaPoints.length >= 2 ? sotaPoints : plotPoints;
    return fitTrend(
      base.map((p) => ({ x: p.x as Date, y: p.y as number })),
      yMeta
    );
  }, [sotaPoints, plotPoints, yMeta]);

  const groupIndexByLabel = useMemo(() => {
    const m = new Map<string, number>();
    (legend ?? []).forEach((item) => {
      if ("pointIndex" in item) m.set(item.label, item.pointIndex);
    });
    return m;
  }, [legend]);

  const colorForName = (name: string) => {
    const first = String(name).split(" ")[0] ?? name;
    const group = /^gpt/i.test(first) ? "OpenAI" : first;
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

  const labelText = (d: { name?: string }) => d?.name ?? " ";
  const labelStyle = {
    fontSize: smUp ? 16 : 12,
    fontFamily: 'interVariable, "interVariable Fallback", inter',
    fontWeight: 400,
    fill: (args: CallbackArgs) =>
      colorForName((args.datum as { name?: string })?.name || ""),
    pointerEvents: "none" as const,
    userSelect: "none" as const,
    cursor: "default",
  };
  const edgePadLeft = smUp ? 50 : 30;
  const edgePadRight = rightPad;
  const pointKey = (p: { x: Date; y: number; name: string }) =>
    `${+p.x}|${p.y}|${p.name}`;
  const labeledKeySet = useMemo(
    () => new Set(sotaPoints.map(pointKey)),
    [sotaPoints]
  );
  const hoverPoints = useMemo(
    () =>
      plotPoints.map((p) => ({
        ...p,
        suppressHover: labeledKeySet.has(pointKey(p)),
      })),
    [plotPoints, labeledKeySet]
  );

  return (
    <div ref={wrapRef} className={className ?? "relative w-full"}>
      {width === 0 && <div style={{ height: smUp ? 360 : 220 }} />}
      {width > 0 && (
        <VictoryChart
          width={width}
          height={smUp ? 360 : 220}
          theme={chartTheme}
          scale={{ x: "time" }}
          domain={{ x: xDomainAligned, y: [yMeta.lo - 0.5, yMeta.hi + 0.5] }}
          domainPadding={{ x: 24 }}
          padding={{
            top: 16,
            bottom: 68,
            left: smUp ? 50 : 30,
            right: rightPad,
          }}
          containerComponent={
            <VictoryVoronoiContainer
              voronoiBlacklist={[
                "bgPoints",
                "labelsLayer",
                "points",
                "trend",
                "refLine",
                "refLabel",
                "sotaStars",
              ]}
              radius={30}
              activateData
              style={{ touchAction: "pan-y" }}
              labels={({
                datum,
              }: {
                datum: { name?: string; suppressHover?: boolean };
              }) => (datum?.suppressHover ? undefined : datum?.name ?? " ")}
              labelComponent={
                <EdgeAwareLabel
                  chartWidth={width}
                  padLeft={edgePadLeft}
                  padRight={edgePadRight}
                  minGap={10}
                  fontSizePx={smUp ? 16 : 12}
                  dy={8}
                  style={labelStyle}
                />
              }
            />
          }
        >
          <VictoryAxis
            dependentAxis
            label={t("aibScore")}
            axisLabelComponent={
              <VictoryLabel angle={-90} dx={-10} dy={smUp ? -10 : 10} />
            }
            tickValues={yMeta.ticks}
            tickFormat={smUp ? (d: number) => Math.round(d) : () => ""}
            style={{
              grid: {
                stroke: getThemeColor(METAC_COLORS.gray[900]),
                strokeWidth: 0.1,
              },
              axis: { stroke: "transparent" },
              ticks: { stroke: "transparent" },
              tickLabels: {
                fill: getThemeColor(METAC_COLORS.gray[500]),
                fontSize: smUp ? 12 : 12,
                fontWeight: 400,
                fontFeatureSettings: '"tnum"',
              },
              axisLabel: {
                fill: getThemeColor(METAC_COLORS.gray[700]),
                fontSize: 14,
                fontWeight: 400,
              },
            }}
          />

          <VictoryAxis
            orientation="bottom"
            crossAxis={false}
            label={t("aibModelReleaseDate")}
            axisLabelComponent={<VictoryLabel dy={28} />}
            tickFormat={(d: Date) =>
              d.toLocaleDateString(undefined, {
                month: "short",
                year: "numeric",
              })
            }
            offsetY={68}
            tickValues={timeTicks}
            tickLabelComponent={<VictoryLabel dy={16} textAnchor="middle" />}
            style={{
              axis: { stroke: "transparent" },
              ticks: { stroke: "transparent" },
              tickLabels: {
                fill: getThemeColor(METAC_COLORS.gray[500]),
                fontSize: smUp ? 12 : 10,
              },
              axisLabel: {
                fill: getThemeColor(METAC_COLORS.gray[700]),
                fontSize: 16,
              },
              grid: { stroke: "transparent" },
            }}
          />

          {referenceLines.map((rl, i) => (
            <VictoryLine
              key={`ref-${i}`}
              data={[
                { x: xDomainAligned[0], y: rl.y },
                { x: xDomainAligned[1], y: rl.y },
              ]}
              style={{
                data: {
                  stroke: REF_STROKE,
                  strokeWidth: 1.5,
                  opacity: 1,
                  strokeDasharray: "6,5",
                },
              }}
            />
          ))}
          {referenceLines.map((rl, i) => (
            <VictoryScatter
              key={`ref-label-${i}`}
              data={[{ x: xDomainAligned[1], y: rl.y }]}
              size={0}
              labels={[rl.label]}
              labelComponent={
                <VictoryLabel
                  dx={-65}
                  textAnchor="start"
                  style={{
                    fontFamily:
                      'interVariable, "interVariable Fallback", inter',
                    fontWeight: 600,
                    fill: getThemeColor(METAC_COLORS.purple[700]),
                  }}
                />
              }
            />
          ))}

          <VictoryScatter
            name="hoverPoints"
            data={hoverPoints}
            x="x"
            y="y"
            size={14}
            style={{ data: { opacity: 0 } }}
          />

          {trend && (
            <VictoryLine
              name="trend"
              data={trend}
              style={{
                data: {
                  stroke: getThemeColor(METAC_COLORS["mc-option"][3]),
                  strokeWidth: 1.5,
                  strokeDasharray: "6,5",
                },
              }}
            />
          )}

          <VictoryScatter
            name="bgPoints"
            data={plotPoints}
            x="x"
            y="y"
            size={14}
            style={{ data: { opacity: 0 } }}
          />

          <VictoryScatter
            name="points"
            data={plotPoints}
            x="x"
            y="y"
            size={5}
            style={{
              data: {
                fill: ({ datum }) =>
                  colorForName((datum as { name: string }).name),
                opacity: ({ datum }) => {
                  const d = datum as { x: Date; y: number; name: string };
                  const isSota = labeledKeySet.has(pointKey(d));
                  return isSota ? 1 : 0.35;
                },
              },
            }}
          />

          <VictoryScatter
            name="labelsLayer"
            data={sotaPoints}
            x="x"
            y="y"
            size={6}
            labels={({ datum }) => labelText(datum as { name?: string })}
            labelComponent={
              <EdgeAwareLabel
                chartWidth={width}
                padLeft={edgePadLeft}
                padRight={edgePadRight}
                minGap={10}
                fontSizePx={smUp ? 16 : 12}
                dy={8}
                style={labelStyle}
              />
            }
            style={{ data: { opacity: 0 } }}
          />

          <VictoryScatter
            name="sotaStars"
            data={sotaPoints}
            x="x"
            y="y"
            size={7}
            symbol="star"
            style={{
              data: {
                fill: ({ datum }) =>
                  colorForName((datum as { name: string }).name),
                stroke: getThemeColor(METAC_COLORS.gray[0]),
                strokeWidth: 0.5,
              },
            }}
          />
        </VictoryChart>
      )}

      {legend?.length ? (
        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-[14px] gap-y-2 antialiased sm:gap-x-8 sm:gap-y-3">
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
            ) : "trend" in item ? (
              <LegendTrend
                key={`legend-trend-${i}`}
                color={getThemeColor(METAC_COLORS["mc-option"][3])}
                label={item.label}
              />
            ) : (
              <LegendStar key={`legend-sota-${i}`} label={item.label} />
            )
          )}
        </div>
      ) : null}
    </div>
  );
};

const LegendDot: FC<{ color: string; label: string }> = ({ color, label }) => (
  <span className="inline-flex items-center gap-1.5">
    <span
      aria-hidden
      className="inline-block h-[14px] w-[14px] rounded-full"
      style={{ backgroundColor: color }}
    />
    <span className="text-base text-gray-900 dark:text-gray-900-dark sm:text-lg">
      {label}
    </span>
  </span>
);

const LegendTrend: FC<{ color: string; label: string }> = ({
  color,
  label,
}) => (
  <span className="inline-flex items-center gap-1.5">
    <span className="relative inline-block h-[3px] w-5">
      <span
        aria-hidden
        className="absolute left-0 top-1/2 w-full -translate-y-1/2"
        style={{ borderTop: `2px dashed ${color}` }}
      />
    </span>
    <span className="text-base text-gray-900 dark:text-gray-900-dark sm:text-lg">
      {label}
    </span>
  </span>
);

const LegendStar: FC<{ label: string }> = ({ label }) => (
  <span className="inline-flex items-center gap-1.5">
    <span
      aria-hidden
      className="inline-flex h-[14px] w-[14px] items-center justify-center"
      title="SOTA"
    >
      <span className="text-base leading-none">★</span>
    </span>
    <span className="text-base text-gray-900 dark:text-gray-900-dark sm:text-lg">
      {label}
    </span>
  </span>
);

const GRIDLINES = 5;
const safeIndex = (i: CallbackArgs["index"]) => (typeof i === "number" ? i : 0);
function buildTimeTicks(min: Date, max: Date, target: number): Date[] {
  const monthDiff =
    (max.getFullYear() - min.getFullYear()) * 12 +
    (max.getMonth() - min.getMonth());
  const steps = [1, 2, 3, 4, 6, 12];
  const step = steps.find((s) => Math.ceil(monthDiff / s) + 1 <= target) ?? 12;
  const start = new Date(
    min.getFullYear(),
    Math.floor(min.getMonth() / step) * step,
    1
  );

  const ticks: Date[] = [];
  for (
    let d = new Date(start);
    d <= max;
    d = new Date(d.getFullYear(), d.getMonth() + step, 1)
  ) {
    ticks.push(d);
  }
  if (ticks.length === 0 || +(ticks[ticks.length - 1] ?? 0) < +max) {
    ticks.push(new Date(max.getFullYear(), max.getMonth(), 1));
  }
  return ticks;
}

export default AIBBenchmarkPerformanceChart;
