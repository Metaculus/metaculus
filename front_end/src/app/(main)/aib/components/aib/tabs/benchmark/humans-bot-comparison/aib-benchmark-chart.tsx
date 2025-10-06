"use client";

import { FC, useMemo } from "react";
import {
  VictoryAxis,
  VictoryChart,
  VictoryLabel,
  VictoryLabelProps,
  VictoryLine,
  VictoryScatter,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";

import { AIB_THEME, BenchmarkPoint, SERIES_META, SeriesKey } from "./config";

type Props = {
  data: BenchmarkPoint[];
  className?: string;
};

const AIBBenchmarkChart: FC<Props> = ({ data, className }) => {
  const { ref, width } = useContainerSize<HTMLDivElement>();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  const { yDomain, ticks } = useMemo(() => {
    const values = data.flatMap((d) => [d.baseline, d.pros, d.bots]);
    const min = Math.min(...values);
    const max = Math.max(...values);

    const range = Math.max(1, max - min);
    const pad = Math.max(0.5, range * 0.1);
    const lo = Math.floor(min - pad);
    const hi = Math.ceil(max + pad);

    const step = (hi - lo) / (GRIDLINES - 1);
    const t = Array.from({ length: GRIDLINES }, (_, i) =>
      Number((lo + i * step).toFixed(6))
    );

    return { yDomain: [lo, hi] as [number, number], ticks: t };
  }, [data]);

  const lineStyle = (series: SeriesKey) => ({
    data: { stroke: colorOf(series), strokeWidth: 1.5 },
  });
  const pointStyle = (series: SeriesKey) => ({
    data: { fill: colorOf(series) },
  });

  const colorOf = (series: SeriesKey): string =>
    getThemeColor(AIB_THEME[SERIES_META[series].theme].token);

  return (
    <div
      ref={ref}
      id="fan-graph-container"
      className={className ?? "relative w-full"}
    >
      <div className="mb-9 flex w-full items-center justify-center gap-8 antialiased">
        {LEGEND.map(({ key, label }) => (
          <div key={key} className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-[14px] w-[14px] rounded-[2px]"
              style={{ background: colorOf(key) }}
            />
            <span className="text-lg font-[400] text-gray-900 dark:text-gray-900-dark">
              {label}
            </span>
          </div>
        ))}
      </div>

      {width === 0 && <div style={{ height: 360 }} />}
      {width > 0 && (
        <VictoryChart
          width={width}
          height={360}
          theme={chartTheme}
          domain={{ y: yDomain }}
          domainPadding={{ x: 20 }}
          padding={{ top: 16, bottom: 28 }}
          categories={{ x: data.map((d) => d.x) }}
        >
          <VictoryAxis
            dependentAxis
            tickValues={ticks}
            axisLabelComponent={<VictoryLabel dy={-28} />}
            style={{
              grid: {
                stroke: getThemeColor(METAC_COLORS.gray[400]),
                strokeWidth: 1,
                strokeDasharray: "2,5",
              },
              axis: { stroke: "transparent" },
              ticks: { stroke: "transparent" },
              tickLabels: { fill: "transparent" },
              axisLabel: { fill: "transparent" },
            }}
          />

          <VictoryAxis
            tickValues={data.map((d) => d.x)}
            tickFormat={(v: string | number) => String(v)}
            tickLabelComponent={<EdgeNudgedTickLabel dy={6} />}
            style={{
              axis: {
                stroke: "transparent",
              },
              ticks: { stroke: "transparent" },
              tickLabels: {
                fill: getThemeColor(METAC_COLORS.gray[600]),
                fontSize: 16,
              },
              grid: { stroke: "transparent" },
            }}
          />

          <VictoryLine
            data={data.map((d) => ({ x: d.x, y: d.baseline }))}
            style={lineStyle("baseline")}
          />
          <VictoryScatter
            data={data.map((d) => ({
              x: d.x,
              y: d.baseline,
              symbol: "square",
            }))}
            size={4}
            style={pointStyle("baseline")}
          />

          <VictoryLine
            data={data.map((d) => ({ x: d.x, y: d.pros }))}
            style={lineStyle("pros")}
          />
          <VictoryScatter
            data={data.map((d) => ({ x: d.x, y: d.pros, symbol: "square" }))}
            size={4}
            style={pointStyle("pros")}
          />

          <VictoryLine
            data={data.map((d) => ({ x: d.x, y: d.bots }))}
            style={lineStyle("bots")}
          />
          <VictoryScatter
            data={data.map((d) => ({ x: d.x, y: d.bots, symbol: "square" }))}
            size={4}
            style={pointStyle("bots")}
          />
        </VictoryChart>
      )}
    </div>
  );
};

const LEGEND: { key: SeriesKey; label: string }[] = [
  { key: "baseline", label: "Baseline (Sonnet 3.7)" },
  { key: "pros", label: "Pro Forecasters" },
  { key: "bots", label: "Bots" },
];

const GRIDLINES = 5;

type TickLabelProps = VictoryLabelProps & {
  index?: number;
  ticks?: unknown[];
};

const EdgeNudgedTickLabel: React.FC<TickLabelProps> = (props) => {
  const index = props.index ?? 0;
  const tickCount = props.ticks?.length ?? 0;
  const isFirst = index === 0;
  const isLast = tickCount > 0 && index === tickCount - 1;
  const dx = isFirst ? 24 : isLast ? -24 : 0;
  return <VictoryLabel {...props} dx={dx} />;
};

export default AIBBenchmarkChart;
