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
  const t = useTranslations();
  const { ref: wrapRef, width } = useContainerSize<HTMLDivElement>();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const smUp = useBreakpoint("sm");
  const REF_STROKE = getThemeColor(METAC_COLORS.gray[700]);

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
  const referenceLines = useMemo(() => {
    const seen = new Set<string>();
    const out: {
      y: number;
      label: string;
      kind?: ModelPoint["aggregateKind"];
    }[] = [];

    for (const d of data) {
      if (!d.isAggregate) continue;
      const key = `${d.aggregateKind ?? "other"}-${Math.round(d.score * 10)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ y: d.score, label: d.name, kind: d.aggregateKind });
    }
    return out;
  }, [data]);

  const referenceLabels = useMemo(() => {
    const byLabel = new Map<string, { y: number; label: string }>();
    for (const rl of referenceLines) {
      const prev = byLabel.get(rl.label);
      if (!prev || rl.y < prev.y)
        byLabel.set(rl.label, { y: rl.y, label: rl.label });
    }
    return Array.from(byLabel.values());
  }, [referenceLines]);

  const rightPad = referenceLines.length ? 64 : 40;

  const plotPoints = useMemo(
    () => points.filter((p, i) => !data[i]?.isAggregate),
    [points, data]
  );

  const orgOf = (name: string) => String(name).split(" ")[0] ?? name;
  const topIndexByOrg = useMemo(() => {
    const best = new Map<string, { i: number; y: number }>();
    for (const p of points) {
      const org = orgOf(p.name);
      const prev = best.get(org);
      if (!prev || p.y > prev.y) best.set(org, { i: p.i, y: p.y });
    }
    return new Map(Array.from(best.entries()).map(([org, v]) => [org, v.i]));
  }, [points]);

  const yMeta = useMemo(() => {
    const vals = points.map((p) => p.y);
    return getYMeta(vals, {
      gridlines: GRIDLINES,
      padMin: 2,
      padRatio: 0.1,
      clamp: [0, 100],
    });
  }, [points]);

  const xDomain = useMemo<[Date, Date]>(() => {
    if (points.length === 0) return [new Date(), new Date()];
    const xs = points.map((p) =>
      (p.x instanceof Date ? p.x : new Date(p.x)).getTime()
    );
    const min = new Date(Math.min(...xs));
    const max = new Date(Math.max(...xs));
    return [min, max];
  }, [points]);

  const targetTicks = smUp ? 5 : 3;

  const timeTicks = useMemo<Date[]>(() => {
    const [min, max] = xDomain;
    return buildTimeTicks(min, max, targetTicks);
  }, [xDomain, targetTicks]);

  const xDomainAligned = useMemo<[Date, Date]>(() => {
    const [dataMin, dataMax] = xDomain;
    const first = timeTicks[0] ?? dataMin;
    const lastTick = timeTicks[timeTicks.length - 1] ?? dataMax;
    const last = lastTick < dataMax ? dataMax : lastTick;
    return [first, last];
  }, [timeTicks, xDomain]);

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
            label={t("aibScore")}
            axisLabelComponent={
              <VictoryLabel angle={-90} dx={-10} dy={smUp ? -10 : 10} />
            }
            tickValues={yMeta.ticks}
            tickFormat={smUp ? (d: number) => Math.round(d) : () => ""}
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
                fontSize: 16,
                fontWeight: 400,
              },
            }}
          />

          <VictoryAxis
            label={t("aibModelReleaseDate")}
            axisLabelComponent={<VictoryLabel dy={28} />}
            tickFormat={(d: Date) =>
              d.toLocaleDateString(undefined, {
                month: "short",
                year: "numeric",
              })
            }
            tickValues={timeTicks}
            tickLabelComponent={<VictoryLabel dy={16} textAnchor="middle" />}
            style={{
              axis: { stroke: "transparent" },
              ticks: { stroke: "transparent" },
              tickLabels: {
                fill: getThemeColor(METAC_COLORS.gray[500]),
                fontSize: smUp ? 16 : 10,
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
              name={`ref-${i}`}
              data={[
                { x: xDomainAligned[0], y: rl.y },
                { x: xDomainAligned[1], y: rl.y },
              ]}
              style={{
                data: {
                  stroke: REF_STROKE,
                  strokeWidth: 1.5,
                  strokeDasharray: "4,8",
                  opacity: 0.7,
                },
              }}
            />
          ))}

          {referenceLabels.map((rl, i) => (
            <VictoryScatter
              key={`ref-label-${i}`}
              name={`ref-label-${i}`}
              data={[{ x: xDomainAligned[1], y: rl.y }]}
              size={0}
              labels={[rl.label]}
              labelComponent={
                <VictoryLabel
                  dx={-65}
                  textAnchor="start"
                  style={{
                    fill: getThemeColor(METAC_COLORS.gray[700]),
                    fontSize: smUp ? 14 : 12,
                    fontWeight: 600,
                    fontFamily:
                      'interVariable, "interVariable Fallback", inter',
                  }}
                />
              }
            />
          ))}

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
            data={plotPoints}
            x="x"
            y="y"
            size={14}
            style={{ data: { opacity: 0 } }}
          />

          <VictoryScatter
            data={plotPoints}
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
            data={plotPoints}
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
            labels={({ datum }) => {
              const { name, i } = datum as { name: string; i: number };
              if (smUp) return name;
              const topIndex = topIndexByOrg.get(orgOf(name));
              return topIndex === i ? name : "";
            }}
            style={{
              labels: {
                fill: (args: CallbackArgs) =>
                  colorForName((args.datum as { name: string })?.name || ""),
                fontSize: smUp ? 16 : 12,
                fontFamily: 'interVariable, "interVariable Fallback", inter',
              },
              data: { opacity: 0 },
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
  <span className="inline-flex items-center gap-1.5">
    <span
      aria-hidden
      className="inline-block h-[14px] w-[14px] rounded-full"
      style={{ background: color }}
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

const GRIDLINES = 5;
const NullLabel: React.FC<Record<string, unknown>> = () => null;
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
